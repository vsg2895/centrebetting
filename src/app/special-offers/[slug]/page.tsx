import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSpecialOffer } from '@/lib/api'
import { buildBreadcrumbSchema, buildWebPageSchema, breadcrumbIdFor, jsonLdScript, SHARE_IMAGES } from '@/lib/seo'
import { resolveImageUrl } from '@/lib/images'
import { COPY } from '@/constants/copy'
import { SITE_URL } from '@/lib/config'
import BonusTerms from '@/components/BonusTerms'
import { CLAIMABLE_BONUS_CATEGORY } from '@/components/SpecialOfferCard'
import OfferVisitTracker from '@/components/OfferVisitTracker'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? ''

type Props = { params: Promise<{ slug: string }> }

/*
 * NO generateStaticParams, deliberately — this route renders on demand.
 *
 * Next classifies a dynamic route from what that function RETURNS: a non-empty
 * list builds `f` (dynamic), an EMPTY list builds a fully static route. A
 * static render then throws DYNAMIC_SERVER_USAGE, because the root layout
 * reads the session cookie for the header's account control and a static
 * render may not touch cookies — taking the whole route down with a 500 for
 * every slug, valid or not.
 *
 * Not hypothetical: that is exactly how /special-offers/[slug] broke on the
 * one site with no visible offers. It was reachable here too, because the
 * params lookup failed CLOSED to an empty list, so one API blip was enough to
 * change the build shape.
 *
 * Removing the function pins the route dynamic whatever the data does.
 * `force-dynamic` is deliberately NOT used: it would also downgrade fetchCache
 * to no-store and send every request to the API, where this leaves the
 * existing per-fetch cache and its tags exactly as they were.
 */

/**
 * The offer's own prose, as plain text — the field an editor actually writes.
 *
 * Measured on the live data before this existed: 18 of 29 offers carry no
 * `bonuses` value, and `bonuses` is a column on the GLOBAL `special_offers`
 * row — identical across every domain in the network, with only 8 distinct
 * values across 29 offers. Composed from it, every thin offer's meta
 * description came out as its title plus one sentence repeated on every sibling
 * page. `description` is the only one of the three that is unique per offer.
 */
function plainDescription(html: string | null | undefined): string {
  return (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Trimmed at a word boundary to the ~155 characters Google renders. */
function metaLength(text: string): string {
  return text.length <= 155 ? text : `${text.slice(0, 155).replace(/\s+\S*$/, '')}…`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const { data: offer } = await getSpecialOffer(slug)
    // This site's meta title / description, when the admin or the SEO seeder
    // set one (the API already resolves the site's own override over the
    // offer's default); otherwise the composed fallbacks below.
    const title = offer.meta_title?.trim() || offer.title
    /*
     * The written description first; the `bonuses` composition only as a
     * fallback for an offer nobody has written up yet — a content gap this file
     * cannot close, not something to paper over with longer boilerplate.
     */
    const prose = plainDescription(offer.description)
    const metaDescription = offer.meta_description?.trim() ?? ''
    const description = metaDescription !== ''
      ? metaLength(metaDescription)
      : prose !== ''
        ? metaLength(prose)
        : offer.bonuses
          ? `${offer.bonuses} — ${COPY.specialOffers.offerMetaSuffix}`
          : `${offer.title} — ${COPY.specialOffers.offerMetaSuffix}`
    return {
      title,
      description,
      alternates: { canonical: `/special-offers/${slug}` },
      openGraph: { type: 'article', url: `/special-offers/${slug}`, siteName: SITE_NAME, title, description, images: SHARE_IMAGES },
      // A hidden offer stays reachable by direct link so it can be reviewed,
      // but it must never enter the index. It is already absent from every
      // listing and from the sitemap; this stops a crawler that finds the URL
      // some other way (a shared link, a referrer) from indexing it.
      /*
       * TWO distinct gates.
       *
       * `!active` is the hard one: the offer is withdrawn, the page exists only
       * so an old link does not 404, and `follow: false` keeps it from passing
       * anything onward.
       *
       * `is_indexable` is the editorial one (SpecialOffer::isIndexable): true
       * unless an admin set noindex on this offer. Every other offer page is
       * indexed. `follow` stays true on a noindexed one: its casino and
       * category links are still worth following.
       *
       * The same flag filters the sitemap, so the two can never disagree.
       *
       * An EXPIRED offer joins the editorial gate, as on winpalack: it is
       * already gone from every listing, and left `index` it stayed in search
       * as a bonus nobody can claim. `follow` stays: the casino is still worth
       * a link.
       */
      ...(!offer.active
        ? { robots: { index: false, follow: false } }
        : offer.is_indexable === false || offer.terms?.expired === true
          ? { robots: { index: false, follow: true } }
          : {}),
    }
  } catch {
    return { title: COPY.errors.notFound }
  }
}

export default async function SpecialOfferDetailPage({ params }: Props) {
  const { slug } = await params

  let offer
  try {
    offer = (await getSpecialOffer(slug)).data
  } catch {
    notFound()
  }

  const banner = resolveImageUrl(offer.banner_image ?? offer.image_path)
  // The same rule the cards use: Claim is a property of the bonus TYPE.
  const claimable = offer.bonus_category_slug === CLAIMABLE_BONUS_CATEGORY
  const pageUrl = `${SITE_URL}/special-offers/${slug}`
  const breadcrumb = buildBreadcrumbSchema(
    [
      { name: 'Home', url: SITE_URL },
      { name: 'Special Offers', url: `${SITE_URL}/special-offers` },
      { name: offer.title, url: pageUrl },
    ],
    pageUrl,
  )
  /*
   * `Offer`, and deliberately NOT `SpecialAnnouncement`.
   *
   * SpecialAnnouncement is scoped to public-health and emergency notices;
   * applying it to a casino bonus is schema misuse that risks a manual action
   * rather than a rich result. `Offer` is the type that describes a promotion.
   *
   * ONLY FIELDS WE ACTUALLY HOLD. No `price`, no `priceCurrency`, no
   * `availabilityEnds` — this API exposes none of them, and an Offer carrying an
   * invented figure is worse than no Offer at all. `bonuses` gets no property of
   * its own either: it reads like "100% up to €500", and the Offer properties
   * that take a figure expect a number or a PriceSpecification, not a sentence.
   */
  const offerProse = plainDescription(offer.description)
  const offerSchema = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: offer.title,
    url: pageUrl,
    ...(offerProse !== ''
      ? { description: offerProse }
      : offer.bonuses
        ? { description: offer.bonuses }
        : {}),
    ...(offer.casino?.name
      ? { offeredBy: { '@type': 'Organization', name: offer.casino.name } }
      : {}),
    ...(offer.bonus_category_name ? { category: offer.bonus_category_name } : {}),
  }

  const graph = [
    buildWebPageSchema({
      name: offer.title,
      url: pageUrl,
      // The prose, not the shared `bonuses` line that is identical network-wide.
      description: offerProse !== '' ? offerProse : (offer.bonuses ?? undefined),
      breadcrumbId: breadcrumbIdFor(pageUrl),
      dateModified: offer.updated_at,
    }),
    breadcrumb,
    offerSchema,
  ]

  return (
    <>
      {/* Records this visit, but only if the visitor accepted in the
          cookie banner. Renders nothing and never blocks the page. */}
      <OfferVisitTracker specialOfferId={offer.id} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />

      <main className="pb-4">
        <div className="mx-auto max-w-[1200px] px-4">
          <nav className="flex flex-wrap gap-x-2 pt-[22px] text-[13px] text-muted" aria-label="Breadcrumb">
            <Link href="/" className="-mx-1 -my-3 inline-block px-1 py-3 transition-colors hover:text-brand">
              Home
            </Link>
            /
            <Link href="/special-offers" className="-mx-1 -my-3 inline-block px-1 py-3 transition-colors hover:text-brand">
              {COPY.nav.specialOffers}
            </Link>
            /
            <span className="font-semibold text-ink [overflow-wrap:anywhere]">{offer.title}</span>
          </nav>

          {/* The mockup's `.dh`: the artwork beside the offer panel from
              980px, stacked below. Without artwork the BONUS is set on the
              banner well instead; with neither, the panel takes the width. */}
          <div className={`mt-5 grid grid-cols-1 gap-5 ${banner || offer.bonuses ? 'min-[61.25rem]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]' : ''}`}>
            {banner ? (
              <div className="ban relative aspect-[16/6] overflow-hidden rounded-[20px] border border-line-soft min-[61.25rem]:aspect-auto min-[61.25rem]:min-h-[320px]">
                <Image
                  src={banner}
                  alt={offer.title}
                  fill
                  sizes="(max-width: 980px) 100vw, 640px"
                  preload
                  fetchPriority="high"
                  className="object-contain object-center"
                />
              </div>
            ) : (
              offer.bonuses && (
                // aria-hidden: the panel beside it states the same bonus as text.
                <div aria-hidden className="ban flex min-h-[200px] items-end overflow-hidden rounded-[20px] border border-line-soft p-7 min-[61.25rem]:min-h-[320px]">
                  <p className="font-display text-[clamp(36px,5vw,64px)] leading-none text-brand [overflow-wrap:anywhere]">{offer.bonuses}</p>
                </div>
              )
            )}

            {/* The offer panel — the mockup's `.side` on the cream paper. */}
            <header className="flex flex-col justify-center gap-3.5 rounded-[20px] bg-card p-6 text-card-ink">
              {(offer.bonus_category_name || offer.casino?.name) && (
                <p className="lab lab-card">{[offer.bonus_category_name, offer.casino?.name].filter(Boolean).join(' · ')}</p>
              )}
              <h1 className="font-display text-[clamp(28px,3.2vw,38px)] leading-[1.1] [overflow-wrap:anywhere]">{offer.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-card-soft">
                <span className="leading-none tracking-[1px] text-gold" role="img" aria-label={`${offer.rating} out of 5`}>
                  {'★'.repeat(offer.rating)}
                  <span className="text-star-empty" aria-hidden>
                    {'★'.repeat(5 - offer.rating)}
                  </span>
                </span>
                <span className="tabular-nums">{offer.rating.toFixed(1)}</span>
                {offer.casino && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      Offer by{' '}
                      <Link href={`/casinos/${offer.casino.slug}`} className="text-pine underline underline-offset-2 hover:text-card-ink">
                        {offer.casino.name}
                      </Link>
                    </span>
                  </>
                )}
              </div>
              {offer.bonuses && <p className="font-display text-2xl leading-[1.2] text-pine [overflow-wrap:anywhere]">{offer.bonuses}</p>}

              {/* An EXPIRED offer keeps its page — the URL stays valid and the
                  terms stay readable — but it must never be presented as
                  claimable. The CTA is replaced with a plain statement rather
                  than removed silently, so a visitor who followed an old link
                  understands why there is nothing to press. */}
              {offer.terms?.expired ? (
                <p className="rounded-xl border border-card-line bg-white px-5 py-4 text-[14px] font-semibold text-card-soft">
                  This offer ended
                  {offer.terms.expires_at ? (
                    <> on <time dateTime={offer.terms.expires_at}>{offer.terms.expires_at}</time></>
                  ) : null}
                  . It is no longer available to claim.{' '}
                  <Link href="/special-offers" className="underline underline-offset-2 hover:text-card-ink">
                    See current offers
                  </Link>
                </p>
              ) : (
                // Claim belongs to the Special Offers bonus type, matching the
                // cards — see CLAIMABLE_BONUS_CATEGORY in SpecialOfferCard.
                claimable && offer.affiliate_url && (
                  <a href={offer.affiliate_url} target="_blank" rel="nofollow sponsored noopener" className="btn-g min-h-12 px-[22px] text-[15px] sm:min-w-64 sm:self-start min-[61.25rem]:self-stretch">
                    {COPY.specialOffers.claim}
                  </a>
                )
              )}
              {offer.casino && (
                <Link href={`/casinos/${offer.casino.slug}`} className="btn-l min-h-12 px-[22px] text-[15px] sm:min-w-64 sm:self-start min-[61.25rem]:self-stretch">
                  Read the full review <span aria-hidden>→</span>
                </Link>
              )}
              {/* Compliance under the CTA: read beside the button it qualifies. */}
              <p className="text-xs text-card-muted">
                18+. T&amp;Cs apply — read the full conditions on the operator&apos;s own site before
                depositing.{' '}
                <Link href="/responsible-gambling" className="underline underline-offset-2 hover:text-card-ink">
                  Play responsibly
                </Link>
                .
              </p>
            </header>
          </div>

          {/* The terms BEFORE the sales copy: a reader deciding whether to
              deposit reads the wagering requirement first. */}
          {offer.terms && <BonusTerms terms={offer.terms} />}

          {offer.description && (
            <section className="mt-10" aria-labelledby="about-offer">
              <h2 id="about-offer" className="font-display text-[clamp(30px,3.6vw,44px)] leading-none text-ink">
                About this offer
              </h2>
              <div
                className="prose mt-4 max-w-[72ch] prose-p:text-[17px] prose-p:leading-[1.8]"
                dangerouslySetInnerHTML={{ __html: offer.description }}
              />
            </section>
          )}
        </div>
      </main>
    </>
  )
}

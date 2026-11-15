import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { getCasinos, getCasino } from '@/lib/api'
import { buildCasinoReviewSchema, buildBreadcrumbSchema, buildWebPageSchema, breadcrumbIdFor, jsonLdScript, SHARE_IMAGES } from '@/lib/seo'
import { resolveImageUrl } from '@/lib/images'
import CasinoSpecialOffers from '@/components/CasinoSpecialOffers'
import CasinoReviews from '@/components/CasinoReviews'
import { COPY } from '@/constants/copy'
import type { CasinoDetail } from '@shared/types/casinoDetail'
import { SITE_URL } from '@/lib/config'

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const { data: casino } = await getCasino(slug)
    const title = casino.meta_title ?? `${casino.name} Review`
    // A casino record is shared by every site, so the fallback must carry THIS
    // site's voice — otherwise all four domains ship the same description for
    // the same casino. An admin-set meta_description still wins, and is shared
    // by design; per-site overrides would need columns on the casino_site pivot.
    // An admin-entered meta_description is shared master data, so this site's
    // short signature is appended rather than the value being used verbatim —
    // otherwise filling the field in the admin would put the identical
    // description back on all four domains. No value set: fall back to the
    // site's own full line.
    const description = casino.meta_description
      ? `${casino.meta_description} ${COPY.casinos.reviewSignature}`
      : `${casino.name} — ${COPY.casinos.reviewSummary}`
    // The `title` above is the casino's own meta_title — shared master data, so
    // it is byte-identical on every domain in the network. The share card is
    // where that was most visible: six results, one headline. This site's tail
    // makes the card its own without touching the shared record.
    const shareTitle = `${title} — ${COPY.casinos.reviewTitleTail}`
    // Share cards fell back to the site-wide generated card, so every casino
    // shared identically. The operator's own banner (or logo) is a truthful,
    // page-specific image and needs no extra asset.
    const shareImage = resolveImageUrl(casino.banner_image ?? casino.image_path)
    const images = shareImage
      ? [{ url: shareImage, alt: `${casino.name} — reviewed by ${SITE_NAME}` }]
      : undefined
    return {
      title,
      description,
      alternates: { canonical: `/casinos/${slug}` },
      // No banner and no logo: the site card, not an image-less large card.
      openGraph: { type: 'article', url: `/casinos/${slug}`, siteName: SITE_NAME, title: shareTitle, description, images: images ?? SHARE_IMAGES },
      twitter: { card: 'summary_large_image', title: shareTitle, description, images: shareImage ? [shareImage] : SHARE_IMAGES },
    }
  } catch {
    return { title: COPY.errors.notFound }
  }
}

/**
 * Resolve a TRUNCATED slug to the real one, or return null.
 *
 * Search Console reported `/casinos/7` as a 404. There is no casino "7" and
 * there never was: slugs come from the operator name via spatie/sluggable, and
 * not one of them is numeric. What does exist is `7-bit-casino` — and cutting
 * that at its first hyphen gives exactly the URL that was crawled. Email
 * clients, chat apps and some link parsers end a URL at punctuation, so a
 * hyphenated slug is the one shape that reliably arrives truncated.
 *
 * A PREFIX, and only up to the hyphen. `startsWith(fragment + '-')` means the
 * fragment has to end where a slug segment ends, so `/casinos/7` can reach
 * `7-bit-casino` but `/casinos/bit` cannot reach `bitstarz` — that would be
 * guessing at a substring rather than restoring a cut.
 *
 * EXACTLY ONE MATCH, or nothing. With `7-bit-casino` and a hypothetical
 * `7-bit-casino-vip` both present, `/casinos/7` is genuinely ambiguous and a
 * redirect would be picking one on the visitor's behalf. Ambiguity falls
 * through to the 404, which is the honest answer.
 *
 * Costs nothing on the happy path: it is only reached when `getCasino()` has
 * already failed, and `getCasinos()` is the same cached, `casinos`-tagged fetch
 * the listing and the sitemap use.
 */
async function resolveTruncatedSlug(fragment: string): Promise<string | null> {
  // A fragment that already contains a hyphen is not a cut at a segment
  // boundary — it is just a wrong slug. Bail before spending the fetch.
  if (fragment === '' || fragment.includes('-')) return null

  try {
    const { data: casinos } = await getCasinos()
    const matches = casinos.filter((c) => c.slug.startsWith(`${fragment}-`))

    return matches.length === 1 ? matches[0].slug : null
  } catch {
    // The list being unreachable must not turn a 404 into a 500.
    return null
  }
}

export default async function CasinoDetailPage({ params }: Props) {
  const { slug } = await params

  let casino
  try {
    casino = (await getCasino(slug)).data
  } catch {
    /*
     * Before 404ing, try the one recoverable case: a slug truncated at a
     * hyphen. `permanentRedirect` is a 308, not a 301 — the App Router cannot
     * set an arbitrary status from a page, and 308 is the permanent redirect
     * that preserves the method. Google treats the two identically for
     * canonicalisation, so the signal is the same one a 301 would send.
     */
    const real = await resolveTruncatedSlug(slug)

    if (real !== null) permanentRedirect(`/casinos/${real}`)

    notFound()
  }

  const banner = resolveImageUrl(casino.banner_image)
  const logo = resolveImageUrl(casino.image_path)
  const pageUrl = `${SITE_URL}/casinos/${slug}`
  // Facts for the at-a-glance tiles.
  const categoryCount = (casino.categories ?? []).length
  const liveOffers = (casino.special_offers ?? []).length
  // The short at-a-glance tiles (every one but the regions list). On a phone
  // they sit two across, and with an odd number the last would sit alone
  // beside an empty cell, so it takes the whole row. From `sm` they are one
  // row of exactly that many columns, so none is ever left on its own.
  const shortTiles = ['score', liveOffers > 0 && 'offers', categoryCount > 0 && 'categories', casino.reviewed_at && 'read'].filter(Boolean)
  const loneTile = shortTiles.length % 2 === 1 ? shortTiles[shortTiles.length - 1] : null
  // The factual profile, as the rows of the mockup's "Licence, cashier &
  // games" sheet. Only fields with a value become a row; no row, no sheet.
  const sheetRows = profileRows(casino.detail)
  const reviewSchema = buildCasinoReviewSchema(casino)
  const breadcrumb = buildBreadcrumbSchema(
    [
      { name: 'Home', url: SITE_URL },
      { name: 'Casinos', url: `${SITE_URL}/casinos` },
      { name: casino.name, url: pageUrl },
    ],
    pageUrl,
  )
  // One graph per page: the WebPage node anchors this URL into the site graph
  // and points at its own breadcrumb, so the review and the trail are read as
  // parts of one page rather than three unrelated blocks.
  const graph = [
    buildWebPageSchema({
      name: `${casino.name} Review`,
      url: pageUrl,
      // Same composition as the <meta> description in generateMetadata. Passing
      // the raw shared `meta_description` here put an identical WebPage
      // description on all six domains for the same casino.
      description: casino.meta_description
        ? `${casino.meta_description} ${COPY.casinos.reviewSignature}`
        : `${casino.name} — ${COPY.casinos.reviewSummary}`,
      breadcrumbId: breadcrumbIdFor(pageUrl),
      dateModified: casino.updated_at,
    }),
    breadcrumb,
    reviewSchema,
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />

      <main className="pb-4">
        <div className="mx-auto max-w-[1200px] px-4">
          <nav className="flex flex-wrap gap-x-2 pt-[22px] text-[13px] text-muted" aria-label="Breadcrumb">
            <Link href="/" className="-mx-1 -my-3 inline-block px-1 py-3 transition-colors hover:text-brand">
              Home
            </Link>
            /
            <Link href="/casinos" className="-mx-1 -my-3 inline-block px-1 py-3 transition-colors hover:text-brand">
              Casinos
            </Link>
            /
            <span className="font-semibold text-ink [overflow-wrap:anywhere]">{casino.name}</span>
          </nav>

          {/* The mockup's `.dh`: the banner beside the score panel from 980px,
              stacked below. The banner is the operator's artwork whole on the
              espresso glow; without artwork the BONUS is set there instead,
              and a casino with neither gives the panel the full width. */}
          <div className={`mt-5 grid grid-cols-1 gap-5 ${banner || casino.bonuses ? 'min-[61.25rem]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]' : ''}`}>
            {banner ? (
              <div className="ban relative aspect-[16/5] overflow-hidden rounded-[20px] border border-line-soft min-[61.25rem]:aspect-auto min-[61.25rem]:min-h-[320px]">
                <Image
                  src={banner}
                  alt={`${casino.name} banner`}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 980px) 100vw, 640px"
                  preload
                  fetchPriority="high"
                />
              </div>
            ) : (
              casino.bonuses && (
                // aria-hidden: the panel beside it states the same bonus as text.
                <div aria-hidden className="ban flex min-h-[200px] items-end overflow-hidden rounded-[20px] border border-line-soft p-7 min-[61.25rem]:min-h-[320px]">
                  <p className="font-display text-[clamp(36px,5vw,64px)] leading-none text-brand [overflow-wrap:anywhere]">{casino.bonuses}</p>
                </div>
              )
            )}

            {/* The score panel — the mockup's `.side` on the cream paper. */}
            <header className="flex flex-col justify-center gap-3.5 rounded-[20px] bg-card p-6 text-card-ink">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {logo && (
                  <Image
                    src={logo}
                    alt={`${casino.name} logo`}
                    width={224}
                    height={152}
                    sizes="112px"
                    className="h-[76px] w-28 shrink-0 rounded-xl border border-card-line bg-white object-contain p-1.5"
                  />
                )}
                <div className="min-w-0">
                  <h1 className="font-display text-[clamp(34px,4vw,48px)] leading-none [overflow-wrap:anywhere]">{casino.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-card-soft">
                    <span className="leading-none tracking-[1px] text-gold" role="img" aria-label={`${casino.rating} out of 5`}>
                      {'★'.repeat(casino.rating)}
                      <span className="text-star-empty" aria-hidden>
                        {'★'.repeat(5 - casino.rating)}
                      </span>
                    </span>
                    <span className="tabular-nums">{casino.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              {casino.bonuses && <p className="font-display text-2xl leading-[1.2] text-pine [overflow-wrap:anywhere]">{casino.bonuses}</p>}
              <a
                href={casino.attachment.affiliate_url}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="btn-g min-h-12 px-[22px] text-[15px] sm:min-w-64 sm:self-start min-[61.25rem]:self-stretch"
              >
                {COPY.casinos.visitCasino}
              </a>
              {/* T&Cs, immediately under the CTA rather than in the footer.
                  A visible terms line beside every bonus figure is a
                  compliance requirement, and the operator's own terms are the
                  only place the full conditions exist. */}
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

          {/* At a glance — the mockup's `.glance` tiles. Every tile is
              conditional: a casino with no offers or no categories simply
              renders fewer of them. */}
          <section className="mt-10" aria-labelledby="at-a-glance">
            <h2 id="at-a-glance" className={H2D}>
              {casino.name} {COPY.casinos.glanceHeadingTail}
            </h2>
            <dl className={`mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 ${GLANCE_COLS[shortTiles.length]}`}>
              <Glance label={COPY.casinos.rating} wide={loneTile === 'score'}>{casino.rating} out of 5</Glance>
              {liveOffers > 0 && (
                <Glance label="Bonuses listed" wide={loneTile === 'offers'}>
                  {liveOffers} {liveOffers === 1 ? 'bonus' : 'bonuses'} on this page
                </Glance>
              )}
              {categoryCount > 0 && (
                <Glance label="Listed under" wide={loneTile === 'categories'}>
                  {categoryCount} {categoryCount === 1 ? 'category' : 'categories'}
                </Glance>
              )}
              {/* `reviewed_at` is the date a PERSON last read this operator —
                  not `updated_at`, which any field edit bumps. Null means
                  nobody has recorded a reading, and this site must not imply
                  one happened, so the tile is simply absent. */}
              {casino.reviewed_at && (
                <Glance label="Last read" wide={loneTile === 'read'}>
                  <time dateTime={casino.reviewed_at}>
                    {new Date(casino.reviewed_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                </Glance>
              )}
              {/* Where the operator accepts players from. Real, attached data —
                  the full list here, where there is room for it, rather than
                  the card's first two. */}
              {casino.countries && casino.countries.length > 0 && (
                <Glance label="Accepts players from" full>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {casino.countries.map((country) => (
                      <span key={country.id} className="rounded-full bg-win-bg px-2.5 py-[3px] font-sans text-[13px] font-semibold text-win">
                        {country.name}
                      </span>
                    ))}
                  </span>
                </Glance>
              )}
            </dl>
          </section>

          {/* The factual profile — the mockup's `.sheet` on the cream paper.
              Only the fields that hold a value. */}
          {sheetRows.length > 0 && (
            <section className="mt-4 overflow-hidden rounded-[20px] bg-card text-card-ink" aria-labelledby="profile-heading">
              <h2 id="profile-heading" className="border-b border-dashed border-card-line px-[22px] py-4 font-display text-2xl">
                Licence, cashier &amp; games
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)]">
                {sheetRows.map((row, i) => {
                  const last = i === sheetRows.length - 1
                  return (
                    <div key={row.label} className="contents">
                      <dt className={`px-[22px] pb-0.5 pt-[13px] text-[15px] font-semibold text-card-muted sm:pb-[13px] ${last ? '' : 'sm:border-b sm:border-card-line'}`}>{row.label}</dt>
                      <dd className={`px-[22px] pb-[13px] pt-0.5 text-[15px] font-medium [overflow-wrap:anywhere] sm:pt-[13px] ${last ? '' : 'border-b border-card-line'}`}>
                        {Array.isArray(row.value) ? (
                          <span className="flex flex-wrap gap-1.5">
                            {row.value.map((v) => (
                              <span key={v} className="rounded-full border border-card-line bg-white px-2.5 py-[3px] text-[13px] font-semibold">{v}</span>
                            ))}
                          </span>
                        ) : (
                          row.value
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          )}

          {(casino.description || (casino.categories && casino.categories.length > 0)) && (
            <section className="mt-10" aria-labelledby="full-review">
              <h2 id="full-review" className={H2D}>Full review</h2>
              {casino.description && (
                <div
                  className="prose mt-4 max-w-[72ch] prose-p:text-[17px] prose-p:leading-[1.8]"
                  dangerouslySetInnerHTML={{ __html: casino.description }}
                />
              )}

              {casino.categories && casino.categories.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2" role="list" aria-label="Listed under">
                  {casino.categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/categories/${c.slug}`}
                        className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-line-soft px-3.5 text-sm font-medium text-ink transition-colors hover:border-brand"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <CasinoSpecialOffers offers={casino.special_offers ?? []} logo={logo} />

          {/* Renders nothing at all until this site's "Visitor reviews"
              switch is on in the admin — the component gates itself on the
              endpoint's 404, so no per-site conditional is needed here. */}
          <CasinoReviews casinoSlug={casino.slug} casinoName={casino.name} />
        </div>
      </main>
    </>
  )
}

/** A detail-page section heading — the mockup's `.h2d`. */
const H2D = 'font-display text-[clamp(30px,3.6vw,44px)] leading-none text-ink [overflow-wrap:anywhere]'

/** The at-a-glance row from `sm`: one column per short tile. Literal classes, so Tailwind sees them. */
const GLANCE_COLS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

/** One at-a-glance tile — the mockup's `.gl`. */
function Glance({ label, wide = false, full = false, children }: { label: string; wide?: boolean; full?: boolean; children: React.ReactNode }) {
  // `wide`: a short tile that would sit alone on a phone takes that whole
  // row. `full`: the regions list, a row of its own at every width.
  const span = full ? 'col-span-full' : wide ? 'col-span-2 sm:col-auto' : ''
  return (
    <div className={`min-w-0 rounded-2xl border-[1.5px] border-line bg-paper px-3.5 py-3.5 sm:p-[18px] ${span}`}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1.5 font-display text-[19px] leading-[1.2] text-ink [overflow-wrap:anywhere] sm:text-[22px]">{children}</dd>
    </div>
  )
}

type SheetRow = { label: string; value: string | string[] }

/** The profile fields that hold a value, in the mockup's order. */
function profileRows(detail: CasinoDetail | undefined): SheetRow[] {
  if (!detail) return []
  const launched = [detail.established_year, detail.company].filter(Boolean).join(' · ')
  const rows: (SheetRow | false)[] = [
    launched !== '' && { label: 'Launched', value: launched },
    detail.licences.length > 0 && { label: detail.licences.length === 1 ? 'Licence' : 'Licences', value: detail.licences.join(' · ') },
    detail.payment_methods.length > 0 && { label: 'Payment methods', value: detail.payment_methods },
    detail.currencies.length > 0 && { label: 'Currencies', value: detail.currencies },
    !!detail.min_deposit && { label: 'Minimum deposit', value: detail.min_deposit },
    !!detail.withdrawal_time && { label: 'Withdrawal time', value: detail.withdrawal_time },
    !!detail.withdrawal_limit && { label: 'Withdrawal limit', value: detail.withdrawal_limit },
    detail.game_providers.length > 0 && { label: 'Game providers', value: detail.game_providers },
  ]
  return rows.filter((r): r is SheetRow => r !== false)
}

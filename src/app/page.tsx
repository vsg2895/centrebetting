import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBonusArea, getCategories, getCategory, getSpecialOffers } from '@/lib/api'
import type { BonusSection } from '@/lib/api'
import { buildItemListSchema, buildWebPageSchema, jsonLdScript, buildFaqSchema, SHARE_IMAGES } from '@/lib/seo'
import { COPY } from '@/constants/copy'
import { FAQ_ITEMS } from '@/constants/faq'
import CasinoCard, { CASINO_GRID } from '@/components/CasinoCard'
import BonusTabs from '@/components/BonusTabs'
import CategoryNav from '@/components/CategoryNav'
import FaqGrid from '@/components/FaqGrid'
import SpecialOfferCard, { OFFER_GRID } from '@/components/SpecialOfferCard'
import type { Category } from '@shared/types/category'
import type { CasinoWithAttachment } from '@shared/types/casino'
import type { SpecialOffer } from '@shared/types/specialOffer'
import { SITE_URL } from '@/lib/config'
import { casinosHeading } from '@/lib/categories'

/** Offers shown per bonus type in the home page's Bonuses section — one tab's panel. */
const HOME_BONUSES_PER_CATEGORY = 3

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? ''
const YEAR = new Date().getFullYear()

type Props = { searchParams: Promise<{ category?: string; page?: string }> }

// Resolve the selected category (default = first/highest-priority) for the home casinos section.
async function resolveCategory(searchParams: Props['searchParams']) {
  const sp = await searchParams
  const categories = (await getCategories()).data
  const selected =
    sp.category && categories.some((c) => c.slug === sp.category) ? sp.category : categories[0]?.slug
  return { categories: categories as Category[], selected }
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `${COPY.home.homeTitle} ${YEAR} | ${SITE_NAME}`
  const description = COPY.home.metaDescription
  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', url: '/', siteName: SITE_NAME, title, description, images: SHARE_IMAGES },
    twitter: { card: 'summary_large_image', title, description, images: SHARE_IMAGES },
  }
}

export default async function HomePage({ searchParams }: Props) {
  /*
   * THE HOME PAGE HAS ONE PAGE, so `?page=2` is a page past the end.
   *
   * Nothing here is paginated (the full list is /casinos), yet `/?page=2` and
   * every other number a crawler guessed answered 200 with the whole home page
   * and an `index` robots tag: a duplicate of `/` at a URL of its own. A 404
   * says it is not a page at all, the rule every paginated listing here applies
   * past its last page. `?page=1` never reaches this: proxy.ts 301s it to `/`.
   */
  if (Math.max(1, Number((await searchParams).page) || 1) > 1) notFound()

  const { categories, selected } = await resolveCategory(searchParams)

  const [categoryRes, offersRes, anyOffersRes, bonusRes] = await Promise.allSettled([
    selected ? getCategory(selected) : Promise.resolve(null),
    getSpecialOffers(selected, 6),
    // Site-wide, unfiltered, limit 1 — just "does a visible offer exist at all?".
    // Runs alongside the others, so it costs no extra round-trip of latency, and
    // the public endpoint already excludes offers whose visibility is off.
    getSpecialOffers(undefined, 1),
    // The bonus TYPES for the folder tabs: each type brings its first
    // HOME_BONUSES_PER_CATEGORY offers for its panel, and its count over the
    // unlimited set for its tab. allSettled means a site without the Bonus
    // area renders no tabs, and falls back to the plain Special offers grid.
    getBonusArea(HOME_BONUSES_PER_CATEGORY),
  ])

  // Empty when the site does not publish the Bonus area, or when the
  // request failed — the strip renders nothing either way.
  const bonusSections: BonusSection[] = bonusRes.status === 'fulfilled' ? bonusRes.value : []

  const catData =
    categoryRes.status === 'fulfilled' && categoryRes.value ? categoryRes.value.data : null
  const casinos: CasinoWithAttachment[] = catData?.casinos ?? []
  const activeCategory = catData?.category ?? null
  // "See More" is only an affordance when there is actually more: compare the
  // category's full count against the rows this page received, rather than
  // hard-coding the page size on both sides where the two could drift apart.
  const hasMoreCasinos = (catData?.meta?.total ?? 0) > casinos.length
  // Offers are already scoped to the selected category and capped by the backend (?category=&limit=).
  const topOffers: SpecialOffer[] = offersRes.status === 'fulfilled' ? offersRes.value.data : []

  // Whether ANY special offer is visible on this site. Drives the hero CTA:
  // a button leading to an empty page is worse than no button. On a failed
  // request this stays false, so the CTA hides rather than promising content
  // that may not be there.
  const anyOffersVisible: boolean =
    anyOffersRes.status === 'fulfilled' && anyOffersRes.value.data.length > 0

  // Organization schema is emitted site-wide from the root layout; the home
  // page only adds its page-specific ItemList of top casinos.
  //
  // The list is the SELECTED category, not the whole catalogue, so it is named
  // and addressed as that category — it previously claimed the generic name
  // "Top Casinos at <brand>" and pointed at /casinos, describing neither the
  // rows below it nor a URL that renders them.
  const listSchema = buildItemListSchema(
    activeCategory ? `${activeCategory.name} — ${COPY.home.topCasinosTitle}` : COPY.home.topCasinosTitle,
    selected ? `${SITE_URL}/categories/${selected}` : `${SITE_URL}/casinos`,
    casinos.map((c, i) => ({ position: i + 1, name: c.name, url: `${SITE_URL}/casinos/${c.slug}` })),
  )

  const graph = [
    buildWebPageSchema({
      // Mirrors the actual <title>. The previous "Best Online Casinos <year>"
      // was generic boilerplate shipped identically by the sibling domains and
      // matched neither this page's title nor its H1.
      name: `${COPY.home.homeTitle} ${YEAR}`,
      url: SITE_URL,
      description: COPY.home.metaDescription,
    }),
    listSchema,
    // Same array the section below renders — markup-only FAQ is a violation.
    buildFaqSchema(SITE_URL, FAQ_ITEMS),
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />

      <main>
        {/* Hero — the mockup's `.hero`: centred, the chip, the claim with its
            green phrase, and the two ways in. */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-[1200px] px-4 pb-12 pt-14 text-center sm:pb-16 sm:pt-[72px]">
            <p className="chip-dot inline-flex items-center gap-2 rounded-full border border-line-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
              {COPY.home.heroEyebrow}
            </p>
            <h1 className="mx-auto mt-[22px] max-w-[960px] font-display text-[clamp(42px,12vw,46px)] leading-[0.98] text-balance [overflow-wrap:break-word] sm:text-[clamp(46px,7vw,96px)]">
              {COPY.home.heroHeadline} <em className="text-brand">{COPY.home.heroHighlight}</em>
            </h1>
            <p className="mx-auto mt-[22px] max-w-[640px] text-lg text-ink-soft">{COPY.home.heroSubtitle}</p>
            <div className="mt-[30px] flex flex-wrap justify-center gap-3">
              <Link href="/casinos" className="btn-g min-h-12 px-[22px] text-[15px]">
                {COPY.home.featuredCasinos}
              </Link>
              {anyOffersVisible && (
                <Link href="/special-offers" className="btn-o min-h-12 px-[22px] text-[15px]">
                  {COPY.home.specialOffers}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Compare — the category pills, then the cards. */}
        <section className="py-14 sm:py-[72px]" aria-labelledby="top-casinos-heading">
          <div className="mx-auto max-w-[1200px] px-4">
            <p className="lab">{COPY.home.compareLabel}</p>
            <h2 id="top-casinos-heading" className={`mt-2.5 ${SECTION_H2}`}>
              {COPY.home.topCasinosTitle}
            </h2>
            <p className="mt-3 max-w-[540px] text-ink-soft">{COPY.home.topCasinosSubtitle}</p>

            {categories.length > 0 && selected && (
              <div className="mt-6">
                <CategoryNav categories={categories} selected={selected} />
              </div>
            )}

            {casinos.length === 0 ? (
              <p className="mt-6 rounded-[20px] border border-dashed border-line-soft p-10 text-center text-muted">
                {COPY.casinos.noResults}
              </p>
            ) : (
              <ol className={`mt-6 ${CASINO_GRID}`}>
                {casinos.map((casino, i) => (
                  <CasinoCard key={casino.id} casino={casino} rank={i + 1} />
                ))}
              </ol>
            )}

            {activeCategory && hasMoreCasinos && (
              <div className="mt-6 flex justify-center">
                <Link href={`/categories/${selected}`} className="btn-o min-h-12 px-[22px] text-[15px]">
                  {COPY.home.seeMoreCasinos}<span className="sr-only"> — {casinosHeading(activeCategory.name)}</span> <span aria-hidden>→</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Bonuses — the folder-tab index, built from the same getBonusArea
            payload as the menus. A site without the Bonus area keeps the flat
            grid below. */}
        {bonusSections.length > 0 ? (
          <section className="pb-14 sm:pb-[72px]" aria-labelledby="bonus-heading">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="lab">{COPY.home.bonusLabel}</p>
                  <h2 id="bonus-heading" className={`mt-2.5 ${SECTION_H2}`}>
                    {COPY.home.bonusTypesTitle}
                  </h2>
                </div>
                <Link href="/special-offers" className="-my-3 inline-flex min-h-11 items-center py-3 font-semibold text-brand transition-colors hover:text-brand-dark">
                  {COPY.home.viewAllBonuses} <span aria-hidden className="ml-1">→</span>
                </Link>
              </div>
              <BonusTabs sections={bonusSections} />
            </div>
          </section>
        ) : topOffers.length > 0 && (
          <section className="pb-14 sm:pb-[72px]" aria-labelledby="offers-heading">
            <div className="mx-auto max-w-[1200px] px-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="lab">{COPY.home.bonusLabel}</p>
                  <h2 id="offers-heading" className={`mt-2.5 ${SECTION_H2}`}>
                    {COPY.home.specialOffers}
                  </h2>
                </div>
                <Link href="/special-offers" className="-my-3 inline-flex min-h-11 items-center py-3 font-semibold text-brand transition-colors hover:text-brand-dark">
                  {COPY.home.viewAll}<span className="sr-only"> bonus offers</span> <span aria-hidden className="ml-1">→</span>
                </Link>
              </div>
              <div className={`mt-6 ${OFFER_GRID}`}>
                {topOffers.map((offer) => (
                  <SpecialOfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* The yardstick — the four points every review covers, on the cream
            paper under a ruler. A statement of method, the same for every
            casino; it rates nothing. */}
        <section className="pb-14 sm:pb-[72px]" aria-labelledby="yardstick-heading">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="yard relative overflow-hidden rounded-3xl bg-card px-[18px] py-6 text-card-ink sm:p-8">
              <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                <div>
                  <p className="lab lab-card">{COPY.home.yardstickLabel}</p>
                  <h2 id="yardstick-heading" className="mt-1.5 font-display text-[clamp(30px,3.6vw,44px)] leading-[1.05]">
                    {COPY.home.yardstickTitle}
                  </h2>
                </div>
                <p className="max-w-[420px] text-[15.5px] text-card-soft">{COPY.home.yardstickBody}</p>
              </div>
              <ol className="mt-[26px] grid grid-cols-1 gap-3.5 sm:grid-cols-2 min-[61.25rem]:grid-cols-4">
                {COPY.home.yardstickPoints.map((point, i) => (
                  <li key={point.key} className="yt flex flex-col gap-1.5 overflow-hidden rounded-[18px] border-[1.5px] border-card-line bg-white px-[18px] pb-5">
                    <div aria-hidden className="tick -mx-[18px] mb-3.5 h-3" />
                    <div className="flex items-center justify-between">
                      <span aria-hidden className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-mint text-pine">
                        <PointIcon name={point.key} />
                      </span>
                      <span aria-hidden className="pn font-display text-[40px] leading-none text-card-line">
                        {i + 1}
                        <small className="ml-0.5 text-base">/{COPY.home.yardstickPoints.length}</small>
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-2xl leading-[1.1]">{point.title}</h3>
                    <p className="text-[14.5px] text-card-soft">{point.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Method — the three checks down a vertical ruler, a green dot on
            each (globals.css). Numbered because they ARE a sequence. */}
        <section className="pb-14 sm:pb-[72px]" aria-labelledby="method-heading">
          <div className="mx-auto max-w-[1200px] px-4">
            <p className="lab">{COPY.home.methodLabel}</p>
            <h2 id="method-heading" className={`mt-2.5 ${SECTION_H2}`}>
              {COPY.home.methodTitle}
            </h2>
            <p className="mt-3 max-w-[540px] text-ink-soft">{COPY.home.methodSubtitle}</p>
            <ol className="steps relative mt-[30px] flex flex-col pl-[52px] sm:pl-[74px]">
              {COPY.home.methodSteps.map((step) => (
                <li key={step.kicker} className="st relative border-b border-line pb-[30px] pt-5 last:border-b-0 last:pb-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{step.kicker}</p>
                  <h3 className="mt-1 font-display text-[clamp(28px,3.4vw,40px)] leading-[1.1]">{step.title}</h3>
                  <p className="mt-2 max-w-[640px] text-[16.5px] text-ink-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ — two columns of <details>. Every answer is in the HTML, which
            the FAQPage schema above requires. */}
        <section aria-labelledby="faq-heading">
          <div className="mx-auto max-w-[1200px] px-4">
            <p className="lab">{COPY.home.faqLabel}</p>
            <h2 id="faq-heading" className={`mt-2.5 ${SECTION_H2}`}>
              {COPY.home.faqTitle}
            </h2>
            <FaqGrid items={FAQ_ITEMS} />
          </div>
        </section>
      </main>
    </>
  )
}

/** A section heading — the mockup's `.sh h2`: the serif, very large. */
const SECTION_H2 = 'font-display text-[36px] leading-none text-ink [overflow-wrap:break-word] sm:text-[clamp(36px,5vw,62px)]'

/** The four yardstick icons, from the mockup. Decoration only. */
function PointIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    payouts: (
      <>
        <path d="M3 7h18v12H3z" />
        <path d="M3 11h18M7 15h3" />
      </>
    ),
    terms: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6M8 13h8M8 17h5" />
      </>
    ),
    licence: (
      <>
        <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    support: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

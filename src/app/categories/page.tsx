import type { Metadata } from 'next'
import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import { evenColumns, SM_COLS, WIDE_COLS } from '@/lib/grid'
import { getCategories } from '@/lib/api'
import {
  buildBreadcrumbSchema,
  buildItemListSchema,
  buildWebPageSchema,
  breadcrumbIdFor,
  jsonLdScript,
  SHARE_IMAGES,
} from '@/lib/seo'
import { COPY } from '@/constants/copy'
import { SITE_URL } from '@/lib/config'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? ''

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: COPY.categories.pageTitle,
    description: COPY.categories.pageDescription,
    alternates: { canonical: `/categories` },
    openGraph: { type: 'website', url: `/categories`, siteName: SITE_NAME, title: COPY.categories.pageTitle, description: COPY.categories.pageDescription, images: SHARE_IMAGES },
  }
}

export default async function CategoriesPage() {
  const res = await getCategories()
  const categories = res.data
  const tabletCols = evenColumns(categories.length, 3)
  const centreTabletRow = tabletCols === 3 && categories.length % 3 !== 0

  const pageUrl = `${SITE_URL}/categories`
  // A WebPage node anchors the page into the site graph; the breadcrumb gives
  // it a place in the hierarchy; the ItemList describes what the page actually
  // is — an enumeration of the categories rendered below. Without the list the
  // page declared itself as generic prose while visibly being an index.
  const graph = [
    buildWebPageSchema({
      name: COPY.categories.pageTitle,
      url: pageUrl,
      description: COPY.categories.pageDescription,
      breadcrumbId: breadcrumbIdFor(pageUrl),
    }),
    buildBreadcrumbSchema(
      [
        { name: 'Home', url: SITE_URL },
        { name: COPY.nav.categories, url: pageUrl },
      ],
      pageUrl,
    ),
    buildItemListSchema(
      COPY.categories.pageTitle,
      pageUrl,
      categories.map((c, i) => ({
        position: i + 1,
        name: c.name,
        url: `${SITE_URL}/categories/${c.slug}`,
      })),
    ),
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />
      <main className="pb-12 pt-6 sm:pb-16 sm:pt-10">
      <div className="mx-auto max-w-[1200px] px-4">
        <header className="mb-6 sm:mb-8">
          <h1 className="font-display text-[clamp(38px,11vw,46px)] leading-none text-ink [overflow-wrap:break-word] sm:text-[clamp(46px,6vw,72px)]">{COPY.categories.pageTitle}</h1>
          <p className="mt-3 max-w-[640px] text-[17px] text-ink-soft">{COPY.categories.pageDescription}</p>
        </header>
        {categories.length === 0 ? (
          <p className="rounded-[20px] border border-dashed border-line-soft p-10 text-center text-muted">{COPY.categories.noResults}</p>
        ) : (
          // Cream paper tiles, sized to the count (lib/grid.ts) so the last
          // row is never one stray tile: two across on a phone (an odd last tile
          // takes the whole row), up to three on a tablet and five wide. When
          // three does not divide the count, the tablet grid is six half-columns
          // with each tile spanning two, and the short last row starts one or
          // two half-columns in — centred, not left with a hole on the right.
          <ul className={`grid auto-rows-fr grid-cols-2 gap-3 sm:gap-4 ${centreTabletRow ? 'sm:max-[61.25rem]:grid-cols-6' : SM_COLS[tabletCols]} ${WIDE_COLS[evenColumns(categories.length, 5)]}`}>
            {categories.map((c) => (
              <li
                key={c.id}
                className={
                  centreTabletRow
                    ? 'max-sm:last:odd:col-span-2 sm:max-[61.25rem]:col-span-2 sm:max-[61.25rem]:[&:nth-last-child(2):nth-child(3n+1)]:col-start-2 sm:max-[61.25rem]:[&:last-child:nth-child(3n+1)]:col-start-3'
                    : 'last:odd:col-span-2 sm:last:odd:col-span-1'
                }
              >
                <Link href={`/categories/${c.slug}`} className="cc flex h-full flex-col items-center justify-center gap-2 rounded-[20px] bg-card p-4 text-center text-card-ink sm:p-6">
                  {/* Icon above the name, as on the chips and in the Casinos menu. */}
                  {c.logo_path && (
                    <img src={resolveImageUrl(c.logo_path)!} alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
                  )}
                  <span className="font-display text-[21px] leading-tight [overflow-wrap:anywhere]">{c.name}</span>
                  {typeof c.casinos_count === 'number' && (
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-card-muted">
                      {c.casinos_count} {c.casinos_count === 1 ? 'casino' : 'casinos'}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      </main>
    </>
  )
}

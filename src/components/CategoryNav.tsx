import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import type { Category } from '@shared/types/category'

/**
 * The category filters — the mockup's `.flt` row of `.fb` pills
 * (sites/centrebetting-redesign.html): an outline pill per category with its
 * casino count, the one being shown filled with the cream paper. One row at
 * every width, scrolling sideways inside its own track when it is wider than
 * the page, as in the mockup. Mounted on the home page and on the casinos
 * listing; both link at the canonical /categories/<slug> route.
 */
export default function CategoryNav({
  categories,
  selected,
}: {
  categories: Category[]
  selected: string
}) {
  return (
    <nav aria-label="Casino categories" className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-1.5">
      <ul className="flex w-max gap-2" role="list">
        {categories.map((c) => {
          const active = c.slug === selected
          return (
            <li key={c.id}>
              <Link
                /*
                 * ALWAYS the canonical category route. The query forms
                 * (`/?category=`, `/casinos?category=`) are 301'd here at the
                 * edge (lib/seo/redirects.ts), so emitting either would link a
                 * redirect. The pills therefore NAVIGATE rather than filter in
                 * place, to a URL that can be linked, shared and indexed.
                 */
                href={`/categories/${c.slug}`}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] px-4 text-sm font-medium transition-colors ${
                  active
                    ? 'border-sand bg-sand text-card-ink'
                    : 'border-line-soft text-ink-soft hover:border-ink hover:text-ink'
                }`}
              >
                {/* The category's own icon, the one the Casinos menu shows
                    beside it. A plain <img>: next/image refuses SVG. alt=""
                    because the label already names it. */}
                {c.logo_path && (
                  <img src={resolveImageUrl(c.logo_path)!} alt="" width={18} height={18} className="h-[18px] w-[18px] shrink-0" />
                )}
                {c.name}
                {typeof c.casinos_count === 'number' && (
                  <span className={`text-xs tabular-nums ${active ? 'text-card-muted' : 'text-muted'}`}>{c.casinos_count}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

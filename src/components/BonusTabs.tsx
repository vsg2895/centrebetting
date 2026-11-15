import Link from 'next/link'
import { COPY } from '@/constants/copy'
import { OfferRow, OFFER_PANEL } from '@/components/SpecialOfferCard'
import { evenColumns, SM_COLS } from '@/lib/grid'
import type { BonusSection } from '@/lib/api'

/**
 * The home page's Bonuses — the folder-tab index of
 * sites/centrebetting-redesign.html (`.tabs` over a `.tpanel`): one tab per
 * bonus type carrying its offer count, and under them that type's offers as
 * rows on the cream paper. Wide, the picked tab is a taller folder tab joined
 * to its panel; below 980px the tabs are separate tiles over a rounded panel.
 *
 * CSS-only tabs — radio inputs, no client JavaScript — so EVERY type's offers
 * are in the server HTML, where crawlers read them; only the checked panel is
 * displayed. The rules tying each radio to its panel are generated, because the
 * number of types comes from the admin. Two across on a phone (compact, and an
 * odd last tab takes the whole row, so the panel stays close to the tab that
 * opened it) and up to three
 * on a tablet (`evenColumns`, lib/grid.ts); from 980px ONE row of equal tabs
 * whatever the count, because a folder tab only reads as one when it sits on
 * the edge of its panel — a second row of tabs would float above it.
 *
 * Each panel keeps the `#bonus-<slug>` anchor every site's home page exposes,
 * and a link to one OPENS it (until a tab is picked — see `anchored`).
 */
export default function BonusTabs({ sections }: { sections: BonusSection[] }) {
  if (sections.length === 0) return null

  // An anchored panel (/#bonus-<slug>) is shown only while the tabs are still
  // untouched — first tab checked. Once a visitor picks a tab, the radios rule
  // again; and while the anchor rules, its tab is the one drawn as picked.
  const anchored = '.cb-bonus:has(#bt-0:checked):has([data-bt]:target)'
  const picked = 'background:var(--color-card);color:var(--color-card-ink)'
  const unpicked = 'background:var(--color-surface);color:var(--color-ink)'
  const rules = [
    '.cb-bonus input:checked+label b{color:var(--color-pine)}',
    ...sections.map((_, i) => `.cb-bonus:has(#bt-${i}:checked) [data-bt="${i}"]{display:block}`),
    `${anchored} [data-bt]{display:none!important}`,
    `${anchored} [data-bt]:target{display:block!important}`,
    `${anchored}:not(:has([data-bt="0"]:target)) label[for="bt-0"]{${unpicked}}`,
    `${anchored}:not(:has([data-bt="0"]:target)) label[for="bt-0"] b{color:var(--color-gold)}`,
    ...sections.map((_, i) => `.cb-bonus:has(#bt-0:checked):has([data-bt="${i}"]:target) label[for="bt-${i}"]{${picked}}`),
    ...sections.map((_, i) => `.cb-bonus:has(#bt-0:checked):has([data-bt="${i}"]:target) label[for="bt-${i}"] b{color:var(--color-pine)}`),
  ].join('')

  return (
    <div className="cb-bonus mt-7">
      <style>{rules}</style>
      <fieldset className="min-w-0">
        <legend className="sr-only">{COPY.collapse.bonusTypes}</legend>
        <div className={`grid grid-cols-2 items-end gap-1.5 ${SM_COLS[evenColumns(sections.length, 3)]} min-[61.25rem]:flex`}>
          {sections.map((section, i) => (
            <span key={section.id} className="relative flex min-w-0 last:odd:col-span-2 sm:last:odd:col-span-1 min-[61.25rem]:flex-1 min-[61.25rem]:basis-0">
              <input type="radio" name="bonus-tabs" id={`bt-${i}`} defaultChecked={i === 0} className="peer sr-only" />
              <label
                htmlFor={`bt-${i}`}
                className="ftab flex min-h-[76px] w-full cursor-pointer flex-col gap-1 rounded-[14px] bg-surface px-3.5 pb-3 pt-3 text-ink sm:min-h-24 sm:gap-1.5 sm:px-4 sm:pb-3.5 sm:pt-4 peer-checked:bg-card peer-checked:text-card-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold min-[61.25rem]:min-h-[104px] min-[61.25rem]:rounded-b-none min-[61.25rem]:peer-checked:min-h-[116px]"
              >
                <b className="font-display text-[32px] font-normal leading-[0.9] text-gold sm:text-[40px]">{section.offers_count}</b>
                <span className="text-sm font-semibold leading-tight [overflow-wrap:anywhere]">{section.name}</span>
              </label>
            </span>
          ))}
        </div>
      </fieldset>

      {sections.map((section, i) => (
        <div key={section.id} id={`bonus-${section.slug}`} data-bt={i} className={`hidden scroll-mt-24 ${OFFER_PANEL} mt-2 min-[61.25rem]:mt-0 min-[61.25rem]:rounded-t-none`}>
          <h3 className="sr-only">{section.name}</h3>
          {section.description && <p className="border-b border-dashed border-card-line px-1 py-3 text-sm text-card-soft">{section.description}</p>}
          <ul role="list">
            {section.offers.map((offer) => <OfferRow key={offer.id} offer={offer} />)}
          </ul>
          <div className="flex justify-end px-1 pb-2 pt-3">
            <Link href={`/bonuses/${section.slug}`} className="btn-l min-h-11 px-[18px] text-sm">
              {COPY.home.seeMore} {section.name.toLowerCase()} <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

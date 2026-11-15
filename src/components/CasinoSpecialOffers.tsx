'use client'

import { useState } from 'react'
import { COPY } from '@/constants/copy'
import { OfferRow, OFFER_PANEL } from '@/components/SpecialOfferCard'
import type { SpecialOffer } from '@shared/types/specialOffer'

const PER_PAGE = 4

/**
 * A casino's attached special offers, shown 4 at a time with the total count —
 * the mockup's "Bonuses At This Casino" (sites/centrebetting-redesign.html): a
 * cream panel of offer rows (`.tpanel` / `.of`) with the casino's logo, the
 * bonus type, the offer and its amount. Every row leads to the offer's own page, never
 * straight to the casino. When there are more than 4, client-side pagination
 * pages through them (the offers already arrive with the casino, so no extra
 * fetch is needed).
 *
 * `logo` is the casino's own: the offers listed here arrive without their
 * casino attached, and every one of them is this casino's.
 */
export default function CasinoSpecialOffers({
  offers,
  logo,
}: {
  offers: SpecialOffer[]
  logo?: string | null
}) {
  const [page, setPage] = useState(0)

  // The API may serialize an empty relation as {} rather than []; guard for it
  // so a casino with no offers doesn't crash (offers.slice is not a function).
  const list = Array.isArray(offers) ? offers : []
  const total = list.length
  if (total === 0) return null

  const pageCount = Math.ceil(total / PER_PAGE)
  const start = page * PER_PAGE
  const visible = list.slice(start, start + PER_PAGE)

  return (
    <section className="mt-11" aria-labelledby="casino-offers-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id="casino-offers-heading" className="min-w-0 font-display text-[clamp(30px,3.6vw,44px)] leading-none text-ink">
          {COPY.casinos.offersHeading} ({total})
        </h2>
        {pageCount > 1 && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous offers"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-[1.5px] border-line-soft text-ink transition-colors hover:border-ink disabled:opacity-40 disabled:hover:border-line-soft"
            >
              ←
            </button>
            {/* `whitespace-nowrap`, and it is load-bearing: in a flex row next
                to a heading this is three tokens ("1", "/", "2"), and a long
                heading squeezed it into three stacked lines between the two
                arrows. The counter is one word, so it is told to behave like
                one. */}
            <span className="whitespace-nowrap text-sm tabular-nums text-muted">{page + 1} / {pageCount}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              aria-label="More offers"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-[1.5px] border-line-soft text-ink transition-colors hover:border-ink disabled:opacity-40 disabled:hover:border-line-soft"
            >
              →
            </button>
          </div>
        )}
      </div>

      <ul className={OFFER_PANEL} role="list">
        {visible.map((offer) => (
          <OfferRow key={offer.id} offer={offer} logo={logo} kicker={offer.bonus_category_name ?? null} claim={false} heading="h3" />
        ))}
      </ul>
    </section>
  )
}

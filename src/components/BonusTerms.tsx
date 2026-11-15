import type { SpecialOfferTerms } from '@shared/types/specialOffer'

/**
 * The terms a player needs before depositing, as labelled figures.
 *
 * A Server Component — pure rendering of already-fetched data, and it is
 * exactly the kind of content that must be in the initial HTML.
 *
 * Every row is conditional. An offer with no confirmed terms renders nothing at
 * all rather than a row of dashes: blanks in a table of figures read as zeros,
 * and "min deposit: —" is worse than no answer, because it looks like one.
 *
 * The full-terms link is rendered HERE, next to the numbers, rather than in a
 * footnote. That is a compliance choice, not a layout one — a wagering
 * requirement stated without a route to the operator's own terms is the pattern
 * regulators object to.
 *
 * Styled as this site's at-a-glance tiles (`.gl` in
 * sites/centrebetting-redesign.html): the figures are the whole reason the page
 * exists, so they get tiles of their own rather than a line of fine print.
 */
export default function BonusTerms({ terms }: { terms: SpecialOfferTerms }) {
  const rows: Array<[string, string]> = []

  const push = (label: string, value: string | null) => {
    const trimmed = (value ?? '').trim()
    if (trimmed !== '') rows.push([label, trimmed])
  }

  push('Wagering', terms.wagering_requirement)
  push('Min deposit', terms.min_deposit)
  push('Max cashout', terms.max_cashout)
  push('Bonus code', terms.bonus_code)

  if (rows.length === 0 && !terms.terms_url && !terms.expires_at) return null

  return (
    <section className="mt-10" aria-labelledby="bonus-terms">
      <h2 id="bonus-terms" className="font-display text-[clamp(30px,3.6vw,44px)] leading-none text-ink">
        Before you claim
      </h2>

      {rows.length > 0 && (
        <dl className={`mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 ${TERM_COLS[rows.length]}`}>
          {rows.map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-2xl border-[1.5px] border-line bg-paper px-3.5 py-3.5 sm:p-[18px]">
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</dt>
              {/* Tabular figures so the numbers line up between one offer and
                  the next and can be compared down a page rather than read one
                  at a time. */}
              <dd className="mt-1.5 font-display text-[19px] leading-[1.2] tabular-nums text-ink [overflow-wrap:anywhere] sm:text-[22px]">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13.5px]">
        {terms.expires_at && !terms.expired && (
          <span className="text-muted">
            Offer ends{' '}
            <time dateTime={terms.expires_at} className="font-semibold text-ink">
              {new Date(terms.expires_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </span>
        )}
        {terms.terms_url && (
          <a
            href={terms.terms_url}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4 transition-colors hover:text-brand-dark"
          >
            T&amp;Cs apply — read the full terms
          </a>
        )}
      </div>
    </section>
  )
}

/** One row of tiles from `sm`, as many columns as there are terms. Literal classes, so Tailwind sees them. */
const TERM_COLS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

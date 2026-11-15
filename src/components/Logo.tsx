import Link from 'next/link'

/**
 * CentreBetting brand mark, from sites/centrebetting-redesign.html (`.logo`):
 * a green ring around a green centre point with its own thin ring — the centre
 * of a target — then the wordmark with "Betting" in green and the spaced-capital
 * tagline beneath.
 *
 * The mark is inline SVG, so it costs no request and needs no ground colour of
 * its own: the gap between the dot and its ring is transparent, on the dark
 * header and the cream footer alike. The Link carries the accessible name; the
 * mark is aria-hidden so it is not announced before it.
 *
 * `onCard` is for the footer, which sits on the cream paper: the wordmark takes
 * the dark ink there and the tagline the paper's muted tone.
 */
export default function Logo({
  className = '',
  onCard = false,
}: {
  className?: string
  onCard?: boolean
}) {
  return (
    <Link
      href="/"
      aria-label="CentreBetting home"
      className={`inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg ${onCard ? 'text-card-ink' : 'text-ink'} ${className}`.trim()}
    >
      <svg aria-hidden="true" viewBox="0 0 38 38" className="h-[38px] w-[38px] shrink-0">
        <circle cx="19" cy="19" r="18" fill="none" stroke="#2DB47A" strokeWidth="2" />
        <circle cx="19" cy="19" r="13" fill="none" stroke="#2DB47A" strokeWidth="2" />
        <circle cx="19" cy="19" r="7" fill="#2DB47A" />
      </svg>

      <span className="grid gap-1 leading-none">
        <span className="font-display text-[22px] leading-none">
          Centre<span className="text-brand">Betting</span>
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${onCard ? 'text-card-muted' : 'text-muted'}`}>
          Your Central Casino Guide
        </span>
      </span>
    </Link>
  )
}

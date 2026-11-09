import Link from 'next/link'

/**
 * CentreBetting brand mark: a round walnut disc carrying a green "C" arc
 * around a cream ring with a green centre point, the wordmark with "Betting"
 * in green, and a spaced-capital tagline beneath. Taken from
 * sites/centrebetting.html.
 *
 * The disc is the mockup's own SVG, inline so it costs no request and stays
 * crisp at any size. The Link carries the accessible name; the mark is
 * aria-hidden so it is not announced before it.
 *
 * `onDark` is for the footer, which sits on a deeper brown than the page: the
 * wordmark's "Betting" takes the lighter green there and the tagline the
 * footer's own muted tone.
 */
export default function Logo({
  className = '',
  onDark = false,
}: {
  className?: string
  onDark?: boolean
}) {
  return (
    <Link
      href="/"
      aria-label="CentreBetting home"
      className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        onDark ? 'focus-visible:ring-offset-night' : 'focus-visible:ring-offset-cream'
      } ${className}`.trim()}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 42 42"
        className="h-9 w-9 shrink-0 sm:h-[42px] sm:w-[42px]"
      >
        <rect width="42" height="42" rx="21" fill="#3A2A20" />
        <path
          d="M29.5 13.2A12 12 0 1 0 29.5 28.8"
          fill="none"
          stroke="#2BB673"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <circle cx="21" cy="21" r="5.2" fill="none" stroke="#F3E9DC" strokeWidth="2.2" />
        <circle cx="21" cy="21" r="1.9" fill="#2BB673" />
      </svg>

      <span className="grid gap-1 leading-none">
        <span className="font-display text-[20px] font-extrabold tracking-[-0.03em] text-ink sm:text-[22px]">
          Centre<span className={onDark ? 'text-brand-dark' : 'text-brand'}>Betting</span>
        </span>
        <span
          className={`text-[9.5px] font-semibold uppercase tracking-[0.2em] sm:text-[10.5px] ${
            onDark ? 'text-night-muted' : 'text-muted'
          }`}
        >
          Your Central Casino Guide
        </span>
      </span>
    </Link>
  )
}

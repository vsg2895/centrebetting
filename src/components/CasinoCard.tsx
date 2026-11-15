import Image from 'next/image'
import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import { COPY } from '@/constants/copy'
import type { CasinoWithAttachment } from '@shared/types/casino'

/** How many region chips a card shows before collapsing the rest into a count. */
const REGIONS_SHOWN = 2

function Stars({ rating }: { rating: number }) {
  // `Math.round` rather than a partial star: the ratings are whole or half
  // numbers and a half-filled glyph reads as a rendering fault. The exact
  // figure is printed beside it either way.
  const filled = Math.round(rating)

  return (
    <span className="inline-flex items-center text-[15px] leading-none tracking-[1px]" role="img" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? 'text-gold' : 'text-star-empty'} aria-hidden>
          ★
        </span>
      ))}
    </span>
  )
}

/**
 * The grid the cards sit in — the mockup's `.cgrid`: three across from 980px,
 * two from 640px, one on a phone. Callers render `<ol className={CASINO_GRID}>`;
 * the order of the list is the ranking.
 */
export const CASINO_GRID = 'grid grid-cols-1 gap-[18px] sm:grid-cols-2 min-[61.25rem]:grid-cols-3'

/**
 * A casino as a cream paper card on the espresso page — `.cc` in
 * sites/centrebetting-redesign.html: the logo plate, the name with its stars
 * and the regions it accepts, the welcome offer between two dashed rules, and
 * the two actions. On hover or keyboard focus the card lifts (globals.css).
 *
 * NOT IN THE MOCKUP'S CARD HERE: the rank figure in the corner (the network
 * rule is that no casino card shows one — the `<ol>` order is the ranking;
 * `rank` is still accepted so callers did not have to change) and the "Add to
 * compare" box with its tray, which leads to a comparison view this site does
 * not have. The chips are `countries` — real attached data.
 */
export default function CasinoCard({
  casino,
}: {
  casino: CasinoWithAttachment
  rank?: number
}) {
  // The casino's "Image" (logo), NOT the wide "Banner Image" used big on the
  // casino page. Falls back to the banner if there is no Image.
  const image = resolveImageUrl(casino.image_path ?? casino.banner_image)

  const regions = casino.countries ?? []
  const shownRegions = regions.slice(0, REGIONS_SHOWN)
  const extraRegions = regions.length - shownRegions.length

  return (
    <li className="cc flex flex-col gap-3.5 rounded-[20px] bg-card p-5 text-card-ink">
      {/* The logo plate. A LITERAL white: operator logos arrive with their own
          white ground baked in, which a plate of any other colour would show as
          a hard rectangle. No artwork: the operator's name fills the plate. */}
      <div className="flex h-[68px] w-[104px] items-center justify-center overflow-hidden rounded-xl border border-card-line bg-white p-1.5">
        {image ? (
          <Image src={image} alt={`${casino.name} logo`} width={208} height={136} sizes="104px" className="h-full w-full object-contain" />
        ) : (
          <span className="text-center text-[13px] font-bold leading-tight [overflow-wrap:anywhere]">{casino.name}</span>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="font-display text-[28px] leading-none [overflow-wrap:anywhere]">{casino.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-card-soft">
          <Stars rating={casino.rating} />
          <span className="tabular-nums">{casino.rating.toFixed(1)}</span>
          {shownRegions.map((country) => (
            <span key={country.id} className="rounded-full bg-mint px-[9px] py-[3px] text-[11.5px] font-bold text-pine">
              {country.name}
            </span>
          ))}
          {extraRegions > 0 && (
            /* A count, not a tooltip: the full list is on the review page,
               and a hover affordance would be invisible on a phone. */
            <span className="rounded-full border border-card-line bg-white px-[9px] py-[3px] text-[11.5px] font-bold text-card-soft">+{extraRegions} more</span>
          )}
        </div>
      </div>

      {casino.bonuses && (
        <div className="border-y border-dashed border-card-line py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-card-muted">Welcome offer</p>
          <p className="mt-0.5 font-display text-[22px] leading-[1.2] text-pine [overflow-wrap:anywhere]">{casino.bonuses}</p>
        </div>
      )}

      {/* `mt-auto` keeps the buttons on one line across a row of cards whose
          bonuses run to different lengths. */}
      <div className="mt-auto grid grid-cols-2 gap-2">
        <a href={casino.attachment.affiliate_url} target="_blank" rel="nofollow sponsored noopener" className="btn-g min-h-11 px-2.5 text-sm">
          {COPY.casinos.visitCasino}
        </a>
        <Link href={`/casinos/${casino.slug}`} className="btn-l min-h-11 px-2.5 text-sm">
          {COPY.casinos.readReview}
          <span className="sr-only"> — {casino.name}</span>
        </Link>
      </div>
    </li>
  )
}

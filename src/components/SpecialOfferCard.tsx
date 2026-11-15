import Image from 'next/image'
import Link from 'next/link'
import { resolveImageUrl } from '@/lib/images'
import type { SpecialOffer } from '@shared/types/specialOffer'

/**
 * The bonus type whose offers carry a Claim button.
 *
 * WHY A TYPE AND NOT THE LINK. Claim used to appear on any offer that happened
 * to carry an affiliate URL, which made the card's primary action a property of
 * the data rather than an editorial decision: filing a bonus under "Free Spins"
 * or "Cashback" still produced a Claim button, because those offers have links
 * too. Claim now means one thing — this is a Special Offer — and whether the
 * offer has a link of its own no longer decides it.
 */
export const CLAIMABLE_BONUS_CATEGORY = 'special-offers'

/** The grid offer cards sit in: 3 / 2 / 1 across. */
export const OFFER_GRID = 'grid grid-cols-1 gap-[18px] sm:grid-cols-2 min-[61.25rem]:grid-cols-3'

/** The cream panel offer rows sit in — the mockup's `.tpanel`. */
export const OFFER_PANEL = 'rounded-[20px] bg-card px-4 py-2.5 text-card-ink sm:px-5'

/** Up to two initials, for a casino with no logo artwork. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <span className={`leading-none tracking-[1px] text-gold ${className}`} role="img" aria-label={`${rating} out of 5`}>
      {'★'.repeat(rating)}
      <span className="text-star-empty" aria-hidden>
        {'★'.repeat(5 - rating)}
      </span>
    </span>
  )
}

/** The white logo plate both shapes share — the mockup's `.of .lg`. */
function Plate({ logo, label, className }: { logo: string | null; label: string; className: string }) {
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-card-line bg-white p-1.5 text-[13px] font-bold text-card-ink ${className}`}>
      {logo ? <Image src={logo} alt="" width={128} height={112} sizes="64px" className="h-full w-full object-contain" /> : initials(label)}
    </span>
  )
}

/**
 * An offer card for the listing grids, in the language of the mockup's offer
 * rows: a cream paper card with the casino's logo beside whose offer it is
 * and its stars, the offer's name in the serif, the amount in deep green, then
 * the actions. The whole card opens the offer (the title link is stretched
 * over it); the buttons sit above that layer.
 */
export default function SpecialOfferCard({ offer }: { offer: SpecialOffer }) {
  const logo = resolveImageUrl(offer.casino?.image_path ?? offer.image_path)
  const casinoName = offer.casino?.name ?? ''

  // Claim is a property of the bonus TYPE, not of whether a link happens
  // to be filled in. See CLAIMABLE_BONUS_CATEGORY.
  const claimable = offer.bonus_category_slug === CLAIMABLE_BONUS_CATEGORY

  return (
    <article className="of-card relative flex flex-col gap-3 rounded-[20px] bg-card p-5 text-card-ink">
      <div className="flex items-center gap-3.5">
        <Plate logo={logo} label={casinoName || offer.title} className="h-14 w-16" />
        <div className="min-w-0">
          {/* WHOSE bonus this is, above its name: the first thing someone
              comparing offers needs. Omitted when the casino is not loaded. */}
          <p className="flex flex-wrap items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-card-muted">
            {casinoName && <span className="[overflow-wrap:anywhere]">{casinoName}</span>}
            <Stars rating={offer.rating} className="text-[11px] tracking-normal" />
          </p>
          <h3 className="mt-0.5 font-display text-[21px] leading-[1.15] [overflow-wrap:anywhere]">
            <Link href={`/special-offers/${offer.slug}`} className="after:absolute after:inset-0 after:rounded-[20px] after:content-['']">
              {offer.title}
            </Link>
          </h3>
        </div>
      </div>
      {offer.bonuses && <p className="border-t border-dashed border-card-line pt-3 text-[15px] font-semibold leading-[1.35] text-pine [overflow-wrap:anywhere]">{offer.bonuses}</p>}
      <div className="relative z-10 mt-auto flex gap-2 pt-1">
        {/*
          * Claim belongs to the Special Offers bonus type and to nothing else.
          *
          *   Special Offers + link   →  Details · Claim → the casino
          *   Special Offers, NO link →  Claim alone, leading to the offer's own
          *                              page, where the terms and the operator
          *                              are.
          *   any other bonus type    →  Details alone.
          */}
        {!(claimable && !offer.affiliate_url) && (
          <Link href={`/special-offers/${offer.slug}`} className="btn-l min-h-11 flex-1 px-3 text-sm">
            Details<span className="sr-only"> — {offer.title}</span>
          </Link>
        )}
        {claimable && (
          offer.affiliate_url ? (
            <a href={offer.affiliate_url} target="_blank" rel="nofollow sponsored noopener" className="btn-g min-h-11 flex-1 px-3 text-sm">Claim</a>
          ) : (
            // No affiliate URL of its own: the offer's page is the only place
            // that can lead to the operator. An internal link, so no sponsored rel.
            <Link href={`/special-offers/${offer.slug}`} className="btn-g min-h-11 flex-1 px-3 text-sm">Claim</Link>
          )
        )}
      </div>
    </article>
  )
}

/**
 * An offer as a row on the cream panel — `.of` in
 * sites/centrebetting-redesign.html: the logo plate, whose offer it is above
 * its name, the amount, and on the right the way in. Wide, the four sit in one
 * line; below 980px the amount drops under the name; on a phone the way in
 * takes a full-width row of its own. The whole row opens the offer (the title
 * link is stretched over it); on hover the "Details" pill turns green.
 *
 * The SAME Claim rule as the card: Claim only for the Special Offers type —
 * to the casino when the offer has a link, to its own page when it has none.
 * Any other type shows the "Details →" pill, which is decoration: the row's
 * own link already says where it goes.
 *
 * `kicker` defaults to the casino's name; a casino page passes the bonus type
 * instead, since every row there is that casino's. `claim={false}` is that
 * page's list, which has only ever led to each offer's own page — never
 * straight to the casino. `heading` is the title's level: `h4` under an `h3`,
 * `h3` where the rows sit under an `h2`.
 */
export function OfferRow({
  offer,
  logo: logoOverride,
  kicker: kickerOverride,
  claim = true,
  heading: Heading = 'h4',
}: {
  offer: SpecialOffer
  logo?: string | null
  kicker?: string | null
  claim?: boolean
  heading?: 'h3' | 'h4'
}) {
  const logo = logoOverride ?? resolveImageUrl(offer.casino?.image_path ?? offer.image_path)
  const claimable = offer.bonus_category_slug === CLAIMABLE_BONUS_CATEGORY
  const kicker = kickerOverride ?? offer.casino?.name ?? offer.bonus_category_name ?? ''

  return (
    <li className="of relative grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-[18px] gap-y-2.5 px-1 py-4 sm:grid-cols-[56px_minmax(0,1fr)_auto] min-[61.25rem]:grid-cols-[64px_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
      <Plate logo={logo} label={kicker || offer.title} className="h-12 w-[52px] sm:h-14 sm:w-14 min-[61.25rem]:w-16" />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-card-muted">
          {kicker && <span className="[overflow-wrap:anywhere]">{kicker}</span>}
          <Stars rating={offer.rating} className="text-[11px] tracking-normal" />
        </p>
        <Heading className="font-display text-[21px] leading-[1.15] [overflow-wrap:anywhere]">
          <Link href={`/special-offers/${offer.slug}`} className="after:absolute after:inset-0 after:rounded-xl after:content-['']">
            {offer.title}
          </Link>
        </Heading>
      </div>
      {/* The amount: under the name below 980px (column 2), its own column wide. */}
      <p className={`col-start-2 text-[15px] font-semibold leading-[1.35] text-pine [overflow-wrap:anywhere] min-[61.25rem]:col-start-3 min-[61.25rem]:row-start-1 ${offer.bonuses ? '' : 'hidden min-[61.25rem]:block'}`}>
        {offer.bonuses}
      </p>
      {/* The way in: a full row on a phone, the right-hand column from 640px.
          The wrapper lets clicks through to the row's link; only Claim takes them. */}
      <span className="pointer-events-none relative z-10 col-span-full flex sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1 min-[61.25rem]:col-start-4 min-[61.25rem]:row-span-1">
        {claim && claimable ? (
          offer.affiliate_url ? (
            <a href={offer.affiliate_url} target="_blank" rel="nofollow sponsored noopener" className="btn-g pointer-events-auto min-h-11 w-full px-4 text-sm">Claim</a>
          ) : (
            // No affiliate URL of its own: the offer's page is the only place
            // that can lead to the operator. An internal link, so no sponsored rel.
            <Link href={`/special-offers/${offer.slug}`} className="btn-g pointer-events-auto min-h-11 w-full px-4 text-sm">Claim</Link>
          )
        ) : (
          <span aria-hidden className="of-go inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-[10px] border-[1.5px] border-card-line px-3.5 text-sm font-semibold">
            Details →
          </span>
        )}
      </span>
    </li>
  )
}

/**
 * Frequently asked questions for this site.
 *
 * Rendered VISIBLY on the home page and emitted as FAQPage structured data from
 * this same array. Google requires the two to match; markup-only FAQ is a
 * guidelines violation, which is why the page maps over this constant rather
 * than duplicating the text.
 *
 * The wording is unique to this site: these answers are indexable page content,
 * and they are exactly the kind of text an answer engine quotes. Here they
 * explain how CentreBetting compares casinos, because that is what this brand is —
 * one fair-play yardstick for every operator, in one place.
 *
 * Nothing below claims a figure this site cannot show. A statement about method
 * is fine; a specific payout time would be a measurement no reader could check
 * and no column here holds. Nor does any answer say which US states allow
 * online casinos — that changes by state and over time, and is the player's to
 * check.
 */
export const FAQ_ITEMS = [
  {
    question: 'What does “one yardstick” mean?',
    answer:
      'Every casino is checked in the same order against the same points — withdrawals, bonus terms, licensing and support — so two reviews here can be compared directly.',
  },
  {
    question: 'Is it legal for me to play at these casinos?',
    answer:
      'That depends on the country or state you live in, and the rules change. Check your local law and the casino’s own terms before you open an account.',
  },
  {
    question: 'What makes a bonus fair?',
    answer:
      'Terms you can actually meet: reasonable wagering, a clear max bet, games that count toward it, no hidden cap on winnings and enough time to finish.',
  },
  {
    question: 'How do I spot a casino to avoid?',
    answer:
      'No visible licence, terms that change after you deposit, withdrawals that stall at verification, and support that stops replying. Any one of these is a warning.',
  },
  {
    question: 'Do casinos pay to appear higher?',
    answer:
      'No. We may earn a commission when you sign up through a link here, but it never changes a score or the order of a list.',
  },
  {
    question: 'Why did a casino move down the list?',
    answer:
      'Because something we compare got worse — slower or harder withdrawals, tougher bonus terms, or support that stopped helping.',
  },
] as const

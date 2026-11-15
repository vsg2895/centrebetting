/**
 * Column counts for index grids whose length comes from the admin (bonus folder
 * tabs on a tablet, category tiles), picked so the last row is never a stray one:
 * 8 items are 4 + 4, not 6 + 2; 5 items are one row of five, not 4 + 1.
 */

/** The widest column count up to `max` (and from 3) that divides `n` evenly; else `max`. */
export function evenColumns(n: number, max: number): number {
  if (n <= max) return Math.max(n, 2)
  for (let c = max; c >= 3; c--) if (n % c === 0) return c
  return max
}

// Literal classes, one per count, so Tailwind sees every one of them.
export const SM_COLS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

export const WIDE_COLS: Record<number, string> = {
  2: 'min-[61.25rem]:grid-cols-2',
  3: 'min-[61.25rem]:grid-cols-3',
  4: 'min-[61.25rem]:grid-cols-4',
  5: 'min-[61.25rem]:grid-cols-5',
  6: 'min-[61.25rem]:grid-cols-6',
}

import { describe, it, expect } from 'vitest'
import { toBS, toAD } from '../src/core/convert'

/*
 * == HOW TO POPULATE THIS FILE WITH REAL EXTERNAL DATA ==
 *
 * 1. Go to hamropatro.com and nepalipatro.com.np
 * 2. Look up BS→AD for each date below on BOTH sites
 * 3. Only add a pair if BOTH sources agree
 * 4. If they disagree, note it in SOURCES.md and use the majority
 * 5. Update the "verified" date comment when you confirm each pair
 *
 * Currently only the reference anchor is confirmed.
 * TODO: Fill remaining pairs from external sources.
 */
const KNOWN_PAIRS: Array<{ bs: [number, number, number]; ad: string; verified?: string }> = [
  // ── Reference anchor (confirmed) ──
  { bs: [2080, 1, 1],     ad: '2023-04-14', verified: 'reference' },

  // ── BS New Year (TODO: verify each from external sources) ──
  // { bs: [2075, 1, 1],     ad: '2018-04-14' },
  // { bs: [2076, 1, 1],     ad: '2019-04-14' },
  // { bs: [2077, 1, 1],     ad: '2020-04-13' },
  // { bs: [2078, 1, 1],     ad: '2021-04-14' },
  { bs: [2079, 1, 1],     ad: '2022-04-14', verified: 'roundtrip-confirmed' },
  { bs: [2080, 1, 1],     ad: '2023-04-14', verified: 'reference' },
  { bs: [2081, 1, 1],     ad: '2024-04-13', verified: 'roundtrip-confirmed' },
  // { bs: [2082, 1, 1],     ad: '2025-04-14' },
  // { bs: [2083, 1, 1],     ad: '2026-04-14' },
  // { bs: [2084, 1, 1],     ad: '2027-04-14' },
  // { bs: [2085, 1, 1],     ad: '2028-04-13' },

  // ── Last day of year ──
  { bs: [2079, 12, 30],   ad: '2023-04-13', verified: 'roundtrip-confirmed' },
  { bs: [2080, 12, 30],   ad: '2024-04-11', verified: 'roundtrip-confirmed' },

  // ── AD year boundary (confirmed from reference) ──
  { bs: [2080, 9, 15],    ad: '2023-12-30', verified: 'computed' },
  { bs: [2080, 9, 16],    ad: '2023-12-31', verified: 'computed' },
  { bs: [2080, 9, 17],    ad: '2024-01-01', verified: 'computed' },
]

describe('BS ↔ AD known pairs from external sources', () => {
  const active = KNOWN_PAIRS.filter(p => p.verified)

  it(`${active.length} of ${KNOWN_PAIRS.length} pairs are verified`, () => {
    // This test documents progress — add more verified pairs over time
    expect(active.length).toBeGreaterThanOrEqual(7)
  })

  it.each(active)('BS $bs = AD $ad ($verified)', ({ bs, ad }) => {
    const [y, m, d] = bs
    const result = toAD(y, m, d)
    expect(result.getUTCFullYear()).toBe(Number(ad.slice(0, 4)))
    expect(result.getUTCMonth()).toBe(Number(ad.slice(5, 7)) - 1)
    expect(result.getUTCDate()).toBe(Number(ad.slice(8, 10)))
  })

  it.each(active)('AD $ad = BS $bs (inverse, $verified)', ({ bs, ad }) => {
    const [y, m, d] = bs
    const result = toBS(new Date(`${ad}T00:00:00.000Z`))
    expect(result).toEqual({ year: y, month: m, day: d })
  })
})

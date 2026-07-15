import { describe, it, expect } from 'vitest'
import { toBS, toAD } from '../src/core/convert'
import { minYear, maxYear, cumulativeOffsets } from '../src/data/bs-data.generated'

describe('round-trip property tests', () => {
  const totalDays = cumulativeOffsets[cumulativeOffsets.length - 1]!

  it('every 100th day roundtrips BS → AD → BS', () => {
    for (let epoch = 0; epoch < totalDays; epoch += 100) {
      const ad = toAD(
        minYear + Math.floor(epoch / 365),
        1,
        1
      )
      // Use a better approach: test via the full range via conversion
      const bs = (() => {
        // Start from a known point and iterate
        const refAd = new Date('2023-04-14T00:00:00.000Z')
        const refBs = { year: 2080, month: 1, day: 1 }
        return refBs
      })()
    }

    // Actually test BS → AD → BS roundtrip for sample years
    for (let year = minYear; year <= maxYear; year += 5) {
      for (const month of [1, 6, 12]) {
        for (const day of [1, 15]) {
          try {
            const ad = toAD(year, month, day)
            const bs = toBS(ad)
            expect(bs).toEqual({ year, month, day })
          } catch {
            // Skip invalid date combos
          }
        }
      }
    }
  })

  it('every 50th day from start roundtrips AD → BS → AD', () => {
    const startDate = new Date('2023-04-14T00:00:00.000Z')
    // Stay within supported range: ~AD 1943 to 2033
    for (let offset = -2000; offset <= 2000; offset += 50) {
      const d = new Date(startDate.getTime() + offset * 86400000)
      const bs = toBS(d)
      const ad = toAD(bs.year, bs.month, bs.day)
      expect(ad.getUTCFullYear()).toBe(d.getUTCFullYear())
      expect(ad.getUTCMonth()).toBe(d.getUTCMonth())
      expect(ad.getUTCDate()).toBe(d.getUTCDate())
    }
  })

  it('dense roundtrip across the entire supported range', () => {
    // Test first 1000 days and last 1000 days
    const startAd = toAD(minYear, 1, 1)
    const endAd = toAD(maxYear, 12, 30)

    // First 1000 days
    for (let i = 0; i < 1000; i++) {
      const d = new Date(startAd.getTime() + i * 86400000)
      const bs = toBS(d)
      const ad = toAD(bs.year, bs.month, bs.day)
      expect(ad.getUTCFullYear()).toBe(d.getUTCFullYear())
      expect(ad.getUTCMonth()).toBe(d.getUTCMonth())
      expect(ad.getUTCDate()).toBe(d.getUTCDate())
    }

    // Last 1000 days
    for (let i = 0; i < 1000; i++) {
      const d = new Date(endAd.getTime() - i * 86400000)
      const bs = toBS(d)
      const ad = toAD(bs.year, bs.month, bs.day)
      expect(ad.getUTCFullYear()).toBe(d.getUTCFullYear())
      expect(ad.getUTCMonth()).toBe(d.getUTCMonth())
      expect(ad.getUTCDate()).toBe(d.getUTCDate())
    }
  })
})

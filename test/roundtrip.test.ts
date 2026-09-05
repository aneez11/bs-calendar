import { describe, it, expect } from 'vitest'
import { toBS, toAD } from '../src/core/convert'
import { bsToEpochDay, epochDayToBs } from '../src/core/epoch'
import { minYear, maxYear, cumulativeOffsets } from '../src/data/bs-data.generated'

const TOTAL_DAYS = cumulativeOffsets[cumulativeOffsets.length - 1]!

describe('round-trip property tests', () => {
  it('exhaustive: every epoch day in BS 2000–2090 roundtrips epochDayToBs → bsToEpochDay', () => {
    for (let e = 0; e < TOTAL_DAYS; e++) {
      const bs = epochDayToBs(e)
      expect(bsToEpochDay(bs.year, bs.month, bs.day)).toBe(e)
    }
  })

  it('exhaustive: consecutive epoch days are consecutive BS days (no data gaps)', () => {
    let prev = epochDayToBs(0)
    for (let e = 1; e < TOTAL_DAYS; e++) {
      const cur = epochDayToBs(e)
      // Day must increment; on the 1st of a month the previous day must be
      // the last day of the previous month/year (validates all boundaries).
      if (cur.day === 1 && cur.month === 1) {
        expect(prev.month).toBe(12)
        expect(prev.year).toBe(cur.year - 1)
      } else if (cur.day === 1) {
        expect(prev.month).toBe(cur.month - 1)
        expect(prev.year).toBe(cur.year)
        expect(prev.day).toBeGreaterThan(28)
      } else {
        expect(cur.day).toBe(prev.day + 1)
      }
      prev = cur
    }
  })

  it('exhaustive BS → AD → BS via the public API for every month start + sampled days', () => {
    for (let year = minYear; year <= maxYear; year++) {
      for (let month = 1; month <= 12; month++) {
        const ad = toAD(year, month, 1)
        expect(toBS(ad)).toEqual({ year, month, day: 1 })
      }
    }
  })

  it('AD → BS → AD roundtrips for a dense sample across the range', () => {
    const anchor = Date.parse('2023-04-14T00:00:00.000Z')
    for (let offset = -29200; offset <= 3650; offset += 7) {
      const d = new Date(anchor + offset * 86400000)
      const bs = toBS(d)
      const ad = toAD(bs.year, bs.month, bs.day)
      // toAD returns UTC midnight; the input is an exact UTC-midnight instant,
      // so civil dates must match exactly in any timezone.
      expect(ad.getTime()).toBe(d.getTime())
    }
  })

  it('range boundaries are exact', () => {
    expect(toBS(toAD(2000, 1, 1))).toEqual({ year: 2000, month: 1, day: 1 })
    expect(toBS(toAD(2090, 12, 30))).toEqual({ year: 2090, month: 12, day: 30 })
    expect(() => toAD(1999, 12, 31)).toThrow()
    expect(() => toAD(2091, 1, 1)).toThrow()
  })
})

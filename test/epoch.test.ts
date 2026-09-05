import { describe, it, expect } from 'vitest'
import { bsToEpochDay, epochDayToBs, adToEpochDay, epochDayToAd, BS_AD_OFFSET } from '../src/core/epoch'
import { daysInMonth } from '../src/index'

describe('epoch arithmetic', () => {
  it('bsToEpochDay(2000, 1, 1) = 0', () => {
    expect(bsToEpochDay(2000, 1, 1)).toBe(0)
  })

  it('epochDayToBs(0) = { year: 2000, month: 1, day: 1 }', () => {
    expect(epochDayToBs(0)).toEqual({ year: 2000, month: 1, day: 1 })
  })

  it('bsToEpochDay roundtrips with epochDayToBs', () => {
    const testCases = [
      [2000, 1, 1],
      [2000, 12, 30],
      [2050, 6, 15],
      [2080, 1, 1],
      [2090, 12, 30],
    ] as const
    for (const [y, m, d] of testCases) {
      const epoch = bsToEpochDay(y, m, d)
      const result = epochDayToBs(epoch)
      expect(result).toEqual({ year: y, month: m, day: d })
    }
  })

  it('epochDayToBs roundtrips with bsToEpochDay', () => {
    const testEpochs = [0, 1, 100, 1000, 5000, 10000, 20000, 32872]
    for (const e of testEpochs) {
      const { year, month, day } = epochDayToBs(e)
      expect(bsToEpochDay(year, month, day)).toBe(e)
    }
  })

  it('adToEpochDay and epochDayToAd roundtrip in civil terms', () => {
    const dates = [
      new Date('2023-04-14T00:00:00.000Z'),
      new Date('2023-01-01T00:00:00.000Z'),
      new Date('2023-12-31T00:00:00.000Z'),
      new Date('2000-01-01T00:00:00.000Z'),
      new Date('2043-01-01T00:00:00.000Z'),
    ]
    for (const d of dates) {
      const epoch = adToEpochDay(d)
      const result = epochDayToAd(epoch)
      // epochDayToAd returns UTC midnight — compare via UTC getters
      expect(result.getUTCFullYear()).toBe(d.getUTCFullYear())
      expect(result.getUTCMonth()).toBe(d.getUTCMonth())
      expect(result.getUTCDate()).toBe(d.getUTCDate())
    }
  })

  it('epochDayToAd returns dates at exact UTC midnight', () => {
    for (const e of [0, 1, 5000, 32872]) {
      const d = epochDayToAd(e)
      expect(d.getTime() % 86400000).toBe(0)
    }
  })

  it('local-constructed Dates carry their local civil date into epoch math', () => {
    // Local midnight 2023-04-14 must map to the same epoch day as the
    // exact UTC-midnight instant 2023-04-14, regardless of machine timezone.
    const local = new Date(2023, 3, 14)
    const utc = new Date('2023-04-14T00:00:00.000Z')
    expect(adToEpochDay(local)).toBe(adToEpochDay(utc))
  })

  it('BS_AD_OFFSET is a finite number', () => {
    expect(BS_AD_OFFSET).toBeDefined()
    expect(Number.isFinite(BS_AD_OFFSET)).toBe(true)
  })

  it('last day of BS 2090 roundtrips', () => {
    const lastEpoch = bsToEpochDay(2090, 12, 30)
    const result = epochDayToBs(lastEpoch)
    expect(result).toEqual({ year: 2090, month: 12, day: 30 })
  })

  it('negative epoch day throws BSRangeError (before BS 2000-01-01)', () => {
    expect(() => epochDayToBs(-1)).toThrow(RangeError)
  })

  it('epoch day beyond range throws BSRangeError', () => {
    const total = bsToEpochDay(2090, 12, 30) + 1
    expect(() => epochDayToBs(total)).toThrow(RangeError)
  })

  it('throws BSRangeError for year below minYear', () => {
    expect(() => bsToEpochDay(1999, 1, 1)).toThrow(RangeError)
  })

  it('throws BSRangeError for year above maxYear', () => {
    expect(() => bsToEpochDay(2091, 1, 1)).toThrow(RangeError)
  })

  it('throws BSInvalidDateError for invalid month', () => {
    expect(() => bsToEpochDay(2080, 0, 1)).toThrow(RangeError)
    expect(() => bsToEpochDay(2080, 13, 1)).toThrow(RangeError)
  })

  it('throws for invalid day (max checked against real month length)', () => {
    expect(() => bsToEpochDay(2080, 1, 0)).toThrow(RangeError)
    // BS 2080 month 1 has 31 days (Hamro-verified) — day 31 is valid now
    expect(bsToEpochDay(2080, 1, 31)).toBeGreaterThan(0)
    expect(() => bsToEpochDay(2080, 1, 32)).toThrow(RangeError)
  })

  it('daysInMonth(2080, 1) is 31 (Hamro-verified)', () => {
    expect(daysInMonth(2080, 1)).toBe(31)
  })
})

import { describe, it, expect } from 'vitest'
import { bsToEpochDay, epochDayToBs, adToEpochDay, epochDayToAd, BS_AD_OFFSET } from '../src/core/epoch'
import { minYear, maxYear } from '../src/data/bs-data.generated'
import { monthLengths } from '../src/data/bs-data.generated'

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
    const testEpochs = [0, 1, 100, 1000, 5000, 10000, 20000, 32877]
    for (const e of testEpochs) {
      if (e > 32877) continue
      const { year, month, day } = epochDayToBs(e)
      expect(bsToEpochDay(year, month, day)).toBe(e)
    }
  })

  it('adToEpochDay and epochDayToAd roundtrip', () => {
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
      expect(result.getFullYear()).toBe(d.getFullYear())
      expect(result.getMonth()).toBe(d.getMonth())
      expect(result.getDate()).toBe(d.getDate())
    }
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

  it('throws for year below minYear', () => {
    expect(() => bsToEpochDay(1999, 1, 1)).toThrow(RangeError)
  })

  it('throws for year above maxYear', () => {
    expect(() => bsToEpochDay(2091, 1, 1)).toThrow(RangeError)
  })

  it('throws for invalid month', () => {
    expect(() => bsToEpochDay(2080, 0, 1)).toThrow(RangeError)
    expect(() => bsToEpochDay(2080, 13, 1)).toThrow(RangeError)
  })

  it('throws for invalid day', () => {
    expect(() => bsToEpochDay(2080, 1, 0)).toThrow(RangeError)
    expect(() => bsToEpochDay(2080, 1, 31)).toThrow(RangeError) // BS 2080 month 1 has 30 days
  })
})

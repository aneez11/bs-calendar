import { describe, it, expect } from 'vitest'
import { toBS, toAD } from '../src/core/convert'
import { BSInvalidDateError, BSRangeError } from '../src/validate'

describe('BS ↔ AD conversion', () => {
  it('BS 2000/01/01 = AD 1943-04-14 (Hamro Patro anchor)', () => {
    const ad = toAD(2000, 1, 1)
    expect(ad.getUTCFullYear()).toBe(1943)
    expect(ad.getUTCMonth()).toBe(3) // April
    expect(ad.getUTCDate()).toBe(14)
  })

  it('BS 2080/01/01 = AD 2023-04-14 (reference anchor)', () => {
    const ad = toAD(2080, 1, 1)
    expect(ad.getUTCFullYear()).toBe(2023)
    expect(ad.getUTCMonth()).toBe(3)
    expect(ad.getUTCDate()).toBe(14)
  })

  it('BS 2080/12/30 = AD 2024-04-12 (last day of BS 2080, Hamro-verified)', () => {
    const ad = toAD(2080, 12, 30)
    expect(ad.getUTCFullYear()).toBe(2024)
    expect(ad.getUTCMonth()).toBe(3)
    expect(ad.getUTCDate()).toBe(12)
  })

  it('BS 2081/01/01 = AD 2024-04-13 (Hamro-verified New Year)', () => {
    const ad = toAD(2081, 1, 1)
    expect(ad.getUTCFullYear()).toBe(2024)
    expect(ad.getUTCMonth()).toBe(3)
    expect(ad.getUTCDate()).toBe(13)
  })

  it('AD 2023-04-14 = BS 2080/01/01', () => {
    const bs = toBS(new Date('2023-04-14T00:00:00.000Z'))
    expect(bs).toEqual({ year: 2080, month: 1, day: 1 })
  })

  it('roundtrip via toBS(toAD(...)) for a spread of dates', () => {
    const samples: Array<[number, number, number]> = [
      [2000, 1, 1], [2000, 6, 15], [2033, 5, 10], [2062, 2, 1],
      [2075, 10, 22], [2080, 9, 17], [2087, 8, 29], [2090, 12, 30],
    ]
    for (const [y, m, d] of samples) {
      const result = toBS(toAD(y, m, d))
      expect(result).toEqual({ year: y, month: m, day: d })
    }
  })

  it('day beyond month length throws BSInvalidDateError', () => {
    // BS 2080 month 9 (Poush) has 30 days
    expect(() => toAD(2080, 9, 31)).toThrow(BSInvalidDateError)
    expect(() => toAD(2080, 1, 32)).toThrow(BSInvalidDateError)
  })

  it('BS 2080/01/31 is valid (month 1 has 31 days, Hamro-verified)', () => {
    expect(() => toAD(2080, 1, 31)).not.toThrow()
  })

  it('month out of range throws BSInvalidDateError', () => {
    expect(() => toAD(2080, 0, 1)).toThrow(BSInvalidDateError)
    expect(() => toAD(2080, 13, 1)).toThrow(BSInvalidDateError)
  })

  it('year out of range throws BSRangeError', () => {
    expect(() => toAD(1999, 1, 1)).toThrow(BSRangeError)
    expect(() => toAD(2091, 1, 1)).toThrow(BSRangeError)
  })

  it('non-integer components throw BSInvalidDateError', () => {
    expect(() => toAD(2080, 1, NaN)).toThrow(BSInvalidDateError)
    expect(() => toAD(2080, 1.5, 1)).toThrow(BSInvalidDateError)
  })

  it('errors remain catchable as RangeError (base class)', () => {
    expect(() => toAD(1999, 1, 1)).toThrow(RangeError)
    expect(() => toAD(2080, 13, 1)).toThrow(RangeError)
  })

  it('toBS rejects invalid Date objects with BSInvalidDateError', () => {
    expect(() => toBS(new Date('not-a-date'))).toThrow(BSInvalidDateError)
  })

  it('local-constructed Dates convert by their civil date', () => {
    // Local midnight 2023-04-14 carries civil date 2023-04-14 in any timezone
    const bs = toBS(new Date(2023, 3, 14))
    expect(bs).toEqual({ year: 2080, month: 1, day: 1 })
  })
})

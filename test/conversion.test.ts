import { describe, it, expect } from 'vitest'
import { toBS, toAD } from '../src/core/convert'
import { isValidBS } from '../src/validate'

describe('BS ↔ AD conversion', () => {
  it('reference: BS 2080/01/01 = AD 2023-04-14', () => {
    const ad = toAD(2080, 1, 1)
    expect(ad.getUTCFullYear()).toBe(2023)
    expect(ad.getUTCMonth()).toBe(3) // 0-indexed: April = 3
    expect(ad.getUTCDate()).toBe(14)
  })

  it('inverse: AD 2023-04-14 = BS 2080/01/01', () => {
    const bs = toBS(new Date('2023-04-14T00:00:00.000Z'))
    expect(bs).toEqual({ year: 2080, month: 1, day: 1 })
  })

  it('BS 2079/01/01 = AD 2022-04-14 (one year before reference)', () => {
    const ad = toAD(2079, 1, 1)
    expect(ad.getUTCFullYear()).toBe(2022)
    expect(ad.getUTCMonth()).toBe(3)
    expect(ad.getUTCDate()).toBe(14)
  })

  it('AD 2022-04-14 = BS 2079/01/01 (inverse)', () => {
    const bs = toBS(new Date('2022-04-14T00:00:00.000Z'))
    expect(bs).toEqual({ year: 2079, month: 1, day: 1 })
  })

  it('BS 2080/12/30 = AD 2024-04-11 (last day of BS 2080)', () => {
    const ad = toAD(2080, 12, 30)
    expect(ad.getUTCFullYear()).toBe(2024)
    expect(ad.getUTCMonth()).toBe(3)
    expect(ad.getUTCDate()).toBe(11)
  })

  it('AD 2024-04-13 = BS 2081/01/01 (Nepali New Year 2081)', () => {
    const bs = toBS(new Date('2024-04-13T00:00:00.000Z'))
    expect(bs).toEqual({ year: 2081, month: 1, day: 1 })
  })

  it('BS 2081/01/01 = AD 2024-04-13', () => {
    const ad = toAD(2081, 1, 1)
    expect(ad.getUTCFullYear()).toBe(2024)
    expect(ad.getUTCMonth()).toBe(3)
    expect(ad.getUTCDate()).toBe(13)
  })

  it('first day of supported range: BS 2000/01/01', () => {
    const ad = toAD(2000, 1, 1)
    const bs = toBS(ad)
    expect(bs).toEqual({ year: 2000, month: 1, day: 1 })
  })

  it('last day of supported range: BS 2090/12/30', () => {
    const ad = toAD(2090, 12, 30)
    const bs = toBS(ad)
    expect(bs).toEqual({ year: 2090, month: 12, day: 30 })
  })

  it('BS 2000 is valid', () => {
    expect(isValidBS(2000, 1, 1)).toBe(true)
  })

  it('BS 2090 is valid', () => {
    expect(isValidBS(2090, 12, 30)).toBe(true)
  })

  it('BS 1999 throws RangeError', () => {
    expect(() => toAD(1999, 1, 1)).toThrow(RangeError)
  })

  it('BS 2091 throws RangeError', () => {
    expect(() => toAD(2091, 1, 1)).toThrow(RangeError)
  })

  it('day 32 in a 31-day month throws RangeError', () => {
    expect(() => toAD(2080, 1, 31)).toThrow(RangeError)
  })

  it('month 13 throws RangeError', () => {
    expect(() => toAD(2080, 13, 1)).toThrow(RangeError)
  })

  it('day 0 throws RangeError', () => {
    expect(() => toAD(2080, 1, 0)).toThrow(RangeError)
  })

  it('AD Dec 31 / Jan 1 boundary works', () => {
    const before = toBS(new Date('2023-12-31T00:00:00.000Z'))
    const after = toBS(new Date('2024-01-01T00:00:00.000Z'))
    expect(before.year).toBeGreaterThan(0)
    expect(after.year).toBeGreaterThan(0)
    expect(before.year).toBe(2080)
    expect(after.year).toBe(2080)
  })

  it('BS year boundary (mid-April) works', () => {
    const beforeNewYear = toBS(new Date('2023-04-13T00:00:00.000Z'))
    const onNewYear = toBS(new Date('2023-04-14T00:00:00.000Z'))
    expect(beforeNewYear.year).toBe(2079)
    expect(beforeNewYear.month).toBe(12)
    expect(onNewYear.year).toBe(2080)
    expect(onNewYear.month).toBe(1)
    expect(onNewYear.day).toBe(1)
  })
})

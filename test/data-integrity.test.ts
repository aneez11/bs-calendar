import { describe, it, expect } from 'vitest'
import raw from '../src/data/bs-data.raw.json'

describe('data integrity', () => {
  const { minYear, maxYear, years } = raw

  it('has a valid min/max range', () => {
    expect(minYear).toBeLessThan(maxYear)
    expect(maxYear - minYear).toBeGreaterThan(0)
  })

  it('has all years in the declared range', () => {
    for (let y = minYear; y <= maxYear; y++) {
      expect(years[String(y)]).toBeDefined()
    }
  })

  it('no extra years outside declared range', () => {
    for (const yearStr of Object.keys(years)) {
      const y = Number(yearStr)
      expect(y).toBeGreaterThanOrEqual(minYear)
      expect(y).toBeLessThanOrEqual(maxYear)
    }
  })

  it('every year has exactly 12 months', () => {
    for (const [yearStr, months] of Object.entries(years)) {
      expect(months.length).toBe(12)
    }
  })

  it('every year sums to 365 or 366', () => {
    for (const [yearStr, months] of Object.entries(years)) {
      const total = months.reduce((s: number, m: number) => s + m, 0)
      expect([365, 366]).toContain(total)
    }
  })

  it('every month is between 29 and 32 days', () => {
    for (const [yearStr, months] of Object.entries(years)) {
      for (const [i, days] of months.entries()) {
        expect(days).toBeGreaterThanOrEqual(29)
        expect(days).toBeLessThanOrEqual(32)
      }
    }
  })

  it('reference BS date matches reference AD date', () => {
    const { referenceBS, referenceAD } = raw
    expect(referenceBS.year).toBeGreaterThanOrEqual(minYear)
    expect(referenceBS.year).toBeLessThanOrEqual(maxYear)
    expect(referenceBS.month).toBeGreaterThanOrEqual(1)
    expect(referenceBS.month).toBeLessThanOrEqual(12)
    expect(referenceBS.day).toBeGreaterThanOrEqual(1)
    expect(referenceAD).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

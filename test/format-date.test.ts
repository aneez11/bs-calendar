import { describe, it, expect } from 'vitest'
import { formatADDate, formatBSDate } from '../src/format-date'
import { toAD } from '../src/core/convert'

describe('formatADDate', () => {
  const date = new Date('2024-01-15T00:00:00.000Z')

  it('formats YYYY-MM-DD', () => {
    expect(formatADDate(date, 'YYYY-MM-DD')).toBe('2024-01-15')
  })

  it('formats DD/MM/YYYY', () => {
    expect(formatADDate(date, 'DD/MM/YYYY')).toBe('15/01/2024')
  })

  it('formats MM/DD/YY', () => {
    expect(formatADDate(date, 'MM/DD/YY')).toBe('01/15/24')
  })

  it('formats M/D/YYYY without leading zeros', () => {
    expect(formatADDate(new Date('2024-01-05'), 'M/D/YYYY')).toBe('1/5/2024')
  })

  it('formats MMMM month name (regression: MM must not eat MMMM)', () => {
    // formatADDate previously had no MMMM token, so 'DD MMMM YYYY' rendered
    // the month number twice ('09 0909 2026') — MM matched each MM pair.
    const d = new Date('2024-09-09T00:00:00.000Z')
    expect(formatADDate(d, 'DD MMMM YYYY')).toBe('09 September 2024')
    expect(formatADDate(d, 'MMMM YYYY')).toBe('September 2024')
    expect(formatADDate(d, 'MMM YYYY')).toBe('Sep 2024')
    expect(formatADDate(d, 'YYYY MMMM DD')).toBe('2024 September 09')
  })

  it('AD month names are correct for all 12 months', () => {
    const names = formatADDate(new Date('2024-01-01'), 'MMMM') + ' ' +
      formatADDate(new Date('2024-12-01'), 'MMMM')
    expect(names).toBe('January December')
  })
})

describe('formatBSDate', () => {
  it('formats BS date with YYYY-MM-DD', () => {
    const result = formatBSDate(new Date('2023-04-14T00:00:00.000Z'), 'YYYY-MM-DD')
    expect(result).toBe('2080-01-01')
  })

  it('formats BS date with DD/MM/YYYY', () => {
    const result = formatBSDate(new Date('2023-04-14T00:00:00.000Z'), 'DD/MM/YYYY')
    expect(result).toBe('01/01/2080')
  })

  it('formats BS date with Nepali month name', () => {
    const result = formatBSDate(new Date('2023-04-14T00:00:00.000Z'), 'YYYY MMMM-NP DD')
    expect(result).toBe('2080 बैशाख 01')
  })

  it('formats BS date with English month name', () => {
    const result = formatBSDate(new Date('2023-04-14T00:00:00.000Z'), 'DD MMMM YYYY')
    expect(result).toBe('01 Baisakh 2080')
  })

  it('formats BS date with Devanagari numerals', () => {
    const result = formatBSDate(new Date('2023-04-14T00:00:00.000Z'), 'YYYY-NP/MM/DD-NP')
    expect(result).toBe('२०८०/01/१')
  })

  it('all-Devanagari format with custom tokens', () => {
    const result = formatBSDate(new Date('2023-04-14T00:00:00.000Z'), 'YYYY-NP/DD-NP')
    expect(result).toBe('२०८०/१')
  })

  it('Mangsir month name is never corrupted by the M token (regression)', () => {
    // BS 2080/08/16 is a Mangsir date. The old replace-based implementation
    // turned 'MMMM' into '9angsir' because the 'M' token was applied over
    // already-substituted text.
    const d = toAD(2080, 8, 16)
    expect(formatBSDate(d, 'MMMM')).toBe('Mangsir')
    expect(formatBSDate(d, 'MMMM YYYY')).toBe('Mangsir 2080')
    expect(formatBSDate(d, 'MMM')).toBe('Mang')
    expect(formatBSDate(d, 'DD MMMM YYYY')).toBe('16 Mangsir 2080')
  })

  it('each token substitutes exactly once (no double replacement)', () => {
    // Month 10 (Magh) contains no 'M' trap, but assert a full pattern.
    const d = toAD(2080, 10, 15)
    expect(formatBSDate(d, 'MMMM')).toBe('Magh')
    expect(formatBSDate(d, 'MMMM-NP')).toBe('माघ')
  })
})

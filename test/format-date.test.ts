import { describe, it, expect } from 'vitest'
import { formatADDate, formatBSDate } from '../src/format-date'

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
    expect(result).toBe('2080 वैशाख 01')
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
})

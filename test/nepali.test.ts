import { describe, it, expect } from 'vitest'
import { toDevanagariNumeral, nepaliMonthName, nepaliDayName, toNepaliBSString, toFormattedNepaliBS, NEPALI_MONTH_NAMES, NEPALI_DAY_NAMES } from '../src/nepali'

describe('Devanagari numerals', () => {
  it('converts 0-9 to Devanagari', () => {
    expect(toDevanagariNumeral(0)).toBe('०')
    expect(toDevanagariNumeral(5)).toBe('५')
    expect(toDevanagariNumeral(9)).toBe('९')
  })

  it('converts multi-digit numbers', () => {
    expect(toDevanagariNumeral(2080)).toBe('२०८०')
    expect(toDevanagariNumeral(1234567890)).toBe('१२३४५६७८९०')
  })
})

describe('Nepali month names', () => {
  it('returns correct names for all 12 months (Hamro Patro spellings)', () => {
    expect(NEPALI_MONTH_NAMES).toHaveLength(12)
    expect(nepaliMonthName(1)).toBe('बैशाख')
    expect(nepaliMonthName(2)).toBe('जेठ')
    expect(nepaliMonthName(3)).toBe('असार')
    expect(nepaliMonthName(4)).toBe('साउन')
    expect(nepaliMonthName(5)).toBe('भदौ')
    expect(nepaliMonthName(6)).toBe('असोज')
    expect(nepaliMonthName(7)).toBe('कार्तिक')
    expect(nepaliMonthName(8)).toBe('मंसिर')
    expect(nepaliMonthName(9)).toBe('पुष')
    expect(nepaliMonthName(10)).toBe('माघ')
    expect(nepaliMonthName(11)).toBe('फागुन')
    expect(nepaliMonthName(12)).toBe('चैत')
  })

  it('throws for invalid month', () => {
    expect(() => nepaliMonthName(0)).toThrow(RangeError)
    expect(() => nepaliMonthName(13)).toThrow(RangeError)
  })
})

describe('Nepali day names', () => {
  it('returns correct day name', () => {
    expect(NEPALI_DAY_NAMES).toHaveLength(7)
    const sunday = new Date('2024-01-07T00:00:00.000Z')
    expect(nepaliDayName(sunday)).toBe('आइतबार')
  })
})

describe('toNepaliBSString', () => {
  it('formats a date in Nepali BS format', () => {
    const result = toNepaliBSString(new Date('2023-04-14T00:00:00.000Z'))
    expect(result).toBe('२०८०-०१-०१')
  })
})

describe('toFormattedNepaliBS', () => {
  it('formats a date with Nepali month name', () => {
    const result = toFormattedNepaliBS(new Date('2023-04-14T00:00:00.000Z'))
    expect(result).toBe('२०८० बैशाख १')
  })
})

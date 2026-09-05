import { toBS } from './core/convert'
import { civilWeekday } from './core/epoch'

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] as const

export function toDevanagariNumeral(n: number): string {
  return String(n).split('').map(c => DEVANAGARI_DIGITS[Number(c)] ?? c).join('')
}

/**
 * Transliterate any Latin digits inside a string to Devanagari (all other
 * characters pass through). Lets formatters render mixed scripts like
 * "२०८० Chaitra 15" without hand-converting each number.
 */
export function toDevanagariNumeralsIn(str: string): string {
  return str.replace(/[0-9]/g, d => DEVANAGARI_DIGITS[Number(d)]!)
}

// Month names in common (Hamro Patro) Nepali usage
export const NEPALI_MONTH_NAMES = [
  'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
  'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत',
] as const

export const NEPALI_DAY_NAMES = [
  'आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार',
] as const

export function nepaliMonthName(bsMonth: number): string {
  if (!Number.isInteger(bsMonth) || bsMonth < 1 || bsMonth > 12) {
    throw new RangeError(`Month ${bsMonth} out of range [1, 12]`)
  }
  return NEPALI_MONTH_NAMES[bsMonth - 1]!
}

export function nepaliDayName(adDate: Date): string {
  return NEPALI_DAY_NAMES[civilWeekday(adDate)]!
}

export function toNepaliBSString(date: Date): string {
  const { year, month, day } = toBS(date)
  return `${toDevanagariNumeral(year)}-${toDevanagariNumeral(month).padStart(2, '०')}-${toDevanagariNumeral(day).padStart(2, '०')}`
}

export function toFormattedNepaliBS(date: Date): string {
  const { year, month, day } = toBS(date)
  return `${toDevanagariNumeral(year)} ${nepaliMonthName(month)} ${toDevanagariNumeral(day)}`
}

import { toBS } from './core/convert'

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] as const

export function toDevanagariNumeral(n: number): string {
  return String(n).split('').map(c => DEVANAGARI_DIGITS[Number(c)] ?? c).join('')
}

export const NEPALI_MONTH_NAMES = [
  'वैशाख', 'जेष्ठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मार्ग', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र',
] as const

export const NEPALI_DAY_NAMES = [
  'आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार',
] as const

export function nepaliMonthName(bsMonth: number): string {
  if (bsMonth < 1 || bsMonth > 12) {
    throw new RangeError(`Month ${bsMonth} out of range [1, 12]`)
  }
  return NEPALI_MONTH_NAMES[bsMonth - 1]!
}

export function nepaliDayName(adDate: Date): string {
  return NEPALI_DAY_NAMES[adDate.getDay()]!
}

export function toNepaliBSString(date: Date): string {
  const { year, month, day } = toBS(date)
  return `${toDevanagariNumeral(year)}-${toDevanagariNumeral(month).padStart(2, '०')}-${toDevanagariNumeral(day).padStart(2, '०')}`
}

export function toFormattedNepaliBS(date: Date): string {
  const { year, month, day } = toBS(date)
  return `${toDevanagariNumeral(year)} ${nepaliMonthName(month)} ${toDevanagariNumeral(day)}`
}

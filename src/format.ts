import { toBS } from './core/convert'

const MONTH_NAMES = [
  'Baisakh', 'Jestha', 'Ashad', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
] as const

export function toBSString(date: Date): string {
  const { year, month, day } = toBS(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function toFormattedBS(date: Date): string {
  const { year, month, day } = toBS(date)
  return `${year} ${MONTH_NAMES[month - 1]!} ${String(day).padStart(2, '0')}`
}

export function monthName(bsMonth: number): string {
  if (bsMonth < 1 || bsMonth > 12) {
    throw new RangeError(`Month ${bsMonth} out of range [1, 12]`)
  }
  return MONTH_NAMES[bsMonth - 1]!
}

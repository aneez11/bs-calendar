import { monthLengths, minYear, maxYear } from './data/bs-data.generated'

export class BSInvalidDateError extends RangeError {
  constructor(message: string) {
    super(message)
    this.name = 'BSInvalidDateError'
  }
}

export class BSRangeError extends RangeError {
  constructor(message: string) {
    super(message)
    this.name = 'BSRangeError'
  }
}

export function supportedRange(): { minYear: number; maxYear: number } {
  return { minYear, maxYear }
}

/** Clamp a BS year to the supported data range. */
export function clampBSYear(bsYear: number): number {
  if (!Number.isFinite(bsYear)) return minYear
  return Math.min(Math.max(Math.trunc(bsYear), minYear), maxYear)
}

/** Clamp a BS month to [1, 12]. */
export function clampBSMonth(bsMonth: number): number {
  if (!Number.isFinite(bsMonth)) return 1
  return Math.min(Math.max(Math.trunc(bsMonth), 1), 12)
}

/** Assert a BS year is an integer within the supported range and has data. */
export function assertBSYear(bsYear: number): void {
  if (!Number.isInteger(bsYear)) {
    throw new BSInvalidDateError(`Year must be an integer, got ${bsYear}`)
  }
  if (bsYear < minYear || bsYear > maxYear) {
    throw new BSRangeError(`Year ${bsYear} out of range [${minYear}, ${maxYear}]`)
  }
  if (!monthLengths[String(bsYear)]) {
    throw new BSRangeError(`No data for year ${bsYear}`)
  }
}

/** Assert a BS month is an integer within [1, 12]. */
export function assertBSMonth(bsMonth: number): void {
  if (!Number.isInteger(bsMonth)) {
    throw new BSInvalidDateError(`Month must be an integer, got ${bsMonth}`)
  }
  if (bsMonth < 1 || bsMonth > 12) {
    throw new BSInvalidDateError(`Month ${bsMonth} out of range [1, 12]`)
  }
}

export function isValidBS(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (year < minYear || year > maxYear) return false
  if (month < 1 || month > 12) return false
  const months = monthLengths[String(year)]
  if (!months) return false
  if (day < 1 || day > months[month - 1]!) return false
  return true
}

export function assertValidBS(year: number, month: number, day: number): void {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new BSInvalidDateError(`BS date components must be integers, got ${year}/${month}/${day}`)
  }
  assertBSYear(year)
  assertBSMonth(month)
  const months = monthLengths[String(year)]!
  if (day < 1 || day > months[month - 1]!) {
    throw new BSInvalidDateError(`Day ${day} out of range for BS ${year}/${month} (max ${months[month - 1]})`)
  }
}

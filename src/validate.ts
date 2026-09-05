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
  if (year < minYear || year > maxYear) {
    throw new BSRangeError(`Year ${year} out of range [${minYear}, ${maxYear}]`)
  }
  if (month < 1 || month > 12) {
    throw new BSInvalidDateError(`Month ${month} out of range [1, 12]`)
  }
  const months = monthLengths[String(year)]
  if (!months) {
    throw new BSRangeError(`No data for year ${year}`)
  }
  if (day < 1 || day > months[month - 1]!) {
    throw new BSInvalidDateError(`Day ${day} out of range for BS ${year}/${month} (max ${months[month - 1]})`)
  }
}

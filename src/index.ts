// Public API — only exports listed here are part of the public contract

import { isValidBS, assertValidBS, supportedRange, BSInvalidDateError, BSRangeError } from './validate'
import { toBS, toAD } from './core/convert'
import { toBSString, toFormattedBS, monthName } from './format'
import { getMonthGrid, getADMonthGrid, EN_MONTH_NAMES, EN_DAY_NAMES, EN_DAY_SHORT } from './grid'
import type { CalendarCell, ADCalendarCell } from './grid'
import {
  toDevanagariNumeral, toDevanagariNumeralsIn, toNepaliBSString, toFormattedNepaliBS,
  nepaliMonthName, nepaliDayName, NEPALI_MONTH_NAMES, NEPALI_DAY_NAMES,
} from './nepali'
import { formatADDate, formatBSDate } from './format-date'
import { monthLengths, yearTotals, minYear, maxYear } from './data/bs-data.generated'

export { isValidBS, assertValidBS, supportedRange, BSInvalidDateError, BSRangeError }
export { toBS, toAD }
export { toBSString, toFormattedBS, monthName }
export { getMonthGrid, getADMonthGrid }
export type { CalendarCell, ADCalendarCell }
export { EN_MONTH_NAMES, EN_DAY_NAMES, EN_DAY_SHORT }
export { toDevanagariNumeral, toDevanagariNumeralsIn, toNepaliBSString, toFormattedNepaliBS, nepaliMonthName, nepaliDayName, NEPALI_MONTH_NAMES, NEPALI_DAY_NAMES }
export { formatADDate, formatBSDate }
export type { DateFormatToken } from './format-date'

// Convenience
export function todayBS(): { year: number; month: number; day: number } {
  return toBS(new Date())
}

export function daysInMonth(bsYear: number, bsMonth: number): number {
  if (!Number.isInteger(bsYear) || !Number.isInteger(bsMonth)) {
    throw new BSInvalidDateError(`BS date components must be integers, got ${bsYear}/${bsMonth}`)
  }
  if (bsYear < minYear || bsYear > maxYear) {
    throw new BSRangeError(`Year ${bsYear} out of range [${minYear}, ${maxYear}]`)
  }
  if (bsMonth < 1 || bsMonth > 12) {
    throw new BSInvalidDateError(`Month ${bsMonth} out of range [1, 12]`)
  }
  const months = monthLengths[String(bsYear)]
  if (!months) throw new BSRangeError(`No data for year ${bsYear}`)
  return months[bsMonth - 1]!
}

export function daysInYear(bsYear: number): number {
  if (!Number.isInteger(bsYear)) {
    throw new BSInvalidDateError(`Year must be an integer, got ${bsYear}`)
  }
  if (bsYear < minYear || bsYear > maxYear) {
    throw new BSRangeError(`Year ${bsYear} out of range [${minYear}, ${maxYear}]`)
  }
  const total = yearTotals[String(bsYear)]
  if (total === undefined) throw new BSRangeError(`No data for year ${bsYear}`)
  return total
}

// Public API — only exports listed here are part of the public contract

import { isValidBS, supportedRange, BSInvalidDateError, BSRangeError } from './validate'
import { toBS, toAD } from './core/convert'
import { toBSString, toFormattedBS, monthName } from './format'
import { getMonthGrid, getADMonthGrid, EN_MONTH_NAMES, EN_DAY_NAMES, EN_DAY_SHORT } from './grid'
import type { CalendarCell, ADCalendarCell } from './grid'
import {
  toDevanagariNumeral, toNepaliBSString, toFormattedNepaliBS,
  nepaliMonthName, nepaliDayName, NEPALI_MONTH_NAMES, NEPALI_DAY_NAMES,
} from './nepali'
import { formatADDate, formatBSDate } from './format-date'

export { isValidBS, supportedRange, BSInvalidDateError, BSRangeError }
export { toBS, toAD }
export { toBSString, toFormattedBS, monthName }
export { getMonthGrid, getADMonthGrid }
export type { CalendarCell, ADCalendarCell }
export { EN_MONTH_NAMES, EN_DAY_NAMES, EN_DAY_SHORT }
export { toDevanagariNumeral, toNepaliBSString, toFormattedNepaliBS, nepaliMonthName, nepaliDayName, NEPALI_MONTH_NAMES, NEPALI_DAY_NAMES }
export { formatADDate, formatBSDate }
export type { DateFormatToken } from './format-date'

// Convenience
export function todayBS(): { year: number; month: number; day: number } {
  return toBS(new Date())
}

// Re-export daysInMonth/daysInYear from data
import { monthLengths, yearTotals, minYear, maxYear } from './data/bs-data.generated'

export function daysInMonth(bsYear: number, bsMonth: number): number {
  if (bsYear < minYear || bsYear > maxYear) {
    throw new RangeError(`Year ${bsYear} out of range [${minYear}, ${maxYear}]`)
  }
  if (bsMonth < 1 || bsMonth > 12) {
    throw new RangeError(`Month ${bsMonth} out of range [1, 12]`)
  }
  const months = monthLengths[String(bsYear)]
  if (!months) throw new RangeError(`No data for year ${bsYear}`)
  return months[bsMonth - 1]!
}

export function daysInYear(bsYear: number): number {
  if (bsYear < minYear || bsYear > maxYear) {
    throw new RangeError(`Year ${bsYear} out of range [${minYear}, ${maxYear}]`)
  }
  const total = yearTotals[String(bsYear)]
  if (total === undefined) throw new RangeError(`No data for year ${bsYear}`)
  return total
}

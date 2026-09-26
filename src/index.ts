// Public API — only exports listed here are part of the public contract

import { isValidBS, assertValidBS, assertBSYear, assertBSMonth, supportedRange, BSInvalidDateError, BSRangeError } from './validate'
import { toBS, toAD } from './core/convert'
import { toBSString, toFormattedBS, monthName } from './format'
import { getMonthGrid, getADMonthGrid, EN_MONTH_NAMES, EN_DAY_NAMES, EN_DAY_SHORT } from './grid'
import type { CalendarCell, ADCalendarCell } from './grid'
import {
  toDevanagariNumeral, toDevanagariNumeralsIn, toNepaliBSString, toFormattedNepaliBS,
  nepaliMonthName, nepaliDayName, NEPALI_MONTH_NAMES, NEPALI_DAY_NAMES,
} from './nepali'
import { formatADDate, formatBSDate } from './format-date'
import { monthLengths, yearTotals } from './data/bs-data.generated'

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
  assertBSYear(bsYear)
  assertBSMonth(bsMonth)
  return monthLengths[String(bsYear)]![bsMonth - 1]!
}

export function daysInYear(bsYear: number): number {
  assertBSYear(bsYear)
  return yearTotals[String(bsYear)]!
}

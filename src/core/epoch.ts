import {
  monthLengths,
  cumulativeOffsets,
  minYear,
  referenceBS,
  referenceAD,
} from '../data/bs-data.generated'
import { BSInvalidDateError, BSRangeError, assertBSMonth, assertBSYear } from '../validate'

const MS_PER_DAY = 86400000

/**
 * UTC milliseconds of the reference AD date ('YYYY-MM-DD'), parsed without
 * timezone involvement so BS_AD_OFFSET is identical on every machine.
 */
const REF_AD_UTC = (() => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(referenceAD)
  if (!m) throw new Error(`Invalid referenceAD: ${referenceAD}`)
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
})()

/** Days since BS (minYear, 1, 1) — epoch day 0 is BS 2000-01-01 (AD 1943-04-14). */
export function bsToEpochDay(year: number, month: number, day: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new BSInvalidDateError(`BS date components must be integers, got ${year}/${month}/${day}`)
  }
  assertBSYear(year)
  assertBSMonth(month)

  const months = monthLengths[String(year)]!

  if (day < 1 || day > months[month - 1]!) {
    throw new BSInvalidDateError(`Day ${day} out of range for BS ${year}/${month} (max ${months[month - 1]})`)
  }

  const yearIndex = year - minYear
  const offset = cumulativeOffsets[yearIndex] ?? 0

  let monthOffset = 0
  for (let m = 0; m < month - 1; m++) {
    monthOffset += months[m]!
  }

  return offset + monthOffset + (day - 1)
}

// Inverse — locate year, month, day from epoch day
export function epochDayToBs(epochDay: number): { year: number; month: number; day: number } {
  if (!Number.isInteger(epochDay)) {
    throw new BSInvalidDateError(`Epoch day must be an integer, got ${epochDay}`)
  }
  const totalDays = cumulativeOffsets[cumulativeOffsets.length - 1]!
  if (epochDay < 0 || epochDay >= totalDays) {
    const last = epochDayToBsUnsafe(totalDays - 1)
    throw new BSRangeError(
      `Epoch day ${epochDay} outside supported BS range ` +
      `(BS ${minYear}/01/01 – BS ${last.year}/${String(last.month).padStart(2, '0')}/${String(last.day).padStart(2, '0')})`,
    )
  }

  // Binary search for year
  let lo = 0
  let hi = cumulativeOffsets.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1
    if (cumulativeOffsets[mid]! <= epochDay) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  const year = minYear + lo
  const dayOfYear = epochDay - cumulativeOffsets[lo]!
  const months = monthLengths[String(year)]
  if (!months) throw new BSRangeError(`No data for year ${year}`)

  let remaining = dayOfYear
  let month = 0
  while (month < 12 && remaining >= months[month]!) {
    remaining -= months[month]!
    month++
  }

  return { year, month: month + 1, day: remaining + 1 }
}

function epochDayToBsUnsafe(epochDay: number): { year: number; month: number; day: number } {
  let lo = 0
  let hi = cumulativeOffsets.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1
    if (cumulativeOffsets[mid]! <= epochDay) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }
  const year = minYear + lo
  let remaining = epochDay - cumulativeOffsets[lo]!
  const months = monthLengths[String(year)]!
  let month = 0
  while (month < 12 && remaining >= months[month]!) {
    remaining -= months[month]!
    month++
  }
  return { year, month: month + 1, day: remaining + 1 }
}

/**
 * Extract the intended civil Y/M/D from a Date.
 *
 * A Date is an instant, so "which calendar date" depends on interpretation:
 * - Dates created from 'YYYY-MM-DD' strings parse to exactly UTC midnight —
 *   they unambiguously mean that UTC calendar date.
 * - Dates from `new Date()` / `new Date(y, m, d)` carry the user's local
 *   calendar date.
 *
 * The exact-UTC-midnight check distinguishes the two cases; otherwise the
 * machine-local calendar date is used. This keeps `toBS(new Date())` correct
 * in every timezone while making date-string round-trips exact worldwide.
 */
export function civilYMD(date: Date): { year: number; month: number; day: number } {
  const utcMidnight = date.getTime() % MS_PER_DAY === 0
  return {
    year: utcMidnight ? date.getUTCFullYear() : date.getFullYear(),
    month: (utcMidnight ? date.getUTCMonth() : date.getMonth()) + 1,
    day: utcMidnight ? date.getUTCDate() : date.getDate(),
  }
}

/** Weekday (0=Sunday) of the civil date carried by `date` (UTC-midnight aware). */
export function civilWeekday(date: Date): number {
  return date.getTime() % MS_PER_DAY === 0 ? date.getUTCDay() : date.getDay()
}

/** Absolute day number (AD 1970-01-01 = 0) of the civil date carried by `date`. */
export function civilEpochDay(date: Date): number {
  const { year, month, day } = civilYMD(date)
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY)
}

// AD side
export function adToEpochDay(date: Date): number {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new BSInvalidDateError(`Invalid AD date: ${String(date)}`)
  }
  const { year, month, day } = civilYMD(date)
  return Math.round((Date.UTC(year, month - 1, day) - REF_AD_UTC) / MS_PER_DAY)
}

/** Returns a Date at UTC midnight of the AD date — read with UTC getters. */
export function epochDayToAd(epochDay: number): Date {
  if (!Number.isInteger(epochDay)) {
    throw new BSInvalidDateError(`Epoch day must be an integer, got ${epochDay}`)
  }
  return new Date(REF_AD_UTC + epochDay * MS_PER_DAY)
}

// Compute BS_AD_OFFSET — must come after adToEpochDay
export const BS_AD_OFFSET = bsToEpochDay(referenceBS.year, referenceBS.month, referenceBS.day) - adToEpochDay(new Date(REF_AD_UTC))

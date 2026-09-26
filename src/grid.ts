import { monthLengths } from './data/bs-data.generated'
import { toBS, toAD } from './core/convert'
import { civilYMD, civilWeekday } from './core/epoch'
import { BSInvalidDateError, assertBSMonth, assertBSYear } from './validate'
import { minYear, maxYear } from './data/bs-data.generated'

export interface CalendarCell {
  bsYear: number
  bsMonth: number
  bsDay: number
  bsKey: string
  adDate: Date
  isOtherMonth: boolean
  isToday: boolean
  /** True when the cell falls outside the supported BS data range (only possible at BS 2000/01 or 2090/12 edges). */
  isOutOfRange?: boolean
}

export interface ADCalendarCell {
  year: number
  month: number
  day: number
  date: Date
  isOtherMonth: boolean
  isToday: boolean
}

export const EN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export const EN_DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const

export const EN_DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function daysInMonth(bsYear: number, bsMonth: number): number {
  assertBSYear(bsYear)
  assertBSMonth(bsMonth)
  return monthLengths[String(bsYear)]![bsMonth - 1]!
}

function bsKeyOf(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * 42-cell (6×7, Sunday-first) grid for a BS month.
 * Throws BSRangeError when the trailing/leading cells fall outside the
 * supported data range (only possible for BS 2000/01 and BS 2090/12).
 */
export function getMonthGrid(bsYear: number, bsMonth: number): CalendarCell[] {
  assertBSYear(bsYear)
  assertBSMonth(bsMonth)

  const cells: CalendarCell[] = []
  // Resolved once per grid: repeated calls can disagree across a midnight tick,
  // and toBS(now) throws once the current AD date passes the supported range.
  const todayKey = todayBSKey()

  // Previous month trailing days (epoch arithmetic — safe at range boundaries
  // as long as the resulting BS dates exist in the dataset)
  const firstEpoch = bsKeyToEpoch(bsYear, bsMonth, 1)
  const startDayOfWeek = civilWeekday(toAD(bsYear, bsMonth, 1))
  const minEpoch = bsKeyToEpoch(minYear, 1, 1)
  const lastMonthDays = monthLengths[String(maxYear)]!
  const maxEpoch = bsKeyToEpoch(maxYear, 12, lastMonthDays[11]!)
  for (let c = 0; c < startDayOfWeek; c++) {
    const epoch = firstEpoch - startDayOfWeek + c
    const adDate = epochDayNumberToAd(epoch)
    const inRange = epoch >= minEpoch
    const bs = inRange ? epochToBS(epoch) : extrapolatedBS(epoch, minEpoch, 'before')
    const key = bsKeyOf(bs.year, bs.month, bs.day)
    cells.push({
      bsYear: bs.year, bsMonth: bs.month, bsDay: bs.day,
      bsKey: key, adDate, isOtherMonth: true,
      isToday: key === todayKey,
      ...(inRange ? {} : { isOutOfRange: true }),
    })
  }

  // Current month
  const curDays = daysInMonth(bsYear, bsMonth)
  for (let day = 1; day <= curDays; day++) {
    const key = bsKeyOf(bsYear, bsMonth, day)
    cells.push({
      bsYear, bsMonth, bsDay: day,
      bsKey: key, adDate: toAD(bsYear, bsMonth, day), isOtherMonth: false,
      isToday: key === todayKey,
    })
  }

  // Next month leading days
  const nextEpochBase = firstEpoch + curDays
  let day = 1
  while (cells.length < 42) {
    const epoch = nextEpochBase + day - 1
    const adDate = epochDayNumberToAd(epoch)
    const inRange = epoch <= maxEpoch
    const bs = inRange ? epochToBS(epoch) : extrapolatedBS(epoch, maxEpoch, 'after')
    const key = bsKeyOf(bs.year, bs.month, bs.day)
    cells.push({
      bsYear: bs.year, bsMonth: bs.month, bsDay: bs.day,
      bsKey: key, adDate, isOtherMonth: true,
      isToday: key === todayKey,
      ...(inRange ? {} : { isOutOfRange: true }),
    })
    day++
  }

  return cells
}

/** Absolute day-number (AD 1970-01-01 = 0) → Date at UTC midnight. */
function epochDayNumberToAd(dayNumber: number): Date {
  return new Date(dayNumber * 86400000)
}

/**
 * Placeholder BS labels for out-of-range cells (only reachable at the BS
 * 2000/01 or 2090/12 grid edges).
 *
 * - `before`: BS 1999/12 labeled sequentially downward from day 30 — the day
 *   immediately before BS 2000/01/01 is exactly Chaitra 30, 1999 (the last
 *   supported day minus one), so the first out-of-range label is exact;
 *   deeper cells are nominal and flagged via `isOutOfRange`.
 * - `after`: BS 2091/01/01 is exactly the day after the last supported day,
 *   so forward labels are exact.
 */
function extrapolatedBS(dayNumber: number, boundaryEpoch: number, side: 'before' | 'after'): { year: number; month: number; day: number } {
  if (side === 'before') {
    const back = boundaryEpoch - dayNumber // 1, 2, 3 ...
    return { year: minYear - 1, month: 12, day: 31 - back }
  }
  const forward = dayNumber - boundaryEpoch // 1, 2, 3 ...
  return { year: maxYear + 1, month: 1, day: forward }
}

function bsKeyToEpoch(year: number, month: number, day: number): number {
  // Reuse toAD + civil date for a robust epoch translation
  const { year: adY, month: adM, day: adD } = civilYMD(toAD(year, month, day))
  return Math.round(Date.UTC(adY, adM - 1, adD) / 86400000)
}

function epochToBS(epochDayNumber: number): { year: number; month: number; day: number } {
  // Convert an absolute AD day number back to BS via toBS on a UTC-midnight Date
  const d = new Date(epochDayNumber * 86400000)
  return toBS(d)
}

/** BS key for "today", or `''` when today falls outside the supported range. */
function todayBSKey(): string {
  try {
    const t = toBS(new Date())
    return bsKeyOf(t.year, t.month, t.day)
  } catch {
    return ''
  }
}

export function getADMonthGrid(year: number, month: number): ADCalendarCell[] {
  if (!Number.isInteger(year) || year < 1) {
    throw new BSInvalidDateError(`Year must be a positive integer, got ${year}`)
  }
  if (!Number.isInteger(month) || month < 0 || month > 11) {
    throw new BSInvalidDateError(`Month ${month} out of range [0, 11]`)
  }

  const cells: ADCalendarCell[] = []
  const today = new Date()
  const todayStr = today.toDateString()

  const first = new Date(year, month, 1)
  const startDay = first.getDay()

  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const date = new Date(year, month - 1, day)
    cells.push({ year: date.getFullYear(), month: date.getMonth(), day, date, isOtherMonth: true, isToday: date.toDateString() === todayStr })
  }

  const curDays = new Date(year, month + 1, 0).getDate()
  for (let day = 1; day <= curDays; day++) {
    const date = new Date(year, month, day)
    cells.push({ year: date.getFullYear(), month: date.getMonth(), day, date, isOtherMonth: false, isToday: date.toDateString() === todayStr })
  }

  for (let day = 1; cells.length < 42; day++) {
    const date = new Date(year, month + 1, day)
    cells.push({ year: date.getFullYear(), month: date.getMonth(), day, date, isOtherMonth: true, isToday: date.toDateString() === todayStr })
  }

  return cells
}

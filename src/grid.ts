import { monthLengths } from './data/bs-data.generated'
import { toBS, toAD } from './core/convert'

export interface CalendarCell {
  bsYear: number
  bsMonth: number
  bsDay: number
  bsKey: string
  adDate: Date
  isOtherMonth: boolean
  isToday: boolean
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
  const months = monthLengths[String(bsYear)]
  if (!months) throw new RangeError(`No data for year ${bsYear}`)
  return months[bsMonth - 1]!
}

export function getADMonthGrid(year: number, month: number): ADCalendarCell[] {
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

export function getMonthGrid(bsYear: number, bsMonth: number): CalendarCell[] {
  const cells: CalendarCell[] = []
  const todayKey = (() => {
    const now = new Date()
    const bs = toBS(now)
    return `${bs.year}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')}`
  })()

  const firstOfMonth = toAD(bsYear, bsMonth, 1)
  const startDayOfWeek = firstOfMonth.getDay()

  const prevMonth = bsMonth === 1 ? 12 : bsMonth - 1
  const prevYear = bsMonth === 1 ? bsYear - 1 : bsYear
  const prevMonthDays = daysInMonth(prevYear, prevMonth)

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const date = toAD(prevYear, prevMonth, day)
    const key = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      bsYear: prevYear, bsMonth: prevMonth, bsDay: day,
      bsKey: key, adDate: date, isOtherMonth: true,
      isToday: key === todayKey,
    })
  }

  // Current month
  const curDays = daysInMonth(bsYear, bsMonth)
  for (let day = 1; day <= curDays; day++) {
    const date = toAD(bsYear, bsMonth, day)
    const key = `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      bsYear, bsMonth, bsDay: day,
      bsKey: key, adDate: date, isOtherMonth: false,
      isToday: key === todayKey,
    })
  }

  // Next month leading days
  const nextMonth = bsMonth === 12 ? 1 : bsMonth + 1
  const nextYear = bsMonth === 12 ? bsYear + 1 : bsYear
  const remaining = 42 - cells.length
  for (let day = 1; day <= remaining; day++) {
    const date = toAD(nextYear, nextMonth, day)
    const key = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      bsYear: nextYear, bsMonth: nextMonth, bsDay: day,
      bsKey: key, adDate: date, isOtherMonth: true,
      isToday: key === todayKey,
    })
  }

  return cells
}

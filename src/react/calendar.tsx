import React, { useState, useCallback, useMemo } from 'react'
import { toBS, toAD } from '../core/convert'
import { civilYMD } from '../core/epoch'
import { getMonthGrid } from '../grid'
import type { CalendarCell, ADCalendarCell } from '../grid'
import { toDevanagariNumeralsIn, nepaliMonthName } from '../nepali'
import { monthName } from '../format'
import { formatBSDate } from '../format-date'
import { minYear, maxYear } from '../data/bs-data.generated'

export type CalendarView = 'bs' | 'ad' | 'both'
export type CalendarLanguage = 'nepali' | 'english' | 'both'
export type CalendarTheme = 'default' | 'tailwind'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  dateType?: 'ad' | 'bs'
  endDate?: string
  type?: 'event' | 'holiday' | 'birthday' | 'reminder' | 'task'
  color?: string
  description?: string
  location?: string
  allDay?: boolean
  time?: string
  metadata?: Record<string, unknown>
}

export interface Holiday {
  date: string
  dateType?: 'ad' | 'bs'
  name: string
  nameNP?: string
  type?: 'public' | 'optional' | 'religious' | 'festival'
  color?: string
}

export interface CellData {
  cell: CalendarCell
  adCell: ADCalendarCell | undefined
  events: CalendarEvent[]
  holidays: Holiday[]
  eventOverflow: boolean
  visibleEvents: number
  /** True when minDate/maxDate/disablePast/disableFuture/disabledDates rule the day out. */
  disabled?: boolean
}

export interface BSCalendarClassNames {
  container?: string
  header?: string
  navButton?: string
  navPrev?: string
  navNext?: string
  monthYear?: string
  weekdays?: string
  weekday?: string
  daysGrid?: string
  cell?: string
  cellToday?: string
  cellSelected?: string
  cellOtherMonth?: string
  cellDisabled?: string
  cellWithEvents?: string
  cellWithHoliday?: string
  bsNumber?: string
  adNumber?: string
  eventDot?: string
  eventBar?: string
  holidayLabel?: string
  moreLink?: string
  eventList?: string
  eventItem?: string
  eventTime?: string
  eventTitle?: string
  eventPopup?: string
}

export interface BSCalendarStyles {
  container?: React.CSSProperties
  header?: React.CSSProperties
  navButton?: React.CSSProperties
  monthYear?: React.CSSProperties
  weekdays?: React.CSSProperties
  weekday?: React.CSSProperties
  daysGrid?: React.CSSProperties
  cell?: React.CSSProperties
  cellToday?: React.CSSProperties
  cellSelected?: React.CSSProperties
  cellOtherMonth?: React.CSSProperties
  cellDisabled?: React.CSSProperties
  cellWithEvents?: React.CSSProperties
  cellWithHoliday?: React.CSSProperties
  bsNumber?: React.CSSProperties
  adNumber?: React.CSSProperties
  eventDot?: React.CSSProperties
  eventBar?: React.CSSProperties
  holidayLabel?: React.CSSProperties
  moreLink?: React.CSSProperties
  eventPopup?: React.CSSProperties
  eventItem?: React.CSSProperties
  eventTitle?: React.CSSProperties
  eventTime?: React.CSSProperties
  eventList?: React.CSSProperties
}

export interface BSCalendarProps {
  view?: CalendarView
  language?: CalendarLanguage
  theme?: CalendarTheme

  initialDate?: Date
  initialBSYear?: number
  initialBSMonth?: number

  minBSYear?: number
  maxBSYear?: number

  /** Inclusive navigation/selection bounds — days outside render disabled. */
  minDate?: Date
  maxDate?: Date
  /** Disable all days before today. */
  disablePast?: boolean
  /** Disable all days after today. */
  disableFuture?: boolean
  /** Additional disabled dates (UTC-midnight or local civil — matched by civil key). */
  disabledDates?: Date[]

  /** Render digits in Devanagari (months header, day numbers, picker UI). */
  digits?: 'latin' | 'devanagari'

  /** Month/year quick-select dropdowns in the navigation header (reference-style). */
  enableMonthPicker?: boolean
  enableYearPicker?: boolean

  selectedDate?: Date
  onDateSelect?: (adDate: Date, bs: { year: number; month: number; day: number }) => void

  showNavigation?: boolean
  onMonthChange?: (bsYear: number, bsMonth: number, adYear: number, adMonth: number) => void

  classNames?: BSCalendarClassNames
  styles?: BSCalendarStyles

  showToday?: boolean
  showAdjacentDays?: boolean

  renderDay?: (data: CellData) => React.ReactNode
  renderHeader?: (monthName: string, year: string, view: 'bs' | 'ad') => React.ReactNode
  renderEvent?: (event: CalendarEvent, compact: boolean) => React.ReactNode
  renderHoliday?: (holiday: Holiday) => React.ReactNode

  events?: CalendarEvent[]
  holidays?: Holiday[]
  maxVisibleEvents?: number
  onEventClick?: (event: CalendarEvent, adDate: Date) => void
  onHolidayClick?: (holiday: Holiday, adDate: Date) => void
  showEventDots?: boolean
  showEventBars?: boolean
  showHolidayLabels?: boolean
  showEventList?: boolean
  showPopupOnHover?: boolean

  dateFormat?: string
  cellAspectRatio?: number
}

const defaultStyles: Required<BSCalendarStyles> = {
  container: { fontFamily: 'system-ui, sans-serif', maxWidth: 480, userSelect: 'none' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' },
  navButton: { background: 'none', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', padding: '4px 12px', fontSize: 16 },
  monthYear: { fontSize: 16, fontWeight: 600 },
  weekdays: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 12, color: '#666', marginBottom: 4 },
  weekday: { padding: '4px 0' },
  daysGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 1 },
  cell: { textAlign: 'center', padding: 4, cursor: 'pointer', borderRadius: 4, minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', transition: 'background 0.15s', position: 'relative' },
  cellToday: { background: '#e3f2fd', fontWeight: 700 },
  cellSelected: { background: '#bbdefb', fontWeight: 700, border: '2px solid #1976d2' },
  cellOtherMonth: { opacity: 0.3 },
  cellDisabled: { opacity: 0.35, textDecoration: 'line-through', cursor: 'not-allowed' },
  cellWithEvents: {},
  cellWithHoliday: { background: '#fff3e0' },
  bsNumber: { fontSize: 13, lineHeight: 1.3 },
  adNumber: { fontSize: 9, color: '#888', lineHeight: 1.2 },
  eventDot: { width: 5, height: 5, borderRadius: '50%', display: 'inline-block', margin: '0 1px' },
  eventBar: { height: 3, borderRadius: 2, marginTop: 1, width: '80%' },
  holidayLabel: { fontSize: 9, color: '#e65100', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 2px' },
  moreLink: { fontSize: 9, color: '#1976d2', cursor: 'pointer', fontWeight: 600 },
  eventPopup: { position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: 'white', border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', padding: 8, zIndex: 10, minWidth: 180, textAlign: 'left' },
  eventItem: { display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0', fontSize: 11 },
  eventTitle: { fontWeight: 500 },
  eventTime: { color: '#666', fontSize: 10 },
  eventList: {},
}

const tailwindClasses: Required<BSCalendarClassNames> = {
  container: 'nbs-calendar max-w-md select-none',
  header: 'flex items-center justify-between px-1 py-2',
  navButton: 'px-3 py-1 text-lg rounded border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer bg-white',
  navPrev: '', navNext: '',
  monthYear: 'text-base font-semibold text-gray-800',
  weekdays: 'grid grid-cols-7 text-center text-xs text-gray-500 mb-1',
  weekday: 'py-1',
  daysGrid: 'grid grid-cols-7 gap-0.5 auto-rows-fr',
  cell: 'text-center p-1 rounded cursor-pointer min-h-[56px] flex flex-col items-center justify-start transition-colors hover:bg-gray-50 relative',  cellToday: 'bg-blue-50 font-bold ring-1 ring-blue-300',
  cellSelected: 'bg-blue-100 font-bold ring-2 ring-blue-500',
  cellOtherMonth: 'opacity-30',
  cellDisabled: 'opacity-40 line-through cursor-not-allowed',
  cellWithEvents: '', cellWithHoliday: 'bg-orange-50',
  bsNumber: 'text-xs leading-tight', adNumber: 'text-[9px] text-gray-400 leading-tight',
  eventDot: 'w-1.5 h-1.5 rounded-full inline-block mx-0.5',
  eventBar: 'h-0.5 rounded mt-0.5 w-4/5',
  holidayLabel: 'text-[9px] text-orange-700 leading-tight truncate w-full px-0.5',
  moreLink: 'text-[9px] text-blue-600 cursor-pointer font-semibold',
  eventPopup: 'absolute bottom-full left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[180px] text-left text-xs',
  eventItem: 'flex items-center gap-1 py-0.5 text-xs',
  eventTitle: 'font-medium',
  eventTime: 'text-gray-500 text-[10px]',
  eventList: '',
}

function dateToKey(date: Date): string {
  const { year, month, day } = civilYMD(date)
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

/** Lexicographic compare of BS {y,m,d} triples. */
function cmpBS(a: { y: number; m: number; d: number }, b: { y: number; m: number; d: number }): number {
  return a.y !== b.y ? a.y - b.y : a.m !== b.m ? a.m - b.m : a.d - b.d
}

function resolveDateKey(dateStr: string, dateType?: 'ad' | 'bs'): string {
  if (dateType === 'bs') {
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const y = Number(parts[0]), m = Number(parts[1]), d = Number(parts[2])
    if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr
    try {
      return dateToKey(toAD(y, m, d))
    } catch {
      return dateStr
    }
  }
  // AD keys are normalized through civilYMD so 'YYYY-M-D' and 'YYYY-MM-DD'
  // both resolve to the same padded key.
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const y = Number(parts[0]), m = Number(parts[1]), d = Number(parts[2])
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return dateStr
}

export function BSCalendar({
  view = 'both',
  language = 'both',
  theme = 'default',
  initialBSYear,
  initialBSMonth,
  selectedDate: propSelectedDate,
  onDateSelect,
  showNavigation = true,
  onMonthChange,
  classNames: customClasses,
  styles: customStyles,
  renderDay,
  renderHeader,
  renderEvent,
  renderHoliday,
  events = [],
  holidays = [],
  maxVisibleEvents = 2,
  onEventClick,
  onHolidayClick,
  showEventDots = true,
  showEventBars = false,
  showHolidayLabels = true,
  showEventList = false,
  showPopupOnHover = false,
  dateFormat,
  cellAspectRatio = 1,
  initialDate,
  minBSYear,
  maxBSYear,
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  disabledDates,
  digits = 'latin',
  enableMonthPicker = false,
  enableYearPicker = false,
}: BSCalendarProps) {
  const today = useMemo(() => new Date(), [])
  const bsToday = useMemo(() => toBS(today), [today])

  const initial = useMemo(() => {
    if (initialBSYear != null && initialBSMonth != null) return { year: initialBSYear, month: initialBSMonth }
    if (initialDate) {
      try {
        const bs = toBS(initialDate)
        return { year: bs.year, month: bs.month }
      } catch { /* fall through to today */ }
    }
    return { year: bsToday.year, month: bsToday.month }
  }, [initialBSYear, initialBSMonth, initialDate, bsToday])

  // Navigation bounds (props may narrow the package data range)
  const minY = minBSYear ?? minYear
  const maxY = maxBSYear ?? maxYear

  const [bsYear, setBsYear] = useState(() => Math.min(Math.max(initial.year, minY), maxY))
  const [bsMonth, setBsMonth] = useState(initial.month)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(propSelectedDate)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [yearPickerOpen, setYearPickerOpen] = useState(false)

  // Digit rendering: 'devanagari' transliterates every Latin digit in the UI.
  const num = useCallback((n: number | string) => (digits === 'devanagari' ? toDevanagariNumeralsIn(String(n)) : String(n)), [digits])

  // Selection bounds: day-precise epoch limits + year clamp derived from the
  // minDate/maxDate instants and the BS year-range props.
  const bounds = useMemo(() => {
    const dayEpoch = (dt: Date) => {
      const c = civilYMD(dt)
      return Math.floor(Date.UTC(c.year, c.month - 1, c.day) / 86400000)
    }
    let minBS = { y: minBSYear != null ? Math.max(minBSYear, minYear) : minYear, m: 1, d: 1 }
    let maxBS = { y: maxBSYear != null ? Math.min(maxBSYear, maxYear) : maxYear, m: 12, d: 31 }
    let minEd: number | null = null
    let maxEd: number | null = null
    if (minDate) {
      minEd = dayEpoch(minDate)
      try { const b = toBS(minDate); if (cmpBS({ y: b.year, m: b.month, d: b.day }, minBS) > 0) minBS = { y: b.year, m: b.month, d: b.day } } catch { /* ignore */ }
    }
    if (maxDate) {
      maxEd = dayEpoch(maxDate)
      try { const b = toBS(maxDate); if (cmpBS({ y: b.year, m: b.month, d: b.day }, maxBS) < 0) maxBS = { y: b.year, m: b.month, d: b.day } } catch { /* ignore */ }
    }
    return { todayEd: dayEpoch(today), minEd, maxEd, minBS, maxBS }
  }, [today, minBSYear, maxBSYear, minDate, maxDate])

  const disabledKeys = useMemo(() => {
    const set = new Set<string>()
    for (const d of disabledDates ?? []) set.add(dateToKey(d))
    return set
  }, [disabledDates])

  const isDayDisabled = useCallback((cell: CalendarCell) => {
    if (cell.isOutOfRange) return true
    let ed: number
    try { ed = Math.floor(toAD(cell.bsYear, cell.bsMonth, cell.bsDay).getTime() / 86400000) } catch { return true }
    if (bounds.minEd != null && ed < bounds.minEd) return true
    if (bounds.maxEd != null && ed > bounds.maxEd) return true
    if (disablePast && ed < bounds.todayEd) return true
    if (disableFuture && ed > bounds.todayEd) return true
    return disabledKeys.has(cell.bsKey)
  }, [bounds, disablePast, disableFuture, disabledKeys])

  const bsGrid = useMemo(() => getMonthGrid(bsYear, bsMonth), [bsYear, bsMonth])
  const adGrid = useMemo(() => {
    // Derive the AD month cell-for-cell from the BS grid so both arrays always
    // describe identical days (independent AD grids misalign at month edges).
    return bsGrid.map(cell => {
      const { year, month, day } = civilYMD(cell.adDate)
      const cellDate = new Date(year, month - 1, day)
      return {
        year, month: month - 1, day,
        date: cellDate,
        isOtherMonth: cell.isOtherMonth,
        isToday: cellDate.toDateString() === today.toDateString(),
      }
    })
  }, [bsGrid, today])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const key = resolveDateKey(ev.date, ev.dateType)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
      if (ev.endDate) {
        const endKey = resolveDateKey(ev.endDate, ev.dateType)
        let current = new Date(key + 'T00:00:00')
        const end = new Date(endKey + 'T00:00:00')
        while (current < end) {
          current.setDate(current.getDate() + 1)
          const k = dateToKey(current)
          if (!map.has(k)) map.set(k, [])
          map.get(k)!.push(ev)
        }
      }
    }
    return map
  }, [events])

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, Holiday[]>()
    for (const h of holidays) {
      const key = resolveDateKey(h.date, h.dateType)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(h)
    }
    return map
  }, [holidays])

  const cellDataMap = useMemo(() => {
    const map = new Map<string, CellData>()
    for (let i = 0; i < bsGrid.length; i++) {
      const cell = bsGrid[i]!
      const adC = adGrid[i]
      const adKey = dateToKey(cell.adDate)
      const cellEvents = eventsByDate.get(adKey) ?? []
      const cellHolidays = holidaysByDate.get(adKey) ?? []
      const totalItems = cellEvents.length + cellHolidays.length
      map.set(cell.bsKey, {
        cell,
        adCell: adC,
        events: cellEvents,
        holidays: cellHolidays,
        eventOverflow: totalItems > maxVisibleEvents,
        visibleEvents: maxVisibleEvents,
        disabled: isDayDisabled(cell),
      })
    }
    return map
  }, [bsGrid, adGrid, eventsByDate, holidaysByDate, maxVisibleEvents])

  const isTailwind = theme === 'tailwind'

  const cls = useMemo(() => {
    if (isTailwind) return { ...tailwindClasses, ...customClasses }
    return customClasses ?? {} as BSCalendarClassNames
  }, [theme, customClasses, isTailwind])

  const styles: BSCalendarStyles = useMemo(() => {
    if (theme === 'default') return { ...defaultStyles, ...customStyles }
    return customStyles ?? {}
  }, [theme, customStyles])

  const prevMonth = useCallback(() => {
    setBsMonth(m => {
      if (m === 1) { setBsYear(y => y - 1); return 12 }
      return m - 1
    })
  }, [])

  const nextMonth = useCallback(() => {
    setBsMonth(m => {
      if (m === 12) { setBsYear(y => y + 1); return 1 }
      return m + 1
    })
  }, [])

  const canGoPrev = (bsMonth === 1 ? bsYear - 1 : bsYear) >= minY
  const canGoNext = (bsMonth === 12 ? bsYear + 1 : bsYear) <= maxY

  const handleDateSelect = useCallback((cell: CalendarCell) => {
    if (isDayDisabled(cell)) return // out of range, bounded, or explicitly disabled
    const date = toAD(cell.bsYear, cell.bsMonth, cell.bsDay)
    setSelectedDate(date)
    onDateSelect?.(date, { year: cell.bsYear, month: cell.bsMonth, day: cell.bsDay })
  }, [onDateSelect, isDayDisabled])

  /** Jump to a specific month (month/year quick-select) within the data range. */
  const jumpToMonth = useCallback((year: number, month: number) => {
    const y = Math.min(Math.max(year, bounds.minBS.y), bounds.maxBS.y)
    setBsYear(y)
    setBsMonth(month)
    setMonthPickerOpen(false)
    setYearPickerOpen(false)
  }, [bounds])

  const handleMonthChange = useCallback((dir: 'prev' | 'next') => {
    if (dir === 'prev' && !canGoPrev) return
    if (dir === 'next' && !canGoNext) return
    // Compute the target month up-front and report it with the change event —
    // the old code reported the *previous* month via a stale setTimeout.
    let targetYear = bsYear
    let targetMonth = bsMonth
    if (dir === 'prev') {
      targetMonth = bsMonth === 1 ? 12 : bsMonth - 1
      if (bsMonth === 1) targetYear = bsYear - 1
    } else {
      targetMonth = bsMonth === 12 ? 1 : bsMonth + 1
      if (bsMonth === 12) targetYear = bsYear + 1
    }
    if (dir === 'prev') prevMonth()
    else nextMonth()
    const adFirst = toAD(targetYear, targetMonth, 1)
    onMonthChange?.(targetYear, targetMonth, adFirst.getFullYear(), adFirst.getMonth())
  }, [prevMonth, nextMonth, onMonthChange, bsYear, bsMonth, canGoPrev, canGoNext])

  const renderWeekdays = useCallback(() => {
    // Keep Nepali day headers; translate for non-Nepali language modes.
    const names = language === 'english'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['आइत', 'सोम', 'मङ्गल', 'बुध', 'बिहि', 'शुक्र', 'शनि']
    return names.map((d, i) => {
      const props = isTailwind ? { className: cls.weekday }
        : { style: styles.weekday }
      return <div key={i} {...props}>{d}</div>
    })
  }, [cls, styles, isTailwind, language])

  const getCellClasses = useCallback((data: CellData) => {
    const { cell } = data
    const isCellToday = cell.isToday
    const isCellSelected = selectedDate && dateToKey(cell.adDate) === dateToKey(selectedDate)
    const hasEvents = data.events.length > 0 || data.holidays.length > 0
    const parts = [isTailwind ? cls.cell : undefined]
    if (isCellToday) parts.push(isTailwind ? cls.cellToday : undefined)
    if (isCellSelected) parts.push(isTailwind ? cls.cellSelected : undefined)
    if (cell.isOtherMonth) parts.push(isTailwind ? cls.cellOtherMonth : undefined)
    if (data.disabled) parts.push(isTailwind ? cls.cellDisabled : undefined)
    if (hasEvents && data.holidays.length > 0) parts.push(isTailwind ? cls.cellWithHoliday : undefined)
    return parts.filter(Boolean).join(' ') || undefined
  }, [cls, selectedDate, isTailwind])

  /**
   * Stable cell geometry for every theme: cells keep width × cellAspectRatio
   * height (aspect-ratio CSS, default 1 — a uniform square-ish grid), floored
   * so event dots/labels never collapse a row. Empty cells no longer shrink.
   */
  const getCellStyle = useCallback((data: CellData): React.CSSProperties => {
    const { cell } = data
    const base: React.CSSProperties = { aspectRatio: String(cellAspectRatio) }
    if (theme === 'default') {
      Object.assign(base, styles.cell)
      if (cell.isToday && styles.cellToday) Object.assign(base, styles.cellToday)
      if (selectedDate && dateToKey(cell.adDate) === dateToKey(selectedDate) && styles.cellSelected) Object.assign(base, styles.cellSelected)
      if (cell.isOtherMonth && styles.cellOtherMonth) Object.assign(base, styles.cellOtherMonth)
      if (data.disabled && styles.cellDisabled) Object.assign(base, styles.cellDisabled)
      if (data.holidays.length > 0 && styles.cellWithHoliday) Object.assign(base, styles.cellWithHoliday)
    }
    return base
  }, [styles, selectedDate, cellAspectRatio, theme])

  return (
    <div
      className={cls.container || undefined}
      style={theme === 'default' ? styles.container as React.CSSProperties : undefined}
    >
      {showNavigation && (
        <div
          className={cls.header || undefined}
          style={theme === 'default' ? styles.header as React.CSSProperties : undefined}
        >
          <button
            className={[cls.navButton, cls.navPrev].filter(Boolean).join(' ') || undefined}
            style={theme === 'default' ? { ...(styles.navButton as React.CSSProperties), ...(canGoPrev ? {} : { opacity: 0.3, cursor: 'default' }) } : undefined}
            onClick={() => handleMonthChange('prev')}
            disabled={!canGoPrev}
          >
            ‹
          </button>
          {renderHeader
            ? renderHeader(monthName(bsMonth), String(bsYear), 'bs')
            : (
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
                {enableMonthPicker ? (
                  <button
                    type="button"
                    onClick={() => { setMonthPickerOpen(o => !o); setYearPickerOpen(false) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 'inherit', color: 'inherit', padding: 0 }}
                  >
                    {language === 'nepali'
                      ? nepaliMonthName(bsMonth)
                      : language === 'both'
                        ? `${monthName(bsMonth)} / ${nepaliMonthName(bsMonth)}`
                        : monthName(bsMonth)}
                    <span style={{ fontSize: 9, marginLeft: 2 }}>▾</span>
                  </button>
                ) : (
                  <span
                    className={cls.monthYear || undefined}
                    style={theme === 'default' ? styles.monthYear as React.CSSProperties : undefined}
                  >
                    {language === 'nepali'
                      ? nepaliMonthName(bsMonth)
                      : language === 'both'
                        ? `${monthName(bsMonth)} ${num(bsYear)} / ${nepaliMonthName(bsMonth)}`
                        : `${monthName(bsMonth)} ${num(bsYear)}`}
                  </span>
                )}
                {enableYearPicker && (
                  <button
                    type="button"
                    onClick={() => { setYearPickerOpen(o => !o); setMonthPickerOpen(false) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 'inherit', color: 'inherit', padding: 0 }}
                  >
                    {num(bsYear)}<span style={{ fontSize: 9, marginLeft: 2 }}>▾</span>
                  </button>
                )}
                {monthPickerOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 30, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', padding: 6, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, minWidth: 200 }}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => jumpToMonth(bsYear, m)}
                        style={{
                          border: m === bsMonth ? '1px solid #2563eb' : '1px solid transparent',
                          background: m === bsMonth ? '#eff6ff' : 'transparent',
                          borderRadius: 4, padding: '4px 6px', fontSize: 11, cursor: 'pointer',
                          color: m === bsMonth ? '#2563eb' : '#374151', fontWeight: m === bsMonth ? 600 : 400,
                        }}
                      >
                        {language === 'nepali' ? nepaliMonthName(m) : monthName(m)}
                      </button>
                    ))}
                  </div>
                )}
                {yearPickerOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 30, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', padding: 6, maxHeight: 210, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, minWidth: 190 }}>
                    {Array.from({ length: bounds.maxBS.y - bounds.minBS.y + 1 }, (_, i) => bounds.minBS.y + i).map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => jumpToMonth(y, bsMonth)}
                        style={{
                          border: y === bsYear ? '1px solid #2563eb' : '1px solid transparent',
                          background: y === bsYear ? '#eff6ff' : 'transparent',
                          borderRadius: 4, padding: '3px 4px', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace',
                          color: y === bsYear ? '#2563eb' : '#374151', fontWeight: y === bsYear ? 600 : 400,
                        }}
                      >
                        {num(y)}
                      </button>
                    ))}
                  </div>
                )}
              </span>
            )
          }
          <button
            className={[cls.navButton, cls.navNext].filter(Boolean).join(' ') || undefined}
            style={theme === 'default' ? { ...(styles.navButton as React.CSSProperties), ...(canGoNext ? {} : { opacity: 0.3, cursor: 'default' }) } : undefined}
            onClick={() => handleMonthChange('next')}
            disabled={!canGoNext}
          >
            ›
          </button>
        </div>
      )}

      <div
        className={cls.weekdays || undefined}
        style={theme === 'default' ? styles.weekdays as React.CSSProperties : undefined}
      >
        {renderWeekdays()}
      </div>

      <div
        className={cls.daysGrid || undefined}
        style={theme === 'default' ? styles.daysGrid as React.CSSProperties : undefined}
      >
        {bsGrid.map((cell) => {
          const data = cellDataMap.get(cell.bsKey)!
          const isHovered = hoveredCell === cell.bsKey

          if (renderDay) {
            const disabled = data.disabled === true
            return (
              <div
                key={cell.bsKey}
                className={isTailwind ? getCellClasses(data) : undefined}
                style={getCellStyle(data)}
                onClick={() => { if (!disabled) handleDateSelect(cell) }}
                onMouseEnter={() => setHoveredCell(cell.bsKey)}
                onMouseLeave={() => setHoveredCell(null)}
                aria-disabled={disabled || undefined}
              >
                {renderDay(data)}
              </div>
            )
          }

          const dayNumber = dateFormat
            ? num(formatBSDate(cell.adDate, dateFormat))
            : (language === 'nepali' || digits === 'devanagari' ? num(cell.bsDay) : String(cell.bsDay))
          const showAd = view === 'both' || view === 'ad'
          const showBs = view === 'both' || view === 'bs'

          return (
            <div
              key={cell.bsKey}
              className={isTailwind ? getCellClasses(data) : undefined}
              style={getCellStyle(data)}
              onClick={() => { if (!data.disabled) handleDateSelect(cell) }}
              onMouseEnter={() => setHoveredCell(cell.bsKey)}
              onMouseLeave={() => setHoveredCell(null)}
              aria-disabled={data.disabled || undefined}
            >
              {showBs && (
                <span
                  className={cls.bsNumber || undefined}
                  style={theme === 'default' ? styles.bsNumber as React.CSSProperties : undefined}
                >
                  {dayNumber}
                </span>
              )}
              {showAd && (view === 'ad' || view === 'both') && (
                <span
                  className={cls.adNumber || undefined}
                  style={theme === 'default' ? styles.adNumber as React.CSSProperties : undefined}
                >
                  {num(civilYMD(cell.adDate).day)}
                </span>
              )}

              <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
                {showHolidayLabels && data.holidays.slice(0, maxVisibleEvents).map(h => (
                  renderHoliday
                    ? <div key={h.date + h.name} onClick={(e) => { e.stopPropagation(); onHolidayClick?.(h, cell.adDate) }}>{renderHoliday(h)}</div>
                    : (
                      <div
                        key={h.date + h.name}
                        className={cls.holidayLabel || undefined}
                        style={theme === 'default' ? { ...styles.holidayLabel as React.CSSProperties, color: h.color || '#e65100' } : undefined}
                        onClick={(e) => { e.stopPropagation(); onHolidayClick?.(h, cell.adDate) }}
                      >
                        {language === 'nepali' ? h.nameNP || h.name : h.name}
                      </div>
                    )
                ))}
                {showEventDots && data.events.length > 0 && data.holidays.length === 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {data.events.slice(0, 5).map(ev => (
                      <div
                        key={ev.id}
                        className={cls.eventDot || undefined}
                        style={theme === 'default' ? { ...styles.eventDot as React.CSSProperties, background: ev.color || '#1976d2' } : undefined}
                        title={ev.title}
                      />
                    ))}
                    {data.events.length > 5 && (
                      <span style={{ fontSize: 8 }}>+{data.events.length - 5}</span>
                    )}
                  </div>
                )}
                {showEventBars && data.events.slice(0, maxVisibleEvents).map(ev => (
                  <div
                    key={ev.id}
                    className={cls.eventBar || undefined}
                    style={theme === 'default' ? { ...styles.eventBar as React.CSSProperties, background: ev.color || '#1976d2' } : undefined}
                    title={ev.title}
                    onClick={(e) => { e.stopPropagation(); onEventClick?.(ev, cell.adDate) }}
                  />
                ))}
                {showEventList && data.events.slice(0, maxVisibleEvents).map(ev => (
                  renderEvent
                    ? <div key={ev.id} onClick={(e) => { e.stopPropagation(); onEventClick?.(ev, cell.adDate) }}>{renderEvent(ev, true)}</div>
                    : (
                      <div
                        key={ev.id}
                        className={cls.eventItem || undefined}
                        style={theme === 'default' ? styles.eventItem as React.CSSProperties : undefined}
                        onClick={(e) => { e.stopPropagation(); onEventClick?.(ev, cell.adDate) }}
                      >
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: ev.color || '#1976d2', flexShrink: 0 }} />
                        <span className={cls.eventTitle || undefined} style={theme === 'default' ? styles.eventTitle as React.CSSProperties : undefined}>
                          {ev.time && <span className={cls.eventTime || undefined} style={theme === 'default' ? styles.eventTime as React.CSSProperties : undefined}>{ev.time} </span>}
                          {ev.title}
                        </span>
                      </div>
                    )
                ))}
                {data.eventOverflow && (
                  <span
                    className={cls.moreLink || undefined}
                    style={theme === 'default' ? styles.moreLink as React.CSSProperties : undefined}
                    onClick={(e) => { e.stopPropagation(); /* could open popup */ }}
                  >
                    +{data.events.length + data.holidays.length - maxVisibleEvents} more
                  </span>
                )}
              </div>

              {showPopupOnHover && isHovered && (data.events.length > 0 || data.holidays.length > 0) && (
                <div
                  className={cls.eventPopup || undefined}
                  style={theme === 'default' ? styles.eventPopup as React.CSSProperties : undefined}
                >
                  {data.holidays.map(h => (
                    <div
                      key={h.date + h.name}
                      className={cls.eventItem || undefined}
                      style={theme === 'default' ? { ...styles.eventItem as React.CSSProperties, color: h.color || '#e65100' } : undefined}
                    >
                      {h.name}
                    </div>
                  ))}
                  {data.events.map(ev => (
                    <div
                      key={ev.id}
                      className={cls.eventItem || undefined}
                      style={theme === 'default' ? styles.eventItem as React.CSSProperties : undefined}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: ev.color || '#1976d2', flexShrink: 0 }} />
                      <span>
                        {ev.time && <span style={{ color: '#666', fontSize: 10 }}>{ev.time} </span>}
                        {ev.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

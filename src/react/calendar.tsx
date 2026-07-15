import React, { useState, useCallback, useMemo } from 'react'
import { toBS, toAD } from '../core/convert'
import { getMonthGrid, getADMonthGrid } from '../grid'
import type { CalendarCell, ADCalendarCell } from '../grid'
import { toDevanagariNumeral, nepaliMonthName } from '../nepali'
import { monthName } from '../format'
import { formatBSDate } from '../format-date'

export type CalendarView = 'bs' | 'ad' | 'both'
export type CalendarLanguage = 'nepali' | 'english' | 'both'
export type CalendarTheme = 'default' | 'tailwind' | 'bootstrap'

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
  daysGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 },
  cell: { textAlign: 'center', padding: 4, cursor: 'pointer', borderRadius: 4, minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', transition: 'background 0.15s', position: 'relative' },
  cellToday: { background: '#e3f2fd', fontWeight: 700 },
  cellSelected: { background: '#bbdefb', fontWeight: 700, border: '2px solid #1976d2' },
  cellOtherMonth: { opacity: 0.3 },
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
  container: 'bs-calendar max-w-md select-none',
  header: 'flex items-center justify-between px-1 py-2',
  navButton: 'px-3 py-1 text-lg rounded border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer bg-white',
  navPrev: '', navNext: '',
  monthYear: 'text-base font-semibold text-gray-800',
  weekdays: 'grid grid-cols-7 text-center text-xs text-gray-500 mb-1',
  weekday: 'py-1',
  daysGrid: 'grid grid-cols-7 gap-0.5',
  cell: 'text-center p-1 rounded cursor-pointer min-h-[56px] flex flex-col items-center justify-start transition-colors hover:bg-gray-50 relative',
  cellToday: 'bg-blue-50 font-bold ring-1 ring-blue-300',
  cellSelected: 'bg-blue-100 font-bold ring-2 ring-blue-500',
  cellOtherMonth: 'opacity-30',
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

const bootstrapClasses: Required<BSCalendarClassNames> = {
  container: 'bs-calendar',
  header: 'd-flex align-items-center justify-content-between py-2',
  navButton: 'btn btn-outline-secondary btn-sm',
  navPrev: '', navNext: '',
  monthYear: 'h5 mb-0 fw-semibold',
  weekdays: 'd-grid text-center small text-muted mb-1',
  weekday: 'py-1',
  daysGrid: 'd-grid gap-0',
  cell: 'text-center p-1 rounded cursor-pointer d-flex flex-column align-items-center justify-content-start position-relative',
  cellToday: 'bg-info bg-opacity-10 fw-bold border border-info',
  cellSelected: 'bg-primary bg-opacity-10 fw-bold border border-primary',
  cellOtherMonth: 'text-muted opacity-50',
  cellWithEvents: '', cellWithHoliday: 'bg-warning bg-opacity-10',
  bsNumber: 'small', adNumber: 'smaller text-muted',
  eventDot: 'd-inline-block rounded-circle mx-0.5',
  eventBar: 'rounded mt-0.5 w-80',
  holidayLabel: 'small text-warning-emphasis text-truncate w-100 px-0.5',
  moreLink: 'small text-primary fw-semibold cursor-pointer',
  eventPopup: 'position-absolute bottom-100 start-50 translate-middle-x bg-white border border-secondary rounded shadow p-2 z-10 min-w-180px text-start small',
  eventItem: 'd-flex align-items-center gap-1 py-0.5 small',
  eventTitle: 'fw-medium',
  eventTime: 'text-muted',
  eventList: '',
}

function dateToKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
}: BSCalendarProps) {
  const today = useMemo(() => new Date(), [])
  const bsToday = useMemo(() => toBS(today), [today])

  const [bsYear, setBsYear] = useState(initialBSYear ?? bsToday.year)
  const [bsMonth, setBsMonth] = useState(initialBSMonth ?? bsToday.month)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(propSelectedDate)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  const adFirst = useMemo(() => toAD(bsYear, bsMonth, 1), [bsYear, bsMonth])
  const adYear = adFirst.getFullYear()
  const adMonth = adFirst.getMonth()

  const bsGrid = useMemo(() => getMonthGrid(bsYear, bsMonth), [bsYear, bsMonth])
  const adGrid = useMemo(() => getADMonthGrid(adYear, adMonth), [adYear, adMonth])

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
      })
    }
    return map
  }, [bsGrid, adGrid, eventsByDate, holidaysByDate, maxVisibleEvents])

  const isTailwind = theme === 'tailwind'
  const isBootstrap = theme === 'bootstrap'

  const cls = useMemo(() => {
    if (isTailwind) return { ...tailwindClasses, ...customClasses }
    if (isBootstrap) return { ...bootstrapClasses, ...customClasses }
    return customClasses ?? {} as BSCalendarClassNames
  }, [theme, customClasses, isTailwind, isBootstrap])

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

  const handleDateSelect = useCallback((cell: CalendarCell) => {
    const date = toAD(cell.bsYear, cell.bsMonth, cell.bsDay)
    setSelectedDate(date)
    onDateSelect?.(date, { year: cell.bsYear, month: cell.bsMonth, day: cell.bsDay })
  }, [onDateSelect])

  const handleMonthChange = useCallback((dir: 'prev' | 'next') => {
    const prevBsYear = bsYear
    const prevBsMonth = bsMonth
    if (dir === 'prev') prevMonth()
    else nextMonth()
    setTimeout(() => onMonthChange?.(prevBsYear, prevBsMonth, adYear, adMonth), 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevMonth, nextMonth, onMonthChange])

  const renderWeekdays = useCallback(() => {
    const names = ['आइत', 'सोम', 'मङ्गल', 'बुध', 'बिहि', 'शुक्र', 'शनि']
    return names.map((d, i) => {
      const props = isTailwind ? { className: cls.weekday }
        : isBootstrap ? { className: cls.weekday }
        : { style: styles.weekday }
      return <div key={i} {...props}>{d}</div>
    })
  }, [cls, styles, isTailwind, isBootstrap])

  const getCellClasses = useCallback((data: CellData) => {
    const { cell } = data
    const isCellToday = cell.isToday
    const isCellSelected = selectedDate && cell.adDate.toDateString() === selectedDate.toDateString()
    const hasEvents = data.events.length > 0 || data.holidays.length > 0
    const parts = [isTailwind || isBootstrap ? cls.cell : undefined]
    if (isCellToday) parts.push(isTailwind ? cls.cellToday : isBootstrap ? cls.cellToday : undefined)
    if (isCellSelected) parts.push(isTailwind ? cls.cellSelected : isBootstrap ? cls.cellSelected : undefined)
    if (cell.isOtherMonth) parts.push(isTailwind ? cls.cellOtherMonth : isBootstrap ? cls.cellOtherMonth : undefined)
    if (hasEvents && data.holidays.length > 0) parts.push(isTailwind ? cls.cellWithHoliday : isBootstrap ? cls.cellWithHoliday : undefined)
    return parts.filter(Boolean).join(' ') || undefined
  }, [cls, styles, selectedDate, isTailwind, isBootstrap])

  const getCellStyle = useCallback((data: CellData): React.CSSProperties => {
    const { cell } = data
    const base: React.CSSProperties = { ...(styles.cell as React.CSSProperties || {}) }
    if (cell.isToday && styles.cellToday) Object.assign(base, styles.cellToday)
    if (selectedDate && cell.adDate.toDateString() === selectedDate.toDateString() && styles.cellSelected) Object.assign(base, styles.cellSelected)
    if (cell.isOtherMonth && styles.cellOtherMonth) Object.assign(base, styles.cellOtherMonth)
    if (data.holidays.length > 0 && styles.cellWithHoliday) Object.assign(base, styles.cellWithHoliday)
    return base
  }, [styles, selectedDate])

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
            style={theme === 'default' ? styles.navButton as React.CSSProperties : undefined}
            onClick={() => handleMonthChange('prev')}
          >
            ‹
          </button>
          {renderHeader
            ? renderHeader(monthName(bsMonth), String(bsYear), 'bs')
            : (
              <span
                className={cls.monthYear || undefined}
                style={theme === 'default' ? styles.monthYear as React.CSSProperties : undefined}
              >
                {language === 'nepali'
                  ? `${nepaliMonthName(bsMonth)} ${toDevanagariNumeral(bsYear)}`
                  : language === 'both'
                    ? `${monthName(bsMonth)} ${bsYear} / ${nepaliMonthName(bsMonth)} ${toDevanagariNumeral(bsYear)}`
                    : `${monthName(bsMonth)} ${bsYear}`}
              </span>
            )
          }
          <button
            className={[cls.navButton, cls.navNext].filter(Boolean).join(' ') || undefined}
            style={theme === 'default' ? styles.navButton as React.CSSProperties : undefined}
            onClick={() => handleMonthChange('next')}
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
            return (
              <div
                key={cell.bsKey}
                className={isTailwind || isBootstrap ? getCellClasses(data) : undefined}
                style={theme === 'default' ? getCellStyle(data) : undefined}
                onClick={() => handleDateSelect(cell)}
                onMouseEnter={() => setHoveredCell(cell.bsKey)}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {renderDay(data)}
              </div>
            )
          }

          const dayNumber = dateFormat
            ? formatBSDate(cell.adDate, dateFormat)
            : (language === 'nepali' ? toDevanagariNumeral(cell.bsDay) : String(cell.bsDay))
          const showAd = view === 'both' || view === 'ad'
          const showBs = view === 'both' || view === 'bs'

          return (
            <div
              key={cell.bsKey}
              className={isTailwind || isBootstrap ? getCellClasses(data) : undefined}
              style={theme === 'default' ? getCellStyle(data) : undefined}
              onClick={() => handleDateSelect(cell)}
              onMouseEnter={() => setHoveredCell(cell.bsKey)}
              onMouseLeave={() => setHoveredCell(null)}
            >
              {showBs && (
                <span
                  className={cls.bsNumber || undefined}
                  style={theme === 'default' ? styles.bsNumber as React.CSSProperties : undefined}
                >
                  {dayNumber}
                </span>
              )}
              {showAd && view === 'ad' && (
                <span
                  className={cls.adNumber || undefined}
                  style={theme === 'default' ? styles.adNumber as React.CSSProperties : undefined}
                >
                  {cell.adDate.getDate()}
                </span>
              )}

              <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
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

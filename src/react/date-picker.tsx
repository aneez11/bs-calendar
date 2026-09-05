import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { toBS, toAD, isValidBS } from '../index'
import { toDevanagariNumeralsIn } from '../nepali'
import { formatBSDate, formatADDate } from '../format-date'
import { BSCalendar } from './calendar'
import type { BSCalendarProps, CalendarEvent, Holiday } from './calendar'

export type DatePickerMode = 'ad' | 'bs' | 'both'
export type DatePickerTheme = 'default' | 'tailwind'

export interface BSDatePickerClassNames {
  wrapper?: string
  inputWrapper?: string
  input?: string
  inputError?: string
  toggleButton?: string
  dropdown?: string
  modeSwitch?: string
  modeButton?: string
  modeButtonActive?: string
  convertedLabel?: string
  calendarWrapper?: string
}

export interface BSDatePickerStyles {
  wrapper?: React.CSSProperties
  inputWrapper?: React.CSSProperties
  input?: React.CSSProperties
  inputError?: React.CSSProperties
  toggleButton?: React.CSSProperties
  dropdown?: React.CSSProperties
  modeSwitch?: React.CSSProperties
  modeButton?: React.CSSProperties
  modeButtonActive?: React.CSSProperties
  convertedLabel?: React.CSSProperties
  calendarWrapper?: React.CSSProperties
}

export interface BSDatePickerProps {
  value?: Date
  /** BS-typed value (Bikram Sambat { year, month, day }) — the BS-first way to control the picker. */
  valueBS?: { year: number; month: number; day: number } | null
  /** Fires with the BS value as primary (plus the equivalent AD date). */
  onChangeBS?: (bs: { year: number; month: number; day: number } | null, adDate: Date | null) => void
  onChange?: (adDate: Date | null, bs: { year: number; month: number; day: number } | null) => void
  mode?: DatePickerMode
  /** Which tab starts active when mode='both' (default 'bs' — BS-first, like Nepali apps). */
  defaultMode?: 'bs' | 'ad'
  language?: 'nepali' | 'english' | 'both'
  theme?: DatePickerTheme
  dateFormat?: string
  placeholder?: string
  disabled?: boolean
  name?: string
  /** Render digits as Devanagari in the input and converted label. */
  digits?: 'latin' | 'devanagari'
  /** Inclusive day-level bounds (enforced — out-of-range days are disabled). */
  minDate?: Date
  maxDate?: Date
  disablePast?: boolean
  disableFuture?: boolean
  disabledDates?: Date[]
  /** Show month/year quick-select dropdowns in the popup header (default true). */
  showMonthYearPicker?: boolean
  classNames?: BSDatePickerClassNames
  styles?: BSDatePickerStyles
  showCalendar?: boolean
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  events?: CalendarEvent[]
  holidays?: Holiday[]
  renderInput?: (props: { value: string; onClick: () => void; onFocus: () => void }) => React.ReactNode
  calendarProps?: Partial<BSCalendarProps>
}

const pickerDefaultStyles: Required<BSDatePickerStyles> = {
  wrapper: { position: 'relative', fontFamily: 'system-ui, sans-serif' },
  inputWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden', background: '#fff' },
  input: { flex: 1, border: 'none', outline: 'none', padding: '8px 12px', fontSize: 14, fontFamily: 'inherit', minWidth: 0 },
  inputError: { borderColor: '#dc2626' },
  toggleButton: { background: 'none', border: 'none', borderLeft: '1px solid #e5e7eb', padding: '6px 10px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropdown: { position: 'absolute', zIndex: 50, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', overflow: 'hidden', marginTop: 4 },
  modeSwitch: { display: 'flex', borderBottom: '1px solid #e5e7eb' },
  modeButton: { flex: 1, padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#6b7280', transition: 'all 0.15s' },
  modeButtonActive: { background: '#eff6ff', color: '#2563eb', fontWeight: 600 },
  convertedLabel: { fontSize: 11, color: '#6b7280', padding: '2px 12px 6px', lineHeight: 1.3 },
  calendarWrapper: {},
}

const pickerTailwindClasses: Required<BSDatePickerClassNames> = {
  wrapper: 'relative font-sans',
  inputWrapper: 'flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all',
  input: 'flex-1 border-none outline-none px-3 py-2 text-sm font-inherit min-w-0 bg-transparent',
  inputError: 'border-red-500 focus-within:ring-red-500 focus-within:border-red-500',
  toggleButton: 'bg-none border-none border-l border-gray-200 p-1.5 cursor-pointer text-sm flex items-center justify-center hover:bg-gray-50 transition-colors',
  dropdown: 'absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden mt-1',
  modeSwitch: 'flex border-b border-gray-200',
  modeButton: 'flex-1 py-1.5 px-2 border-none bg-transparent cursor-pointer text-xs font-medium text-gray-500 transition-all hover:bg-gray-50',
  modeButtonActive: 'bg-blue-50 text-blue-600 font-semibold',
  convertedLabel: 'text-[11px] text-gray-500 px-3 pb-1.5 leading-tight',
  calendarWrapper: '',
}

function parseDateInput(value: string, mode: DatePickerMode): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parts = trimmed.split(/[-\/.]/)
  if (parts.length !== 3) return null
  if (parts.some(p => p === '' || Number.isNaN(Number(p)))) return null
  const nums = parts.map(Number) as [number, number, number]

  // Disambiguate by segment shape rather than trying Y-M-D first for
  // everything: '15/01/2024' must not be eaten as year 15.
  let y: number, m: number, d: number
  if (parts[0]!.length === 4) {
    ;[y, m, d] = nums // YYYY-MM-DD
  } else if (parts[2]!.length === 4) {
    ;[d, m, y] = nums // DD/MM/YYYY (Nepali convention)
  } else {
    return null
  }

  if (mode === 'bs') {
    if (!isValidBS(y, m, d)) return null
    try { return toAD(y, m, d) } catch { return null }
  }

  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const date = new Date(y, m - 1, d)
  return (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) ? date : null
}

export function BSDatePicker({
  value: propValue,
  valueBS,
  onChange,
  onChangeBS,
  mode = 'both',
  defaultMode = 'bs',
  language = 'both',
  theme = 'default',
  dateFormat,
  placeholder = 'Select date...',
  disabled = false,
  name,
  digits = 'latin',
  minDate,
  maxDate,
  disablePast = false,
  disableFuture = false,
  disabledDates,
  showMonthYearPicker = true,
  classNames: customClasses,
  styles: customStyles,
  showCalendar: propShowCalendar = true,
  placement = 'bottom-start',
  events = [],
  holidays = [],
  renderInput,
  calendarProps,
}: BSDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [activeMode, setActiveMode] = useState<DatePickerMode>(mode === 'both' ? defaultMode : mode)
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (propValue) return propValue
    if (valueBS) {
      try { return toAD(valueBS.year, valueBS.month, valueBS.day) } catch { return null }
    }
    return null
  })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Devanagari digit rendering for the input display and converted label.
  const num = useCallback((s: string) => (digits === 'devanagari' ? toDevanagariNumeralsIn(s) : s), [digits])

  // Commit a selection through both callback shapes (BS-primary and AD-primary).
  const commit = useCallback((date: Date | null) => {
    setSelectedDate(date)
    if (!date) {
      onChange?.(null, null)
      onChangeBS?.(null, null)
      return
    }
    try {
      const bs = toBS(date)
      onChange?.(date, bs)
      onChangeBS?.(bs, date)
    } catch {
      onChange?.(date, null)
      onChangeBS?.(null, date)
    }
  }, [onChange, onChangeBS])

  const isTailwind = theme === 'tailwind'

  const cls = useMemo(() => {
    if (isTailwind) return { ...pickerTailwindClasses, ...customClasses }
    return customClasses ?? {} as BSDatePickerClassNames
  }, [theme, customClasses, isTailwind])

  const styles: BSDatePickerStyles = useMemo(() => {
    if (theme === 'default') return { ...pickerDefaultStyles, ...customStyles }
    return customStyles ?? {}
  }, [theme, customStyles])

  const bsDate = useMemo(() => {
    if (!selectedDate) return null
    try { return toBS(selectedDate) } catch { return null }
  }, [selectedDate])

  const displayValue = useMemo(() => {
    if (!selectedDate) return ''
    if (dateFormat) {
      return num(activeMode === 'bs' && bsDate
        ? formatBSDate(selectedDate, dateFormat)
        : formatADDate(selectedDate, dateFormat))
    }
    if (activeMode === 'bs' && bsDate) {
      return num(`${bsDate.year}-${String(bsDate.month).padStart(2, '0')}-${String(bsDate.day).padStart(2, '0')}`)
    }
    return formatADDate(selectedDate, 'YYYY-MM-DD')
  }, [selectedDate, activeMode, bsDate, dateFormat, num])

  const convertedValue = useMemo(() => {
    if (!selectedDate || !bsDate) return ''
    if (activeMode === 'bs') {
      return num(`AD: ${formatADDate(selectedDate, 'YYYY-MM-DD')}`)
    }
    return num(`BS: ${bsDate.year}-${String(bsDate.month).padStart(2, '0')}-${String(bsDate.day).padStart(2, '0')}`)
  }, [selectedDate, bsDate, activeMode, num])

  // Controlled sync: a new value/valueBS prop updates the internal selection
  // (guarded by identity so re-renders with the same date don't loop).
  const valueBSKey = valueBS ? `${valueBS.year}-${valueBS.month}-${valueBS.day}` : ''
  useEffect(() => {
    if (valueBSKey || !propValue) return
    setSelectedDate(prev => (prev && prev.getTime() === propValue.getTime() ? prev : propValue))
  }, [propValue, valueBSKey])
  useEffect(() => {
    if (!valueBSKey || !valueBS) return
    try {
      const ad = toAD(valueBS.year, valueBS.month, valueBS.day)
      setSelectedDate(prev => (prev && prev.getTime() === ad.getTime() ? prev : ad))
    } catch { /* invalid BS value — ignore */ }
  }, [valueBSKey, valueBS])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    const parsed = parseDateInput(val, activeMode)
    if (parsed) commit(parsed)
  }, [activeMode, commit])

  const handleDateSelect = useCallback((adDate: Date, _bs: { year: number; month: number; day: number }) => {
    commit(adDate)
    setOpen(false)
  }, [commit])

  const handleToggle = useCallback(() => {
    if (!disabled) setOpen(o => !o)
  }, [disabled])

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'Enter' && !open) setOpen(true)
  }, [open])

  const switchMode = useCallback((newMode: DatePickerMode) => {
    setActiveMode(newMode)
    setInputValue('')
  }, [])

  const handleToday = useCallback(() => {
    commit(new Date())
    setOpen(false)
  }, [commit])

  const handleClear = useCallback(() => {
    commit(null)
    setInputValue('')
    setOpen(false)
  }, [commit])

  const inputProps = {
    value: inputValue || displayValue,
    onChange: handleInputChange,
    onFocus: () => {},
    onClick: () => {
      if (propShowCalendar) handleToggle()
    },
    onKeyDown: handleKeyDown,
    placeholder: activeMode === 'bs' ? 'YYYY-MM-DD (BS)' : placeholder,
    disabled,
    name,
    ref: inputRef,
  }

  const calendarTheme = theme === 'tailwind' ? 'tailwind' : 'default'

  return (
    <div
      ref={wrapperRef}
      className={cls.wrapper || undefined}
      style={theme === 'default' ? styles.wrapper as React.CSSProperties : undefined}
    >
      {renderInput ? (
        renderInput({ value: inputProps.value, onClick: handleToggle, onFocus: () => {} })
      ) : (
        <div
          className={cls.inputWrapper || undefined}
          style={theme === 'default' ? styles.inputWrapper as React.CSSProperties : undefined}
        >
          <input
            {...inputProps}
            className={cls.input || undefined}
            style={theme === 'default' ? styles.input as React.CSSProperties : undefined}
          />
          {mode !== 'ad' && mode !== 'bs' && bsDate && (
            <span
              className={cls.convertedLabel || undefined}
              style={theme === 'default' ? styles.convertedLabel as React.CSSProperties : undefined}
            >
              {convertedValue}
            </span>
          )}
          <button
            type="button"
            className={cls.toggleButton || undefined}
            style={theme === 'default' ? styles.toggleButton as React.CSSProperties : undefined}
            onClick={handleToggle}
            tabIndex={-1}
          >
            📅
          </button>
        </div>
      )}

      {open && propShowCalendar && (
        <div
          className={cls.dropdown || undefined}
          style={{
            ...(theme === 'default' ? styles.dropdown as React.CSSProperties : {}),
            ...(placement.startsWith('bottom') ? { top: '100%', left: placement === 'bottom-end' ? undefined : 0, right: placement === 'bottom-end' ? 0 : undefined } : { bottom: '100%', left: placement === 'top-end' ? undefined : 0, right: placement === 'top-end' ? 0 : undefined }),
          } as React.CSSProperties}
        >
          {mode === 'both' && (
            <div
              className={cls.modeSwitch || undefined}
              style={theme === 'default' ? styles.modeSwitch as React.CSSProperties : undefined}
            >
              <button
                type="button"
                className={cls.modeButton || undefined}
                style={{
                  ...(theme === 'default' ? styles.modeButton as React.CSSProperties : {}),
                  ...(activeMode === 'ad' ? styles.modeButtonActive as React.CSSProperties : {}),
                } as React.CSSProperties}
                onClick={() => switchMode('ad')}
              >
                AD
              </button>
              <button
                type="button"
                className={cls.modeButton || undefined}
                style={{
                  ...(theme === 'default' ? styles.modeButton as React.CSSProperties : {}),
                  ...(activeMode === 'bs' ? styles.modeButtonActive as React.CSSProperties : {}),
                } as React.CSSProperties}
                onClick={() => switchMode('bs')}
              >
                BS
              </button>
            </div>
          )}

          <div
            className={cls.calendarWrapper || undefined}
            style={theme === 'default' ? styles.calendarWrapper as React.CSSProperties : undefined}
          >
            <BSCalendar
              view={activeMode === 'bs' ? 'bs' : 'ad'}
              language={language}
              theme={calendarTheme}
              {...(selectedDate ? { selectedDate } : {})}
              onDateSelect={handleDateSelect}
              showNavigation
              events={events}
              holidays={holidays}
              {...(minDate ? { minDate } : {})}
              {...(maxDate ? { maxDate } : {})}
              disablePast={disablePast}
              disableFuture={disableFuture}
              {...(disabledDates ? { disabledDates } : {})}
              digits={digits}
              enableMonthPicker={showMonthYearPicker}
              enableYearPicker={showMonthYearPicker}
              {...calendarProps}
            />
          </div>

          <div style={{ borderTop: `1px solid #e5e7eb`, display: 'flex' }}>
            <button
              type="button"
              onClick={handleToday}
              style={{
                flex: 1, padding: '6px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: 12, color: '#2563eb', fontWeight: 500,
              }}
              className={isTailwind ? 'flex-1 py-1.5 px-2 border-none bg-transparent cursor-pointer text-xs text-blue-600 font-medium' : undefined}
            >
              {language === 'nepali' ? 'आज' : 'Today'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              style={{
                flex: 1, padding: '6px', border: 'none', borderLeft: '1px solid #e5e7eb',
                background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#dc2626', fontWeight: 500,
              }}
              className={isTailwind ? 'flex-1 py-1.5 px-2 border-none border-l border-gray-200 bg-transparent cursor-pointer text-xs text-red-600 font-medium' : undefined}
            >
              {language === 'nepali' ? 'मेटाउनुहोस्' : 'Clear'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                flex: 1, padding: '6px', border: 'none', borderLeft: '1px solid #e5e7eb',
                background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#6b7280',
              }}
              className={isTailwind ? 'flex-1 py-1.5 px-2 border-none border-l border-gray-200 bg-transparent cursor-pointer text-xs text-gray-500' : undefined}
            >
              {language === 'nepali' ? 'बन्द' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

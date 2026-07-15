<h1 align="center">bs-calendar</h1>
<p align="center">
  <strong>Zero-dependency Nepali Bikram Sambat (BS) calendar for JavaScript/TypeScript</strong>
  <br>
  <sub>BS ↔ AD conversion · React components · Devanagari support · Calendar grids · Date picker</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/bs-calendar"><img src="https://img.shields.io/bundlephobia/minzip/bs-calendar?color=%233b82f6&label=size&logo=npm" alt="npm bundle size"></a>
  <a href="https://www.npmjs.com/package/bs-calendar"><img src="https://img.shields.io/npm/v/bs-calendar?color=%233b82f6&logo=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/bs-calendar"><img src="https://img.shields.io/npm/dw/bs-calendar?color=%233b82f6&logo=npm" alt="npm downloads"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-%233b82f6" alt="MIT license"></a>
</p>

---

## 📦 Install

```bash
npm install bs-calendar
```

*Zero runtime dependencies. React is optional — only needed for `BSCalendar` / `BSDatePicker` components.*

---

## 🚀 Quick Start

```ts
import { toAD, toBS, toBSString, daysInMonth, todayBS } from 'bs-calendar'

// BS → AD
const ad = toAD(2080, 1, 1)        // Date('2023-04-14') — Nepali New Year

// AD → BS
const bs = toBS(new Date())        // { year: 2080, month: 1, day: 14 }

// Format
toBSString(new Date())             // "2080-01-14"
todayBS()                          // { year, month, day }
daysInMonth(2080, 1)               // 30 — O(1) lookup
```

### Devanagari

```ts
import { toDevanagariNumeral, toFormattedNepaliBS, nepaliMonthName } from 'bs-calendar'

toDevanagariNumeral(2080)           // "२०८०"
nepaliMonthName(1)                  // "वैशाख"
toFormattedNepaliBS(new Date('2023-04-14'))
// → "२०८० वैशाख १"
```

---

## ⚛️ React Components

### BSCalendar — Interactive Calendar

```tsx
import { BSCalendar } from 'bs-calendar/react'

<BSCalendar
  view="both"             // 'bs' | 'ad' | 'both'
  language="both"         // 'nepali' | 'english' | 'both'
  theme="default"         // 'default' | 'tailwind' | 'bootstrap'
  showNavigation
  events={events}
  holidays={holidays}
  showEventList
  showHolidayLabels
  onDateSelect={(ad, bs) => console.log(bs)}
/>
```

### BSDatePicker — Date Input with Auto-Conversion

```tsx
import { BSDatePicker } from 'bs-calendar/date-picker'

<BSDatePicker
  mode="both"             // 'ad' | 'bs' | 'both'
  theme="default"
  onChange={(adDate, bs) => {
    console.log('AD:', adDate)   // Date object
    console.log('BS:', bs)       // { year, month, day }
  }}
/>
```

Typing `"2080-01-01"` auto-converts to AD `2023-04-14` and vice versa.

### Events & Holidays (BS dates supported)

```tsx
import type { CalendarEvent, Holiday } from 'bs-calendar/react'

const events: CalendarEvent[] = [
  { id: '1', title: 'Meeting',       date: '2024-01-15',           color: '#3b82f6' },
  { id: '2', title: 'Nepali New Year', date: '2081-01-01', dateType: 'bs', color: '#22c55e' },
]

const holidays: Holiday[] = [
  { date: '2081-01-01', dateType: 'bs', name: 'New Year', nameNP: 'नयाँ वर्ष' },
]
```

---

## 📅 Calendar Grids

Generate 42-cell (6×7, Sun–Sat) grids for UI rendering.

```ts
import { getMonthGrid, getADMonthGrid } from 'bs-calendar'

// BS grid — each cell has both BS and AD dates
const grid = getMonthGrid(2080, 1)
// { bsDay, adDate, isOtherMonth, isToday, bsKey, ... }

// AD grid
const adGrid = getADMonthGrid(2024, 0)  // January 2024
```

---

## 🎨 Styling

Three themes, full customization per element:

```tsx
// Default — override inline styles
<BSCalendar styles={{
  cell: { background: '#1e293b', borderRadius: 6 },
  cellToday: { background: '#1e3a5f', border: '2px solid #3b82f6' },
  bsNumber: { color: '#f1f5f9' },
}} />

// Tailwind CSS
<BSCalendar theme="tailwind" classNames={{
  cell: 'bg-slate-800 hover:bg-slate-700 rounded-lg',
  cellToday: 'bg-blue-900 ring-2 ring-blue-500',
}} />

// Bootstrap
<BSCalendar theme="bootstrap" classNames={{
  cellToday: 'bg-info bg-opacity-25 fw-bold border-info',
}} />
```

Styleable keys: `container`, `header`, `navButton`, `cell`, `cellToday`, `cellSelected`, `cellOtherMonth`, `cellWithEvents`, `cellWithHoliday`, `bsNumber`, `adNumber`, `eventDot`, `eventBar`, `eventList`, `holidayLabel`, `moreLink`, `eventPopup`, and more.

---

## 📐 Date Formatting

Flexible format strings for both BS and AD dates:

```ts
import { formatBSDate, formatADDate } from 'bs-calendar'

formatBSDate(new Date(), 'YYYY-MM-DD')        // "2080-01-15"
formatBSDate(new Date(), 'DD MMMM YYYY')      // "15 Baisakh 2080"
formatBSDate(new Date(), 'YYYY MMMM-NP DD')   // "2080 वैशाख 01"
formatADDate(new Date(), 'DD/MM/YYYY')        // "15/01/2024"
```

| Token | Output | Example |
|-------|--------|---------|
| `YYYY` | 4-digit year | 2080 |
| `YYYY-NP` | Devanagari year | २०८० |
| `MM` / `DD` | 2-digit month/day | 01 / 15 |
| `M` / `D` | No padding | 1 / 15 |
| `DD-NP` / `D-NP` | Devanagari day | १५ |
| `MMMM` | Full month name | Baisakh |
| `MMMM-NP` | Nepali month | वैशाख |

---

## 📖 Full API

| Function | Returns | Description |
|----------|---------|-------------|
| `toAD(bsYear, bsMonth, bsDay)` | `Date` | BS → AD conversion |
| `toBS(date)` | `{ year, month, day }` | AD → BS conversion |
| `daysInMonth(bsYear, bsMonth)` | `number` | Days in BS month (O(1)) |
| `daysInYear(bsYear)` | `number` | 365 or 366 (O(1)) |
| `isValidBS(year, month, day)` | `boolean` | Validate BS date |
| `supportedRange()` | `{ minYear, maxYear }` | BS 2000–2090 |
| `todayBS()` | `{ year, month, day }` | Today in BS |
| `toBSString(date)` | `string` | "2080-01-01" |
| `toFormattedBS(date)` | `string` | "2080 Baisakh 01" |
| `monthName(bsMonth)` | `string` | "Baisakh" – "Chaitra" |
| `getMonthGrid(bsYear, bsMonth)` | `CalendarCell[]` | 42-cell BS grid |
| `getADMonthGrid(year, month)` | `ADCalendarCell[]` | 42-cell AD grid |
| `toDevanagariNumeral(n)` | `string` | 2080 → २०८० |
| `nepaliMonthName(bsMonth)` | `string` | वैशाख–चैत्र |
| `nepaliDayName(date)` | `string` | आइतबार–शनिबार |
| `toNepaliBSString(date)` | `string` | २०८०-०१-०१ |
| `toFormattedNepaliBS(date)` | `string` | २०८० वैशाख १ |
| `formatBSDate(date, format)` | `string` | Custom format |
| `formatADDate(date, format)` | `string` | Custom format |

### Error Classes

- `BSRangeError` — year outside supported range
- `BSInvalidDateError` — invalid day/month

---

## 📦 Bundle

| Metric | Value |
|--------|-------|
| Gzipped size | **2.8 KB** |
| Runtime deps | **0** |
| Supported BS range | **2000–2090** (91 years) |
| Total days covered | **32,878** |

---

## 📄 License

MIT — built for the Nepali developer community.

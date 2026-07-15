# bs-calendar

Zero-dependency Nepali Bikram Sambat (BS) calendar conversion for JavaScript/TypeScript.

## Features

- BS ↔ AD conversion with O(1)/O(log n) arithmetic
- No runtime dependencies
- Full TypeScript support with generated `.d.ts` files
- Pure functions — no hidden state
- Calendar grid generation for UI rendering

## Installation

```bash
npm install bs-calendar
```

## Usage

```ts
import { toAD, toBS, isValidBS, daysInMonth, getMonthGrid } from 'bs-calendar'

// BS → AD
const adDate = toAD(2080, 1, 1)        // Date(2023, 3, 14) — Nepali New Year

// AD → BS
const bs = toBS(new Date())            // { year: 2080, month: 1, day: 1 }

// Validation
isValidBS(2080, 13, 1)                 // false

// Days in month
daysInMonth(2080, 1)                   // 30

// Calendar grid for rendering
const grid = getMonthGrid(2080, 1)     // 42 cells, 6 rows × 7 columns
```

## Supported Range

BS 2000–2090 (AD ~1943–2033). See `src/data/SOURCES.md` for data provenance.

## API

See the [spec](./bs-calendar-agent-spec.md) for the full API reference.

## License

MIT

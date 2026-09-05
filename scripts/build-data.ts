import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const raw = JSON.parse(readFileSync(join(root, 'src', 'data', 'bs-data.raw.json'), 'utf-8'))

const { minYear, maxYear, referenceBS, referenceAD, years } = raw as {
  minYear: number
  maxYear: number
  referenceBS: { year: number; month: number; day: number }
  referenceAD: string
  years: Record<string, number[]>
}

// Verify every year sums to 365 or 366
for (const [yearStr, months] of Object.entries(years)) {
  const total = months.reduce((s: number, d: number) => s + d, 0)
  if (total !== 365 && total !== 366) {
    throw new Error(`Year ${yearStr} has total days ${total}, expected 365 or 366`)
  }
  if (months.length !== 12) {
    throw new Error(`Year ${yearStr} has ${months.length} months, expected 12`)
  }
}

// Verify no years missing in range
for (let y = minYear; y <= maxYear; y++) {
  if (!years[String(y)]) {
    throw new Error(`Missing year ${y} in data`)
  }
}

// Compute per-year totals
const yearTotals: Record<string, number> = {}
for (const [yearStr, months] of Object.entries(years)) {
  yearTotals[yearStr] = months.reduce((s: number, d: number) => s + d, 0)
}

// Compute cumulative offsets: cumulativeOffsets[i] = total days from minYear-01-01 to (minYear+i)-01-01.
// The final entry is the grand total (end boundary of maxYear) — without it the
// last year would be unreachable in epochDayToBs.
const cumulativeOffsets: number[] = [0]
{
  let running = 0
  for (let y = minYear; y <= maxYear; y++) {
    running += yearTotals[String(y)] ?? 0
    cumulativeOffsets.push(running)
  }
}

// Compact month table: each month length 29–32 becomes a letter a–d.
// 91 years × 12 chars = 1092 chars (~0.9 KB gzipped vs ~3.5 KB as JSON),
// decoded into the monthLengths record at module load.
const packed = (() => {
  let out = ''
  for (let y = minYear; y <= maxYear; y++) {
    for (const d of years[String(y)]!) {
      if (d < 29 || d > 32) throw new Error(`Cannot pack month length ${d} for ${y}`)
      out += String.fromCharCode(97 + (d - 29)) // a=29, b=30, c=31, d=32
    }
  }
  return out
})()

const generated = `// GENERATED FILE — do not edit. Run \`npm run build:data\` to regenerate.

export const minYear = ${minYear} as const
export const maxYear = ${maxYear} as const

export const referenceBS = ${JSON.stringify(referenceBS)} as const
export const referenceAD = '${referenceAD}' as const

// Month lengths packed: char 'a'+(days-29) per month, 12 chars per year from ${minYear}.
const PACKED = '${packed}'

function decodeMonthLengths(): Record<string, number[]> {
  const years: Record<string, number[]> = {}
  for (let y = minYear; y <= maxYear; y++) {
    const row: number[] = []
    for (let m = 0; m < 12; m++) {
      row.push(29 + (PACKED.charCodeAt((y - minYear) * 12 + m) - 97))
    }
    years[String(y)] = row
  }
  return years
}

export const monthLengths: Record<string, readonly number[]> = decodeMonthLengths()

export const yearTotals: Record<string, number> = (() => {
  const totals: Record<string, number> = {}
  for (let y = minYear; y <= maxYear; y++) {
    totals[String(y)] = monthLengths[String(y)]!.reduce((s, d) => s + d, 0)
  }
  return totals
})()

export const cumulativeOffsets: readonly number[] = ${JSON.stringify(cumulativeOffsets)} as const
`

writeFileSync(join(root, 'src', 'data', 'bs-data.generated.ts'), generated, 'utf-8')

console.log(`Generated data for BS ${minYear}–${maxYear} (${maxYear - minYear + 1} years, ${cumulativeOffsets[cumulativeOffsets.length - 1]} total days, table packed in ${packed.length} chars)`)

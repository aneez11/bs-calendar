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

// Compute cumulative offsets: cumulativeOffsets[i] = total days from minYear-01-01 to (minYear+i)-01-01
const cumulativeOffsets: number[] = [0]
for (let y = minYear; y < maxYear; y++) {
  cumulativeOffsets.push(cumulativeOffsets[cumulativeOffsets.length - 1] + (yearTotals[String(y)] ?? 0))
}

const generated = `// GENERATED FILE — do not edit. Run \`npm run build:data\` to regenerate.

export const minYear = ${minYear} as const
export const maxYear = ${maxYear} as const

export const referenceBS = ${JSON.stringify(referenceBS)} as const
export const referenceAD = '${referenceAD}' as const

export const monthLengths: Record<string, readonly number[]> = ${JSON.stringify(years)} as const

export const yearTotals: Record<string, number> = ${JSON.stringify(yearTotals)} as const

export const cumulativeOffsets: readonly number[] = ${JSON.stringify(cumulativeOffsets)} as const
`

writeFileSync(join(root, 'src', 'data', 'bs-data.generated.ts'), generated, 'utf-8')

console.log(`Generated data for BS ${minYear}–${maxYear} (${maxYear - minYear + 1} years, ${cumulativeOffsets[cumulativeOffsets.length - 1]} total days)`)

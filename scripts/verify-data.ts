/**
 * verify-data.ts
 *
 * Cross-checks bs-data.raw.json against reference fixtures collected from
 * external sources (Hamro Patro RSC payloads; see SOURCES.md for provenance
 * and the documented BS 2087 override).
 *
 * Usage: npx tsx scripts/verify-data.ts
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

interface RawData {
  minYear: number
  maxYear: number
  referenceBS: { year: number; month: number; day: number }
  referenceAD: string
  years: Record<string, number[]>
}

interface HamroFixture {
  source: string
  anchor: { bs: string; ad: string }
  knownOverrides: Array<{
    year: number
    reason: string
    hamroServed: number[]
    adopted: number[]
  }>
  months: Record<string, { dim: number; firstAD: string; lastAD: string }>
}

const MS_DAY = 86400000
const BS_EPOCH_AD = '1943-04-14' // BS 2000/01/01

let failures = 0

function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ✓ ${label}`)
  } else {
    failures++
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

function adDaysOf(iso: string): number {
  return Math.round(Date.parse(iso + 'T00:00:00.000Z') / MS_DAY)
}

function isoOf(adDays: number): string {
  return new Date(adDays * MS_DAY).toISOString().slice(0, 10)
}

// Load our data
const raw = JSON.parse(readFileSync(join(root, 'src', 'data', 'bs-data.raw.json'), 'utf-8')) as RawData
const { years, minYear, maxYear } = raw

function daysBeforeYear(y: number): number {
  let days = 0
  for (let prev = minYear; prev < y; prev++) days += years[String(prev)]!.reduce((s: number, m: number) => s + m, 0)
  return days
}

function daysBeforeMonth(y: number, m: number): number {
  let days = daysBeforeYear(y)
  const months = years[String(y)]!
  for (let i = 1; i < m; i++) days += months[i - 1]!
  return days
}

const bsEpochDays = adDaysOf(BS_EPOCH_AD)

console.log(`\nBS Calendar Data Verification Report`)
console.log(`================================`)
console.log(`Range: BS ${minYear}–${maxYear} (${maxYear - minYear + 1} years)`)

// === 1. Self-consistency ===
console.log(`\n1. Self-consistency checks:`)
for (const [yearStr, months] of Object.entries(years)) {
  const total = months.reduce((s: number, m: number) => s + m, 0)
  check(`BS ${yearStr} total days ∈ {365, 366} (got ${total})`, total === 365 || total === 366)
  check(`BS ${yearStr} has 12 months`, months.length === 12)
  const bad = months.filter(d => d < 29 || d > 32)
  check(`BS ${yearStr} month lengths within 29–32`, bad.length === 0, bad.length ? `offenders: ${bad.join(',')}` : undefined)
}

// === 2. Hamro Patro fixture ===
const fixturePath = join(root, 'scripts', 'reference', 'hamro-patro-months.json')
if (existsSync(fixturePath)) {
  console.log(`\n2. Hamro Patro reference fixture (scripts/reference/hamro-patro-months.json):`)
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf-8')) as HamroFixture

  // Documented overrides: expected dim deviates from Hamro's served data
  const overrides = new Map<string, number>()
  for (const ov of fixture.knownOverrides) {
    ov.adopted.forEach((dim, i) => overrides.set(`${ov.year}-${i + 1}`, dim))
  }
  // Years after an override year shift by the removed/added day count
  const yearShift = new Map<number, number>()
  {
    let running = 0
    for (let y = minYear; y <= maxYear; y++) {
      yearShift.set(y, running)
      const ov = fixture.knownOverrides.find(o => o.year === y)
      if (ov) running += ov.adopted.reduce((s, d) => s + d, 0) - ov.hamroServed.reduce((s, d) => s + d, 0)
    }
  }

  // Month lengths
  let dimMismatches = 0
  for (let y = minYear; y <= maxYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const ref = fixture.months[`${y}-${m}`]
      if (!ref) {
        failures++
        console.log(`  ✗ fixture missing ${y}-${m}`)
        continue
      }
      const expectedDim = overrides.get(`${y}-${m}`) ?? ref.dim
      const ours = years[String(y)]![m - 1]!
      if (ours !== expectedDim) {
        dimMismatches++
        console.log(`  ✗ dim ${y}-${m}: ours ${ours}, expected ${expectedDim} (hamro served ${ref.dim})`)
      }
    }
  }
  check(`month lengths match Hamro Patro (+ ${fixture.knownOverrides.length} documented override)`, dimMismatches === 0, dimMismatches ? `${dimMismatches} mismatches` : undefined)

  // Every month start matches hamro firstAD (with shift for override years)
  let monthStartMismatches = 0
  for (let y = minYear; y <= maxYear; y++) {
    const shift = yearShift.get(y) ?? 0
    for (let m = 1; m <= 12; m++) {
      if (overrides.has(`${y}-${m}`)) continue // override month start shifts within the year
      const mref = fixture.months[`${y}-${m}`]
      if (!mref) continue
      const expected = isoOf(adDaysOf(mref.firstAD) + shift)
      const ourFirst = isoOf(bsEpochDays + daysBeforeMonth(y, m))
      if (ourFirst !== expected) {
        monthStartMismatches++
        if (monthStartMismatches <= 5) console.log(`  ✗ firstAD ${y}-${m}: ours ${ourFirst}, expected ${expected}`)
      }
    }
  }
  check(`every month start matches Hamro Patro firstAD (shift-adjusted)`, monthStartMismatches === 0, monthStartMismatches ? `${monthStartMismatches} mismatches` : undefined)

  // Every month end matches hamro lastAD
  let monthEndMismatches = 0
  for (let y = minYear; y <= maxYear; y++) {
    const shift = yearShift.get(y) ?? 0
    for (let m = 1; m <= 12; m++) {
      const dim = years[String(y)]![m - 1]!
      if (overrides.has(`${y}-${m}`)) continue
      const mref = fixture.months[`${y}-${m}`]
      if (!mref) continue
      const expected = isoOf(adDaysOf(mref.lastAD) + shift)
      const ourLast = isoOf(bsEpochDays + daysBeforeMonth(y, m) + dim - 1)
      if (ourLast !== expected) {
        monthEndMismatches++
        if (monthEndMismatches <= 5) console.log(`  ✗ lastAD ${y}-${m}: ours ${ourLast}, expected ${expected}`)
      }
    }
  }
  check(`every month end matches Hamro Patro lastAD (shift-adjusted)`, monthEndMismatches === 0, monthEndMismatches ? `${monthEndMismatches} mismatches` : undefined)
} else {
  console.log(`\n2. Hamro Patro fixture not found — skipped (place scripts/reference/hamro-patro-months.json first)`)
}

// === 3. Anchor check ===
console.log(`\n3. Reference anchor:`)
{
  const { referenceBS, referenceAD } = raw
  const daysToAnchor = daysBeforeYear(referenceBS.year)
    + years[String(referenceBS.year)]!.slice(0, referenceBS.month - 1).reduce((s, m) => s + m, 0)
    + referenceBS.day - 1
  check(
    `BS ${referenceBS.year}/${referenceBS.month}/${referenceBS.day} = ${referenceAD} ⇒ BS ${minYear}/01/01 = ${BS_EPOCH_AD}`,
    adDaysOf(referenceAD) - daysToAnchor === bsEpochDays,
    `expected ${bsEpochDays}, got ${adDaysOf(referenceAD) - daysToAnchor}`,
  )
}

console.log(`\n================================`)
if (failures === 0) {
  console.log('All checks passed!')
} else {
  console.log(`FAILED: ${failures} check(s) failed`)
  process.exit(1)
}

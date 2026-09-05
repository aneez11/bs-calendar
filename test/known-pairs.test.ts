import { describe, it, expect } from 'vitest'
import { toBS, toAD } from '../src/core/convert'
import { daysInMonth, daysInYear } from '../src/index'
import hamroRef from '../scripts/reference/hamro-patro-months.json'

/*
 * External verification against Hamro Patro (hamropatro.com).
 *
 * Every pair below is derived from Hamro Patro's own calendar data
 * (scripts/reference/hamro-patro-months.json — see SOURCES.md for the
 * fetch methodology and the single documented override for BS 2087).
 * BS 2087 months >= Mangsir (9) are covered by the documented override:
 * Hamro currently serves an impossible 367-day year there, so those
 * anchors shift by -1 day versus the fixture.
 */

const MIN_YEAR = 2000
const MAX_YEAR = 2090
const OVERRIDE_YEAR = 2087
const OVERRIDE_FROM_MONTH = 9 // Poush onward shifted by the 2087 correction

interface MonthRef { dim: number; firstAD: string; lastAD: string }
const monthRef = hamroRef.months as unknown as Record<string, MonthRef>

function expectAD(ad: Date, iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  expect(ad.getUTCFullYear()).toBe(y)
  expect(ad.getUTCMonth()).toBe(m - 1)
  expect(ad.getUTCDate()).toBe(d)
}

function shifted(iso: string, days: number): string {
  const dt = new Date(Date.parse(iso + 'T00:00:00.000Z') + days * 86400000)
  return dt.toISOString().slice(0, 10)
}

describe('BS ↔ AD against Hamro Patro (external reference)', () => {
  it('new year of every BS year 2000–2090 matches Hamro Patro', () => {
    let checked = 0
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      const ref = monthRef[`${y}-1`]
      expect(ref, `fixture missing ${y}-1`).toBeTruthy()
      const expected = y >= OVERRIDE_YEAR + 1 ? shifted(ref.firstAD, -1) : ref.firstAD
      expectAD(toAD(y, 1, 1), expected)
      checked++
    }
    expect(checked).toBe(91)
  })

  it('first day of every month 2000–2090 matches Hamro Patro', () => {
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      for (let m = 1; m <= 12; m++) {
        if (y === OVERRIDE_YEAR && m >= OVERRIDE_FROM_MONTH) continue
        const ref = monthRef[`${y}-${m}`]
        expect(ref, `fixture missing ${y}-${m}`).toBeTruthy()
        const expected = y >= OVERRIDE_YEAR + 1 ? shifted(ref.firstAD, -1) : ref.firstAD
        expectAD(toAD(y, m, 1), expected)
      }
    }
  })

  it('last day of every month matches Hamro Patro', () => {
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      for (let m = 1; m <= 12; m++) {
        if (y === OVERRIDE_YEAR && m >= OVERRIDE_FROM_MONTH) continue
        const ref = monthRef[`${y}-${m}`]
        expect(ref, `fixture missing ${y}-${m}`).toBeTruthy()
        const dim = daysInMonth(y, m)
        const expected = y >= OVERRIDE_YEAR + 1 ? shifted(ref.lastAD, -1) : ref.lastAD
        expectAD(toAD(y, m, dim), expected)
      }
    }
  })

  it('inverse: Hamro Patro AD dates convert back to the same BS date', () => {
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      for (let m = 1; m <= 12; m++) {
        if (y === OVERRIDE_YEAR && m >= OVERRIDE_FROM_MONTH) continue
        const ref = monthRef[`${y}-${m}`]
        const expected = y >= OVERRIDE_YEAR + 1 ? shifted(ref.firstAD, -1) : ref.firstAD
        // Parse as UTC-midnight: exact UTC-midnight instants carry UTC civil semantics
        const bs = toBS(new Date(`${expected}T00:00:00.000Z`))
        expect(bs).toEqual({ year: y, month: m, day: 1 })
      }
    }
  })

  it('daysInMonth matches Hamro Patro month lengths (with documented override)', () => {
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      for (let m = 1; m <= 12; m++) {
        const ref = monthRef[`${y}-${m}`]
        if (y === 2087 && m === 9) {
          // Poush 2087 corrected from 30 -> 29 (impossible 367-day year)
          expect(daysInMonth(y, m)).toBe(29)
          continue
        }
        expect(daysInMonth(y, m)).toBe(ref.dim)
      }
    }
  })

  it('consecutive BS years chain without gaps (Hamro anchor chain)', () => {
    let running = Date.parse('1943-04-14T00:00:00.000Z')
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      expectAD(toAD(y, 1, 1), new Date(running).toISOString().slice(0, 10))
      running += daysInYear(y) * 86400000
    }
  })

  it('known spot pairs (independently documented)', () => {
    // Reference anchor (Hamro Patro, nepalipatro, and all major sources agree)
    expectAD(toAD(2080, 1, 1), '2023-04-14')
    // New Years flagged in the original test file, now Hamro-verified
    expectAD(toAD(2075, 1, 1), '2018-04-14')
    expectAD(toAD(2076, 1, 1), '2019-04-14')
    expectAD(toAD(2077, 1, 1), '2020-04-13')
    expectAD(toAD(2078, 1, 1), '2021-04-14')
    expectAD(toAD(2079, 1, 1), '2022-04-14')
    expectAD(toAD(2081, 1, 1), '2024-04-13')
    expectAD(toAD(2082, 1, 1), '2025-04-14')
    // Last day of BS 2080 (Chaitra 30) — Hamro Patro lastAD
    expectAD(toAD(2080, 12, 30), '2024-04-12')
  })
})

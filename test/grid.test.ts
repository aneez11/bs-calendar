import { describe, it, expect } from 'vitest'
import { getMonthGrid, getADMonthGrid } from '../src/grid'
import { toBS } from '../src/core/convert'

describe('getMonthGrid', () => {
  it('returns exactly 42 cells', () => {
    const grid = getMonthGrid(2080, 1)
    expect(grid.length).toBe(42)
  })

  it('has correct number of cells for any month', () => {
    for (const month of [1, 6, 12]) {
      const grid = getMonthGrid(2080, month)
      expect(grid.length).toBe(42)
    }
  })

  it('first cell is isOtherMonth when month does not start on Sunday', () => {
    const grid = getMonthGrid(2080, 1)
    if (grid[0]!.bsDay > 1) {
      expect(grid[0]!.isOtherMonth).toBe(true)
    }
  })

  it('current month cells have isOtherMonth = false', () => {
    const grid = getMonthGrid(2080, 1)
    const currentMonthCells = grid.filter(c => c.bsMonth === 1 && c.bsYear === 2080)
    for (const cell of currentMonthCells) {
      expect(cell.isOtherMonth).toBe(false)
    }
  })

  it('previous month cells have isOtherMonth = true', () => {
    const grid = getMonthGrid(2080, 1)
    const prevMonthCells = grid.filter(c => c.bsMonth === 12 && c.bsYear === 2079)
    for (const cell of prevMonthCells) {
      expect(cell.isOtherMonth).toBe(true)
    }
  })

  it('all cells have valid bsKey format', () => {
    const grid = getMonthGrid(2080, 1)
    for (const cell of grid) {
      expect(cell.bsKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('all cells have a Date adDate', () => {
    const grid = getMonthGrid(2080, 1)
    for (const cell of grid) {
      expect(cell.adDate).toBeInstanceOf(Date)
      expect(Number.isNaN(cell.adDate.getTime())).toBe(false)
    }
  })

  it('adjacent months from previous year work (non-boundary)', () => {
    const grid = getMonthGrid(2080, 1)
    expect(grid.length).toBe(42)
    const prevMonthCells = grid.filter(c => c.bsMonth === 12 && c.bsYear === 2079)
    expect(prevMonthCells.length).toBeGreaterThan(0)
  })

  it('adjacent months to next year work (non-boundary)', () => {
    const grid = getMonthGrid(2080, 12)
    expect(grid.length).toBe(42)
    const nextMonthCells = grid.filter(c => c.bsMonth === 1 && c.bsYear === 2081)
    expect(nextMonthCells.length).toBeGreaterThan(0)
  })

  it('cells are consecutive days starting from the first Sunday on/before the 1st', () => {
    const grid = getMonthGrid(2080, 1)
    expect(grid[0]!.adDate.getUTCDay()).toBe(0) // Sunday-first
    for (let i = 1; i < grid.length; i++) {
      expect(grid[i]!.adDate.getTime()).toBe(grid[i - 1]!.adDate.getTime() + 86400000)
    }
  })

  it('cell bsDates are consistent with their adDates', () => {
    const grid = getMonthGrid(2080, 1)
    for (const cell of grid) {
      if (cell.isOutOfRange) continue // extrapolated placeholder cells
      const bs = toBS(cell.adDate)
      expect(bs).toEqual({ year: cell.bsYear, month: cell.bsMonth, day: cell.bsDay })
    }
  })

  it('works at the earliest range boundary (BS 2000/01)', () => {
    const grid = getMonthGrid(2000, 1)
    expect(grid.length).toBe(42)
    // Lead cells fall in BS 1999 (no data) — exact AD dates, flagged cells
    for (const cell of grid) {
      expect(Number.isNaN(cell.adDate.getTime())).toBe(false)
    }
    // The cell right before BS 2000/01/01 is labeled Chaitra 30, 1999 (exact)
    const leadCells = grid.filter(c => c.isOutOfRange)
    if (leadCells.length > 0) {
      const last = leadCells[leadCells.length - 1]!
      expect(last.bsYear).toBe(1999)
      expect(last.bsMonth).toBe(12)
      expect(last.bsDay).toBe(30)
      expect(last.adDate.toISOString().slice(0, 10)).toBe('1943-04-13')
    }
    expect(() => getMonthGrid(1999, 12)).toThrow()
  })

  it('works at the latest range boundary (BS 2090/12)', () => {
    const grid = getMonthGrid(2090, 12)
    expect(grid.length).toBe(42)
    for (const cell of grid) {
      expect(Number.isNaN(cell.adDate.getTime())).toBe(false)
    }
    // First trailing cell is exactly BS 2091/01/01 (day after the last day)
    const trail = grid.filter(c => c.isOutOfRange)
    if (trail.length > 0) {
      expect(trail[0]!.bsYear).toBe(2091)
      expect(trail[0]!.bsMonth).toBe(1)
      expect(trail[0]!.bsDay).toBe(1)
    }
    expect(() => getMonthGrid(2091, 1)).toThrow()
  })
})

describe('getADMonthGrid', () => {
  it('returns exactly 42 cells', () => {
    const grid = getADMonthGrid(2024, 0)
    expect(grid.length).toBe(42)
  })

  it('has correct number of cells for any month', () => {
    for (const month of [0, 5, 11]) {
      const grid = getADMonthGrid(2024, month)
      expect(grid.length).toBe(42)
    }
  })

  it('current month cells have isOtherMonth = false', () => {
    const grid = getADMonthGrid(2024, 0)
    const currentCells = grid.filter(c => c.month === 0 && c.year === 2024)
    for (const cell of currentCells) {
      expect(cell.isOtherMonth).toBe(false)
    }
  })

  it('all cells have a valid date', () => {
    const grid = getADMonthGrid(2024, 0)
    for (const cell of grid) {
      expect(cell.date).toBeInstanceOf(Date)
      expect(Number.isNaN(cell.date.getTime())).toBe(false)
    }
  })
})

import { describe, it, expect } from 'vitest'
import { getMonthGrid, getADMonthGrid } from '../src/grid'

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

// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { BSCalendar } from '../src/react/calendar'
import { BSDatePicker } from '../src/react/date-picker'

afterEach(cleanup)

/** Accessible name used by calendar day cells. */
function adLabel(bsKey: string, ad: string): string {
  return `BS ${bsKey} (AD ${ad})`
}

describe('BSCalendar', () => {
  it('renders a 42-cell day grid', () => {
    render(<BSCalendar initialBSYear={2080} initialBSMonth={1} />)
    const cells = screen.getAllByRole('button').filter(el => el.getAttribute('aria-label')?.startsWith('BS '))
    expect(cells).toHaveLength(42)
  })

  it('disables AD dates listed in disabledDates (regression: BS/AD key mismatch)', () => {
    render(
      <BSCalendar
        initialBSYear={2080}
        initialBSMonth={1}
        disabledDates={[new Date('2023-04-14T00:00:00.000Z')]}
      />,
    )
    expect(screen.getByLabelText(adLabel('2080-01-01', '2023-04-14')).getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByLabelText(adLabel('2080-01-02', '2023-04-15')).getAttribute('aria-disabled')).toBeNull()
  })

  it('does not select a disabled date but does select an enabled one', () => {
    const onDateSelect = vi.fn()
    render(
      <BSCalendar
        initialBSYear={2080}
        initialBSMonth={1}
        disabledDates={[new Date('2023-04-14T00:00:00.000Z')]}
        onDateSelect={onDateSelect}
      />,
    )
    fireEvent.click(screen.getByLabelText(adLabel('2080-01-01', '2023-04-14')))
    expect(onDateSelect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByLabelText(adLabel('2080-01-02', '2023-04-15')))
    expect(onDateSelect).toHaveBeenCalledTimes(1)
  })

  it('supports keyboard selection (Enter)', () => {
    const onDateSelect = vi.fn()
    render(<BSCalendar initialBSYear={2080} initialBSMonth={1} onDateSelect={onDateSelect} />)
    fireEvent.keyDown(screen.getByLabelText(adLabel('2080-01-02', '2023-04-15')), { key: 'Enter' })
    expect(onDateSelect).toHaveBeenCalledTimes(1)
  })

  it('clamps out-of-data-range minBSYear instead of crashing', () => {
    expect(() => render(<BSCalendar initialBSYear={1900} initialBSMonth={1} minBSYear={1900} />)).not.toThrow()
  })

  it('clamps an invalid initialBSMonth instead of crashing', () => {
    expect(() => render(<BSCalendar initialBSYear={2080} initialBSMonth={13} />)).not.toThrow()
  })

  it('does not crash for maxBSYear above the data range', () => {
    const onDateSelect = vi.fn()
    render(<BSCalendar initialBSYear={2090} initialBSMonth={12} maxBSYear={3000} onDateSelect={onDateSelect} />)
    expect(screen.getAllByRole('button').filter(el => el.getAttribute('aria-label')?.startsWith('BS '))).toHaveLength(42)
  })
})

describe('BSDatePicker', () => {
  it('lets the user clear the input text', () => {
    render(<BSDatePicker value={new Date('2023-04-14T00:00:00.000Z')} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).not.toBe('')
    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
  })

  it('shows typed text and clears it via the Clear action', () => {
    render(<BSDatePicker mode="ad" />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2024-01-15' } })
    expect(input.value).toBe('2024-01-15')
    fireEvent.click(input) // open the dropdown
    fireEvent.click(screen.getByText('Clear'))
    expect(input.value).toBe('')
  })

  it('rejects a typed date outside minDate/maxDate', () => {
    const onChange = vi.fn()
    render(
      <BSDatePicker mode="ad" minDate={new Date(2024, 0, 1)} maxDate={new Date(2024, 0, 31)} onChange={onChange} />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2024-05-01' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('accepts a typed date within bounds', () => {
    const onChange = vi.fn()
    render(
      <BSDatePicker mode="ad" minDate={new Date(2024, 0, 1)} maxDate={new Date(2024, 0, 31)} onChange={onChange} />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2024-01-15' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})

import { createRoot, type Root } from 'react-dom/client'
import { BSDatePicker } from './react/date-picker'
import type { BSDatePickerProps } from './react/date-picker'

const roots = new WeakMap<Element, Root>()

export function mount(el: Element, options: BSDatePickerProps = {}): void {
  const root = createRoot(el)
  roots.set(el, root)
  root.render(<BSDatePicker {...options} />)
}

export function destroy(el: Element): void {
  roots.get(el)?.unmount()
  roots.delete(el)
}

// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { act } from '@testing-library/react'
import { mount, destroy } from '../src/global'

describe('global mount', () => {
  it('mounts and destroys the picker in a DOM element', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    act(() => mount(el, { mode: 'bs' }))
    expect(el.querySelector('input')).not.toBeNull()

    act(() => destroy(el))
    expect(el.querySelector('input')).toBeNull()

    el.remove()
  })
})

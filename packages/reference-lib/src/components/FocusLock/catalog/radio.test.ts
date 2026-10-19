// @vitest-environment happy-dom
/**
 * Named-radio proof: collapsing radio groups against collected state.
 * Runs in happy-dom against real inputs; the catalog consumes it.
 */
import { describe, expect, it } from 'vitest'
import { collectRadioState, includeRadio } from './radio'

function radio(name: string, checked = false): HTMLInputElement {
  const el = document.createElement('input')
  el.type = 'radio'
  el.name = name
  el.checked = checked
  return el
}

describe('radio collapsing', () => {
  it('keeps only the checked member of a named group', () => {
    const a = radio('g')
    const b = radio('g', true)
    const state = collectRadioState([a, b])
    expect(includeRadio(a, state)).toBe(false)
    expect(includeRadio(b, state)).toBe(true)
  })

  it('keeps every member while no one is checked', () => {
    const a = radio('g')
    const b = radio('g')
    const state = collectRadioState([a, b])
    expect(includeRadio(a, state)).toBe(true)
    expect(includeRadio(b, state)).toBe(true)
  })

  it('leaves unnamed radios and other elements alone', () => {
    const unnamed = radio('')
    const button = document.createElement('button')
    const state = collectRadioState([unnamed, button])
    expect(includeRadio(unnamed, state)).toBe(true)
    expect(includeRadio(button, state)).toBe(true)
  })
})

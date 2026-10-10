import { describe, expect, it } from 'vitest'
import { isInteractiveDescendant } from './interactive'

function el(tagName: string, contentEditable = false) {
  return { tagName, isContentEditable: contentEditable } as unknown as EventTarget
}

describe('isInteractiveDescendant', () => {
  it('ignores null targets and the current target itself', () => {
    const current = el('DIV')
    expect(isInteractiveDescendant(null, current)).toBe(false)
    expect(isInteractiveDescendant(current, current)).toBe(false)
  })

  it('flags form controls and editable content', () => {
    const current = el('DIV')
    for (const tag of ['input', 'textarea', 'select', 'button', 'BUTTON']) {
      expect(isInteractiveDescendant(el(tag), current)).toBe(true)
    }
    expect(isInteractiveDescendant(el('DIV', true), current)).toBe(true)
  })

  it('passes plain option content through', () => {
    const current = el('DIV')
    expect(isInteractiveDescendant(el('DIV'), current)).toBe(false)
    expect(isInteractiveDescendant(el('SPAN'), current)).toBe(false)
  })
})

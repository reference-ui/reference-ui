// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { resolveReference } from './reference'

function rectAnchor(x: number, y: number, width = 10, height = 10) {
  return {
    getBoundingClientRect: () => new DOMRect(x, y, width, height),
  }
}

describe('resolveReference', () => {
  it('returns null when edge is set, even with a trigger', () => {
    const trigger = document.createElement('button')
    expect(resolveReference(null, trigger, false, 'bottom')).toBeNull()
  })

  it('prefers an explicit element anchor over the trigger', () => {
    const trigger = document.createElement('button')
    const anchor = document.createElement('div')
    expect(resolveReference(anchor, trigger, false)).toBe(anchor)
    expect(resolveReference(anchor, trigger, true)).toBe(anchor)
  })

  it('accepts a virtual getBoundingClientRect anchor', () => {
    const virtual = rectAnchor(8, 12)
    expect(resolveReference(virtual, null, true)).toBe(virtual)
  })

  it('wraps a point in a virtual rect', () => {
    const resolved = resolveReference({ x: 4, y: 6, width: 2, height: 3 }, null, true)
    expect(resolved?.getBoundingClientRect()).toEqual(new DOMRect(4, 6, 2, 3))
  })

  it('reads a ref object', () => {
    const el = document.createElement('span')
    expect(resolveReference({ current: el }, null, true)).toBe(el)
    expect(resolveReference({ current: null }, null, true)).toBeNull()
  })

  it('uses Trigger only when isolation focus is off', () => {
    const trigger = document.createElement('button')
    expect(resolveReference(null, trigger, true)).toBeNull()
    expect(resolveReference(null, trigger, false)).toBe(trigger)
  })

  it('lifts a Field bezel around the trigger', () => {
    const field = document.createElement('div')
    field.setAttribute('data-reference-field', '')
    const trigger = document.createElement('button')
    field.appendChild(trigger)
    document.body.appendChild(field)
    expect(resolveReference(null, trigger, false)).toBe(field)
    document.body.removeChild(field)
  })
})

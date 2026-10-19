// @vitest-environment happy-dom
/**
 * Pointer-capability proof: hover detection and submenu-side geometry.
 * Pure predicates; the travel effect and parts consume them.
 */
import { describe, expect, it } from 'vitest'
import { hoverCapablePointer, submenuSide } from './pointer'

describe('hoverCapablePointer', () => {
  it('treats mouse as hoverable and touch as not', () => {
    expect(hoverCapablePointer('mouse')).toBe(true)
    expect(hoverCapablePointer('')).toBe(true)
    expect(hoverCapablePointer('touch')).toBe(false)
    expect(hoverCapablePointer('pen', 0)).toBe(true)
    expect(hoverCapablePointer('pen', 0.5)).toBe(false)
    expect(hoverCapablePointer('laser')).toBe(false)
  })
})

describe('submenuSide', () => {
  it('reads the content side, falling back when absent', () => {
    const content = document.createElement('div')
    content.setAttribute('data-side', 'right-start')
    expect(submenuSide(content, 'left')).toBe('right')
    content.setAttribute('data-side', 'bogus')
    expect(submenuSide(content, 'left')).toBe('left')
    expect(submenuSide(null, 'bottom')).toBe('bottom')
  })
})

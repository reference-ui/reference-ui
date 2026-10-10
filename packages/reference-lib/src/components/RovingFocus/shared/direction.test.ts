// @vitest-environment happy-dom
/** Isolated proof for shared/direction: the inherited-direction lookup
 * defaults to ltr without an element and reads computed direction off a
 * mounted node. The full LTR/RTL arrow-matrix behavior is proven in the
 * browser suite (RF-KEY-01/02/10). */

import { describe, expect, it } from 'vitest'
import { getDirection } from './direction'

describe('getDirection', () => {
  it('getDirection defaults to ltr without an element', () => {
    expect(getDirection(null)).toBe('ltr')
  })

  it('reads ltr for a plain element and rtl for an rtl-directed element', () => {
    const plain = document.createElement('button')
    document.body.appendChild(plain)
    expect(getDirection(plain)).toBe('ltr')
    const rtl = document.createElement('button')
    rtl.style.direction = 'rtl'
    document.body.appendChild(rtl)
    expect(getDirection(rtl)).toBe('rtl')
    plain.remove()
    rtl.remove()
  })
})

// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { hiddenByClipping, isFullyClipped, rectHidden } from './clipping'

describe('clipping', () => {
  it('treats a rect fully outside the padded viewport as hidden', () => {
    expect(rectHidden(new DOMRect(-40, 10, 20, 20), 100, 100, 8)).toBe(true)
    expect(rectHidden(new DOMRect(10, 10, 20, 20), 100, 100, 8)).toBe(false)
  })

  it('treats a rect fully outside a clip box as clipped', () => {
    const clip = new DOMRect(0, 0, 50, 50)
    expect(isFullyClipped(new DOMRect(60, 0, 10, 10), clip, 0)).toBe(true)
    expect(isFullyClipped(new DOMRect(10, 10, 10, 10), clip, 0)).toBe(false)
  })

  it('walks overflow ancestors when deciding hide flags', () => {
    const scroller = document.createElement('div')
    scroller.style.overflow = 'hidden'
    scroller.style.width = '40px'
    scroller.style.height = '40px'
    Object.defineProperty(scroller, 'getBoundingClientRect', {
      value: () => new DOMRect(0, 0, 40, 40),
    })

    const source = document.createElement('div')
    scroller.appendChild(source)
    document.body.appendChild(scroller)

    expect(
      hiddenByClipping(new DOMRect(80, 0, 10, 10), source, 400, 400, 0)
    ).toBe(true)
    expect(
      hiddenByClipping(new DOMRect(10, 10, 10, 10), source, 400, 400, 0)
    ).toBe(false)

    document.body.removeChild(scroller)
  })
})

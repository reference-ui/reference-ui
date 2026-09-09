// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { getOverflowAncestors, hiddenByClipping, isFullyClipped, rectHidden } from './clipping'

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

  it('walks overflow ancestors through an open ShadowRoot', () => {
    const light = document.createElement('div')
    light.style.overflow = 'auto'
    light.style.width = '80px'
    light.style.height = '80px'
    const host = document.createElement('div')
    light.appendChild(host)
    document.body.appendChild(light)

    const shadow = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('div')
    inner.style.overflow = 'scroll'
    inner.style.height = '40px'
    const source = document.createElement('div')
    inner.appendChild(source)
    shadow.appendChild(inner)

    const ancestors = getOverflowAncestors(source)
    expect(ancestors.some(a => a === inner)).toBe(true)
    expect(ancestors.some(a => a === light)).toBe(true)

    document.body.removeChild(light)
  })
})

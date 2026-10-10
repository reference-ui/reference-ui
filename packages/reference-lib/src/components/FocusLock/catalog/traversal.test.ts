// @vitest-environment happy-dom
/** Isolation proof for composed traversal: shadow, slots, opacity, and order. */
import { describe, expect, it } from 'vitest'
import { collectComposedCandidates, documentOrder } from './traversal'

function layout<T extends HTMLElement>(el: T): T {
  Object.defineProperty(el, 'getClientRects', {
    configurable: true,
    value: () => [new DOMRect(0, 0, 16, 16)],
  })
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 16 })
  Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 16 })
  return el
}

describe('collectComposedCandidates', () => {
  it('walks open shadow roots at their slotted positions', () => {
    const root = document.createElement('div')
    const host = document.createElement('div')
    const shadow = host.attachShadow({ mode: 'open' })
    const slot = document.createElement('slot')
    const inside = layout(document.createElement('button'))
    inside.textContent = 'inside'
    shadow.append(inside, slot)
    const slotted = layout(document.createElement('button'))
    slotted.textContent = 'slotted'
    host.appendChild(slotted)
    root.appendChild(host)
    document.body.appendChild(root)
    try {
      expect(collectComposedCandidates(root).map(el => el.textContent)).toEqual([
        'inside',
        'slotted',
      ])
    } finally {
      document.body.removeChild(root)
    }
  })

  it('treats iframes and closed roots as opaque', () => {
    const root = document.createElement('div')
    const frame = layout(document.createElement('iframe'))
    const fallback = layout(document.createElement('button'))
    fallback.textContent = 'fallback'
    frame.appendChild(fallback)
    const closedHost = layout(document.createElement('div'))
    closedHost.setAttribute('tabindex', '0')
    const closed = closedHost.attachShadow({ mode: 'closed' })
    const closedInner = layout(document.createElement('button'))
    closedInner.textContent = 'closed-inner'
    closed.appendChild(closedInner)
    root.append(frame, closedHost)
    document.body.appendChild(root)
    try {
      expect(collectComposedCandidates(root)).toEqual([frame, closedHost])
    } finally {
      document.body.removeChild(root)
    }
  })

  it('prunes closed details and tabindex=-1 shadow hosts', () => {
    const root = document.createElement('div')
    const details = document.createElement('details')
    const summary = layout(document.createElement('summary'))
    const inner = layout(document.createElement('button'))
    inner.textContent = 'inner'
    details.append(summary, inner)
    const negativeHost = document.createElement('div')
    negativeHost.setAttribute('tabindex', '-1')
    const shadow = negativeHost.attachShadow({ mode: 'open' })
    const hidden = layout(document.createElement('button'))
    hidden.textContent = 'hidden-by-host'
    shadow.appendChild(hidden)
    root.append(details, negativeHost)
    document.body.appendChild(root)
    try {
      expect(collectComposedCandidates(root)).toEqual([summary])
    } finally {
      document.body.removeChild(root)
    }
  })
})

describe('documentOrder', () => {
  it('sorts by host document position and treats shared hosts as equal', () => {
    const root = document.createElement('div')
    const a = document.createElement('button')
    const b = document.createElement('button')
    root.append(a, b)
    document.body.appendChild(root)
    try {
      expect(documentOrder(a, b)).toBe(-1)
      expect(documentOrder(b, a)).toBe(1)
      expect(documentOrder(a, a)).toBe(0)
    } finally {
      document.body.removeChild(root)
    }
  })
})

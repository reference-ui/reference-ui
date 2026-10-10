// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { activeElementIn, owningScope } from './scope'

describe('owning-root reads', () => {
  it('resolves light-DOM nodes to the document', () => {
    const el = document.createElement('button')
    document.body.appendChild(el)
    expect(owningScope(el)).toBe(document)
    el.focus()
    expect(activeElementIn(el)).toBe(el)
    expect(activeElementIn(null)).toBe(document.activeElement)
    el.remove()
  })

  it('resolves shadow-hosted nodes to their root', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadow = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('input')
    shadow.appendChild(inner)
    expect(owningScope(inner)).toBe(shadow)
    expect(activeElementIn(inner)).toBe(shadow.activeElement)
    host.remove()
  })
})

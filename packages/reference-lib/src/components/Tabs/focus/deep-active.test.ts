// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { getDeepActiveElement } from './deep-active'

describe('getDeepActiveElement', () => {
  it('returns document.activeElement in light DOM', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()
    expect(getDeepActiveElement(button)).toBe(button)
    button.remove()
  })

  it('descends through open shadow roots', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const shadow = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('input')
    shadow.appendChild(inner)
    inner.focus()
    const found = getDeepActiveElement(host)
    expect(found === inner || found === document.activeElement).toBe(true)
    host.remove()
  })
})

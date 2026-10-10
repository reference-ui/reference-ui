// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { byDocumentPosition, isLiveElement } from './order'

describe('isLiveElement', () => {
  it('treats null as live (unmeasured entries keep order)', () => {
    expect(isLiveElement(null)).toBe(true)
  })

  it('treats connected elements as live and detached as dead', () => {
    const el = document.createElement('button')
    expect(isLiveElement(el)).toBe(false)
    document.body.appendChild(el)
    expect(isLiveElement(el)).toBe(true)
    el.remove()
  })
})

describe('byDocumentPosition', () => {
  it('sorts entries by live document position', () => {
    const host = document.createElement('div')
    host.innerHTML = '<button id="a"></button><button id="b"></button><button id="c"></button>'
    document.body.appendChild(host)
    const entries = (['c', 'a', 'b'] as const).map(id => ({
      value: id,
      element: host.querySelector<HTMLElement>(`#${id}`),
    }))
    entries.sort(byDocumentPosition)
    expect(entries.map(e => e.value)).toEqual(['a', 'b', 'c'])
    host.remove()
  })

  it('keeps unmeasured and identical entries stable', () => {
    const el = document.createElement('button')
    expect(byDocumentPosition({ element: null }, { element: el })).toBe(0)
    expect(byDocumentPosition({ element: el }, { element: null })).toBe(0)
    expect(byDocumentPosition({ element: el }, { element: el })).toBe(0)
  })
})

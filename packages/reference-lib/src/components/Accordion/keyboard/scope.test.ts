// @vitest-environment happy-dom
/** Header-scope proof: content-bound nodes, nested roots, header collection. */
import { describe, expect, it } from 'vitest'
import { collectHeaderTriggers, isInsideContentOf } from './scope'

function panel(id: string): HTMLDivElement {
  const div = document.createElement('div')
  div.setAttribute('data-state', 'open')
  div.setAttribute('id', id)
  return div
}

function header(label: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.setAttribute('aria-expanded', 'false')
  button.textContent = label
  return button
}

describe('isInsideContentOf', () => {
  it('detects nodes behind a disclosure panel but not bare headers', () => {
    const root = document.createElement('div')
    const trigger = header('a')
    const content = panel('panel-a')
    const inner = document.createElement('span')
    content.appendChild(inner)
    root.append(trigger, content)
    expect(isInsideContentOf(trigger, root)).toBe(false)
    expect(isInsideContentOf(inner, root)).toBe(true)
    expect(isInsideContentOf(content, root)).toBe(false)
  })

  it('stops at a nested accordion root instead of the outer panel', () => {
    const root = document.createElement('div')
    const content = panel('outer')
    const nested = document.createElement('div')
    nested.setAttribute('data-reference-accordion', '')
    const inner = document.createElement('span')
    nested.appendChild(inner)
    content.appendChild(nested)
    root.appendChild(content)
    expect(isInsideContentOf(inner, root)).toBe(false)
  })

  it('ignores divs that are not disclosure panels', () => {
    const root = document.createElement('div')
    const plain = document.createElement('div')
    plain.setAttribute('data-state', 'open')
    const inner = document.createElement('span')
    plain.appendChild(inner)
    root.appendChild(plain)
    expect(isInsideContentOf(inner, root)).toBe(false)
  })
})

describe('collectHeaderTriggers', () => {
  it('collects the root headers in DOM order (AC-KEY-07)', () => {
    const root = document.createElement('div')
    root.setAttribute('data-reference-accordion', '')
    const a = header('a')
    const b = header('b')
    const content = panel('panel-b')
    const nestedTrigger = header('nested')
    content.appendChild(nestedTrigger)
    const nested = document.createElement('div')
    nested.setAttribute('data-reference-accordion', '')
    const foreign = header('foreign')
    nested.appendChild(foreign)
    const plain = document.createElement('button')
    plain.textContent = 'plain'
    root.append(a, content, b, nested, plain)
    expect(collectHeaderTriggers(root)).toEqual([a, b])
  })

  it('returns an empty list when the root holds no headers', () => {
    const root = document.createElement('div')
    root.setAttribute('data-reference-accordion', '')
    expect(collectHeaderTriggers(root)).toEqual([])
  })
})

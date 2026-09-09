// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import {
  getTabbableCandidates,
  isElementTabbable,
  findFocusableProximity,
} from './candidates'

function layout(el: HTMLElement) {
  Object.defineProperty(el, 'getClientRects', {
    configurable: true,
    value: () => [new DOMRect(0, 0, 16, 16)],
  })
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 16 })
  Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 16 })
  return el
}

function button(label: string, attrs: Record<string, string> = {}) {
  const el = document.createElement('button')
  el.textContent = label
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value)
  }
  return el
}

describe('FocusLock candidates', () => {
  it('visits native tabbable kinds in composed DOM order', () => {
    const root = document.createElement('div')
    root.append(
      button('a'),
      Object.assign(document.createElement('input'), { type: 'text' }),
      Object.assign(document.createElement('select'), {}),
      Object.assign(document.createElement('textarea'), {}),
      Object.assign(document.createElement('a'), { href: '#' }),
      button('z', { tabindex: '5' })
    )
    document.body.appendChild(root)
    const order = getTabbableCandidates(root).map(el => el.tagName)
    expect(order).toEqual(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A', 'BUTTON'])
    document.body.removeChild(root)
  })

  it('skips disabled, negative tabindex, hidden, and inert', () => {
    const root = document.createElement('div')
    const live = button('live')
    const disabled = button('disabled')
    disabled.disabled = true
    const negative = button('neg', { tabindex: '-1' })
    const hidden = button('hidden')
    hidden.hidden = true
    const inertWrap = document.createElement('div')
    inertWrap.setAttribute('inert', '')
    inertWrap.append(button('inert'))
    root.append(disabled, negative, hidden, inertWrap, live)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root)).toEqual([live])
    document.body.removeChild(root)
  })

  it('keeps only the checked radio in a named group', () => {
    const root = document.createElement('div')
    const a = Object.assign(document.createElement('input'), { type: 'radio', name: 'g', value: 'a' })
    const b = Object.assign(document.createElement('input'), { type: 'radio', name: 'g', value: 'b' })
    b.checked = true
    const other = Object.assign(document.createElement('input'), { type: 'radio', name: 'h', value: 'c' })
    root.append(a, b, other)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root)).toEqual([b, other])
    document.body.removeChild(root)
  })

  it('keeps first summary only while details are closed', () => {
    const root = document.createElement('div')
    const details = document.createElement('details')
    const summary = document.createElement('summary')
    summary.textContent = 'sum'
    layout(summary)
    const inner = layout(button('inner'))
    details.append(summary, inner)
    root.append(details)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root)).toEqual([summary])
    details.open = true
    expect(getTabbableCandidates(root)).toEqual([summary, inner])
    document.body.removeChild(root)
  })

  it('keeps first-legend controls in a disabled fieldset', () => {
    const root = document.createElement('div')
    const fieldset = document.createElement('fieldset')
    fieldset.disabled = true
    const legend = document.createElement('legend')
    const legendBtn = layout(button('legend'))
    legend.append(legendBtn)
    const bodyBtn = button('body')
    fieldset.append(legend, bodyBtn)
    root.append(fieldset)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root)).toEqual([legendBtn])
    expect(isElementTabbable(bodyBtn)).toBe(false)
    document.body.removeChild(root)
  })

  it('walks open shadow roots and assigned slots', () => {
    const root = document.createElement('div')
    const host = document.createElement('div')
    const shadow = host.attachShadow({ mode: 'open' })
    const slot = document.createElement('slot')
    const inside = layout(button('inside'))
    shadow.append(inside, slot)
    const slotted = layout(button('slotted'))
    host.append(slotted)
    const after = layout(button('after'))
    root.append(host, after)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root).map(el => el.textContent)).toEqual([
      'inside',
      'slotted',
      'after',
    ])
    document.body.removeChild(root)
  })

  it('sorts shard candidates in document order', () => {
    const lock = document.createElement('div')
    const a = button('a')
    lock.append(a)
    const shard = document.createElement('div')
    const b = button('b')
    shard.append(b)
    document.body.append(lock, shard)
    expect(getTabbableCandidates(lock, [shard]).map(el => el.textContent)).toEqual(['a', 'b'])
    document.body.removeChild(lock)
    document.body.removeChild(shard)
  })

  it('walks right then left then ancestor for restore proximity', () => {
    const wrap = document.createElement('div')
    wrap.tabIndex = 0
    const left = button('left')
    const gone = button('gone')
    const right = button('right')
    wrap.append(left, gone, right)
    document.body.appendChild(wrap)
    gone.remove()
    expect(findFocusableProximity(gone, wrap, right, left)).toBe(right)
    right.remove()
    expect(findFocusableProximity(gone, wrap, null, left)).toBe(left)
    left.remove()
    gone.remove()
    expect(findFocusableProximity(null, wrap, null, null)).toBe(wrap)
    document.body.removeChild(wrap)
  })
})

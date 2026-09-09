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

  it('FL-CAND-02 excludes native non-tabbable kinds', () => {
    const root = document.createElement('div')
    const live = layout(button('live'))
    const disabled = layout(button('disabled'))
    disabled.disabled = true
    const negative = layout(button('neg', { tabindex: '-1' }))
    const deadLink = layout(Object.assign(document.createElement('a'), { textContent: 'nohref' }))
    const audio = layout(document.createElement('audio'))
    const frozen = layout(document.createElement('div'))
    frozen.setAttribute('contenteditable', 'false')
    root.append(disabled, negative, deadLink, audio, frozen, live)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root)).toEqual([live])
    expect(isElementTabbable(negative)).toBe(false)
    document.body.removeChild(root)
  })

  it('FL-CAND-03 excludes hidden and inert ancestor subtrees', () => {
    const root = document.createElement('div')
    const live = layout(button('live'))
    const displayNone = document.createElement('div')
    displayNone.style.display = 'none'
    displayNone.append(layout(button('display')))
    const visHidden = document.createElement('div')
    visHidden.style.visibility = 'hidden'
    visHidden.append(layout(button('vis')))
    const visCollapse = document.createElement('div')
    visCollapse.style.visibility = 'collapse'
    visCollapse.append(layout(button('collapse')))
    const hiddenWrap = document.createElement('div')
    hiddenWrap.hidden = true
    hiddenWrap.append(layout(button('hidden')))
    const inertWrap = document.createElement('div')
    inertWrap.setAttribute('inert', '')
    inertWrap.append(layout(button('inert')))
    root.append(displayNone, visHidden, visCollapse, hiddenWrap, inertWrap, live)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root)).toEqual([live])
    document.body.removeChild(root)
  })

  it('FL-CAND-07 skips zero-area nodes and keeps positioned boxes', () => {
    const root = document.createElement('div')
    const zero = button('zero')
    Object.defineProperty(zero, 'getClientRects', { configurable: true, value: () => [] })
    Object.defineProperty(zero, 'offsetWidth', { configurable: true, value: 0 })
    Object.defineProperty(zero, 'offsetHeight', { configurable: true, value: 0 })
    const fixed = layout(button('fixed'))
    fixed.style.position = 'fixed'
    const abs = layout(button('abs'))
    abs.style.position = 'absolute'
    const ordinary = layout(button('ordinary'))
    root.append(zero, fixed, abs, ordinary)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root).map(el => el.textContent)).toEqual([
      'fixed',
      'abs',
      'ordinary',
    ])
    document.body.removeChild(root)
  })

  it('FL-CAND-10 keeps opacity-clipped rendered nodes and drops display-none', () => {
    const root = document.createElement('div')
    const faded = layout(button('faded'))
    faded.style.opacity = '0'
    const gone = layout(button('gone'))
    gone.style.display = 'none'
    root.append(faded, gone)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root)).toEqual([faded])
    document.body.removeChild(root)
  })

  it('FL-CAND-11 keeps aria-hidden until inert', () => {
    const root = document.createElement('div')
    const hidden = layout(button('aria'))
    hidden.setAttribute('aria-hidden', 'true')
    root.append(hidden)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root)).toEqual([hidden])
    hidden.setAttribute('inert', '')
    expect(getTabbableCandidates(root)).toEqual([])
    document.body.removeChild(root)
  })

  it('FL-CAND-12 treats iframe as one opaque stop', () => {
    const root = document.createElement('div')
    const before = layout(button('before'))
    const frame = layout(document.createElement('iframe'))
    const fallback = layout(button('fallback'))
    frame.append(fallback)
    const after = layout(button('after'))
    root.append(before, frame, after)
    document.body.appendChild(root)
    expect(getTabbableCandidates(root)).toEqual([before, frame, after])
    document.body.removeChild(root)
  })

  it('FL-CAND-13 respects host/slot tabindex and closed roots', () => {
    const root = document.createElement('div')
    const openHost = layout(document.createElement('div'))
    openHost.setAttribute('tabindex', '0')
    const openShadow = openHost.attachShadow({ mode: 'open' })
    const slot = document.createElement('slot')
    const inner = layout(button('inner'))
    openShadow.append(inner, slot)
    const slotted = layout(button('slotted'))
    slotted.tabIndex = 0
    openHost.append(slotted)

    const negativeHost = document.createElement('div')
    negativeHost.setAttribute('tabindex', '-1')
    const negativeShadow = negativeHost.attachShadow({ mode: 'open' })
    negativeShadow.append(layout(button('hidden-by-host')))

    const closedHost = layout(document.createElement('div'))
    closedHost.setAttribute('tabindex', '0')
    const closedShadow = closedHost.attachShadow({ mode: 'closed' })
    closedShadow.append(layout(button('closed-inner')))

    root.append(layout(button('before')), openHost, negativeHost, closedHost, layout(button('after')))
    document.body.appendChild(root)
    const labels = getTabbableCandidates(root).map(el => {
      if (el === openHost) return 'open-host'
      if (el === closedHost) return 'closed-host'
      return el.textContent
    })
    expect(labels).toEqual(['before', 'open-host', 'inner', 'slotted', 'closed-host', 'after'])
    expect(labels).not.toContain('hidden-by-host')
    expect(labels).not.toContain('closed-inner')
    document.body.removeChild(root)
  })
})


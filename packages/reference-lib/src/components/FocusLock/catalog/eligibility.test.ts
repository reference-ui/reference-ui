// @vitest-environment happy-dom
/**
 * Eligibility proof: focusable versus sequentially tabbable. Runs in
 * happy-dom against real elements; catalog assembly consumes it.
 */
import { describe, expect, it } from 'vitest'
import { isElementFocusable, isElementTabbable, tabIndexValue } from './eligibility'

function layout<T extends HTMLElement>(el: T): T {
  Object.defineProperty(el, 'getClientRects', {
    configurable: true,
    value: () => [new DOMRect(0, 0, 16, 16)],
  })
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 16 })
  Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 16 })
  return el
}

function attached<T extends HTMLElement>(el: T): T {
  document.body.appendChild(el)
  return el
}

describe('eligibility', () => {
  it('accepts a rendered native candidate for focus and Tab', () => {
    const button = attached(layout(document.createElement('button')))
    try {
      expect(isElementFocusable(button)).toBe(true)
      expect(isElementTabbable(button)).toBe(true)
      expect(tabIndexValue(button)).toBeNull()
    } finally {
      document.body.removeChild(button)
    }
  })

  it('keeps tabindex=-1 nodes focusable but off the Tab order', () => {
    const button = attached(layout(document.createElement('button')))
    button.setAttribute('tabindex', '-1')
    try {
      expect(tabIndexValue(button)).toBe(-1)
      expect(isElementFocusable(button)).toBe(true)
      expect(isElementTabbable(button)).toBe(false)
    } finally {
      document.body.removeChild(button)
    }
  })

  it('rejects disabled, hidden, and inert nodes outright', () => {
    const disabled = attached(layout(document.createElement('button')))
    disabled.disabled = true
    const hidden = attached(layout(document.createElement('button')))
    hidden.hidden = true
    const inertWrap = document.createElement('div')
    inertWrap.setAttribute('inert', '')
    const inert = layout(document.createElement('button'))
    inertWrap.appendChild(inert)
    attached(inertWrap)
    try {
      for (const el of [disabled, hidden, inert]) {
        expect(isElementFocusable(el)).toBe(false)
        expect(isElementTabbable(el)).toBe(false)
      }
    } finally {
      document.body.removeChild(disabled)
      document.body.removeChild(hidden)
      document.body.removeChild(inertWrap)
    }
  })

  it('rejects display-none while keeping rendered zero-opacity nodes', () => {
    const gone = attached(layout(document.createElement('button')))
    gone.style.display = 'none'
    const faded = attached(layout(document.createElement('button')))
    faded.style.opacity = '0'
    try {
      expect(isElementTabbable(gone)).toBe(false)
      expect(isElementTabbable(faded)).toBe(true)
    } finally {
      document.body.removeChild(gone)
      document.body.removeChild(faded)
    }
  })

  it('rejects non-tabbable native kinds', () => {
    const deadLink = attached(layout(document.createElement('a')))
    const hiddenInput = attached(layout(document.createElement('input')))
    hiddenInput.type = 'hidden'
    const silentAudio = attached(layout(document.createElement('audio')))
    const frozen = attached(layout(document.createElement('div')))
    frozen.setAttribute('contenteditable', 'false')
    try {
      for (const el of [deadLink, hiddenInput, silentAudio, frozen]) {
        expect(isElementFocusable(el)).toBe(false)
        expect(isElementTabbable(el)).toBe(false)
      }
      const liveLink = attached(layout(document.createElement('a')))
      liveLink.href = '#'
      try {
        expect(isElementTabbable(liveLink)).toBe(true)
      } finally {
        document.body.removeChild(liveLink)
      }
    } finally {
      document.body.removeChild(deadLink)
      document.body.removeChild(hiddenInput)
      document.body.removeChild(silentAudio)
      document.body.removeChild(frozen)
    }
  })

  it('protects first-legend controls in a disabled fieldset', () => {
    const fieldset = document.createElement('fieldset')
    fieldset.disabled = true
    const legend = document.createElement('legend')
    const legendBtn = layout(document.createElement('button'))
    legend.appendChild(legendBtn)
    const bodyBtn = layout(document.createElement('button'))
    fieldset.append(legend, bodyBtn)
    attached(fieldset)
    try {
      expect(isElementTabbable(legendBtn)).toBe(true)
      expect(isElementTabbable(bodyBtn)).toBe(false)
    } finally {
      document.body.removeChild(fieldset)
    }
  })

  it('exposes only the summary while details stay closed', () => {
    const details = document.createElement('details')
    const summary = layout(document.createElement('summary'))
    const inner = layout(document.createElement('button'))
    details.append(summary, inner)
    attached(details)
    try {
      expect(isElementTabbable(summary)).toBe(true)
      expect(isElementTabbable(inner)).toBe(false)
      details.open = true
      expect(isElementTabbable(inner)).toBe(true)
    } finally {
      document.body.removeChild(details)
    }
  })

  it('drops zero-area nodes from Tab but not from focus', () => {
    const zero = attached(document.createElement('button'))
    Object.defineProperty(zero, 'getClientRects', { configurable: true, value: () => [] })
    Object.defineProperty(zero, 'offsetWidth', { configurable: true, value: 0 })
    Object.defineProperty(zero, 'offsetHeight', { configurable: true, value: 0 })
    try {
      expect(isElementFocusable(zero)).toBe(true)
      expect(isElementTabbable(zero)).toBe(false)
    } finally {
      document.body.removeChild(zero)
    }
  })
})

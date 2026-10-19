// @vitest-environment happy-dom
/**
 * Deep-focus proof: deepActiveElement and safeFocus across shadow roots.
 * Runs in happy-dom against real trees; containment and restore consume
 * them.
 */
import { describe, expect, it } from 'vitest'
import { deepActiveElement, safeFocus } from './focus'

describe('deepActiveElement', () => {
  it('reads the document active element', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    try {
      button.focus()
      expect(deepActiveElement(document)).toBe(button)
    } finally {
      document.body.removeChild(button)
    }
  })

  it('descends into open shadow roots', () => {
    const host = document.createElement('div')
    const shadow = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('button')
    shadow.appendChild(inner)
    document.body.appendChild(host)
    try {
      inner.focus()
      expect(deepActiveElement(document)).toBe(inner)
    } finally {
      document.body.removeChild(host)
    }
  })
})

describe('safeFocus', () => {
  it('ignores null and disconnected nodes', () => {
    expect(() => safeFocus(null)).not.toThrow()
    expect(() => safeFocus(document.createElement('button'))).not.toThrow()
  })

  it('focuses a connected node and skips the already-active one', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    try {
      safeFocus(button)
      expect(document.activeElement).toBe(button)
      safeFocus(button)
      expect(document.activeElement).toBe(button)
    } finally {
      document.body.removeChild(button)
    }
  })
})

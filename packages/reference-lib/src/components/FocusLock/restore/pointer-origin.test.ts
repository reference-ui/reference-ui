// @vitest-environment happy-dom
/**
 * Pointer-origin proof: record on pointerdown per document. Runs in
 * happy-dom with synthetic events; restore ranking consumes it.
 */
import { describe, expect, it } from 'vitest'
import { lastPointerOrigin, trackPointerOrigin } from './pointer-origin'

describe('pointer origin', () => {
  it('records the last pointerdown target per document', () => {
    trackPointerOrigin(document)
    const button = document.createElement('button')
    document.body.appendChild(button)
    try {
      button.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      expect(lastPointerOrigin(document)).toBe(button)
    } finally {
      document.body.removeChild(button)
    }
  })

  it('forgets targets once they disconnect', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    document.body.removeChild(button)
    expect(lastPointerOrigin(document)).toBeNull()
  })
})

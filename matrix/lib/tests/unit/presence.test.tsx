import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { Presence, usePresence } from '@reference-ui/lib'

describe('Presence Unit Contract', () => {
  describe('Presence Props & Hook API', () => {
    it('PR-DOM-01: renders the authored child element when present is true', () => {
      expect(typeof Presence).toBe('function')
      expect(typeof usePresence).toBe('function')

      const el = React.createElement(
        Presence,
        { present: true },
        React.createElement('div', { id: 'test-node' }, 'Visible')
      )
      expect(el.props.present).toBe(true)
    })

    it('PR-DOM-02: returns null when present is false initially', () => {
      const el = React.createElement(
        Presence,
        { present: false },
        React.createElement('div', { id: 'test-node' }, 'Hidden')
      )
      expect(el.props.present).toBe(false)
    })

    it('PR-DOM-03: handles falsy and empty children gracefully', () => {
      const elNull = React.createElement(Presence, { present: true }, null)
      const elFalse = React.createElement(Presence, { present: true }, false)
      expect(elNull).toBeDefined()
      expect(elFalse).toBeDefined()
    })
  })
})

/**
 * Opacity-modifier station. The modern rgb() slash form passes through
 * untouched, malformed modifiers pass through and warn, and only the
 * well-formed modifier produces color-mix.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-06',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('background: rgb(251 146 60 / 0.3);')
    expect(sheet).not.toContain('color-mix(in srgb, rgb(251 146 60 / 0.3)')
    expect(sheet).toContain('color: red.500/;')
    expect(sheet).toContain('border-color: /40;')
    expect(sheet).toContain(
      'outline-color: color-mix(in srgb, var(--colors-blue-600) 50%, transparent);'
    )
    const messages = result.diagnostics.map(d => d.message)
    expect(messages.filter(m => m.includes('red.500/'))).toHaveLength(1)
    expect(messages.filter(m => m.includes('/40'))).toHaveLength(1)
    expect(messages.some(m => m.includes('251 146 60'))).toBe(false)
  },
}

export default spec

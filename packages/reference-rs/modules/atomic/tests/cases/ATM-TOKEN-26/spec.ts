/**
 * Unbraced token references in a tokens() value. A whole brace-free value
 * that names another token prints as written under ATM-W-UNBRACED-TOKEN-REF,
 * and the warning suggests the braced form. Braced values, self-named tokens
 * and complete CSS values stay silent.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-26',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('--colors-accent: gray.900;')
    expect(sheet).toContain('--colors-alias: colors.gray.900;')
    expect(sheet).toContain('--colors-braced: var(--colors-gray-900);')
    const unbraced = result.diagnostics.filter(d => d.code === 'ATM-W-UNBRACED-TOKEN-REF')
    expect(unbraced).toHaveLength(2)
    expect(unbraced.every(d => d.severity === 'warning')).toBe(true)
    expect(unbraced.map(d => d.message)).toEqual([
      'token `--colors-accent` value `gray.900` names token `colors.gray.900` without braces; write `{colors.gray.900}`',
      'token `--colors-alias` value `colors.gray.900` names token `colors.gray.900` without braces; write `{colors.gray.900}`',
    ])
    // Negative: a self-named token and complete CSS (`solid`, `1px`) never warn.
    expect(unbraced.some(d => /solid|1px/.test(d.message))).toBe(false)
    expect(result.diagnostics.filter(d => d.code !== 'ATM-W-UNBRACED-TOKEN-REF')).toEqual([])
  },
}

export default spec

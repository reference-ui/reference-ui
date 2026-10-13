/**
 * Color token-license station. The pool holds two named colors the system
 * declares as `colors` tokens plus one undeclared shade, and a dynamic
 * `color` site sinks. Only the declared token names mint onto the sink —
 * the license arm the tokenless `ATM-HARVEST-06` cannot exercise — while
 * the undeclared word still never mints a color.
 */
import { expect } from 'vitest'
import {
  compileCase,
  harvestWants,
  hasWant,
  type AtomicCaseSpec,
} from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-HARVEST-07',
  async verify(result) {
    // Only the two declared token names mint; the undeclared word does not.
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'color', 'blue')).toBe(true)
    expect(hasWant(result, 'color', 'hotpink')).toBe(false)
    expect(result.wants ?? []).toHaveLength(2)
    expect(harvestWants(result)).toHaveLength(2)

    const classes = result.css?.classes ?? {}
    expect(classes['color:red']).toBeDefined()
    expect(classes['color:blue']).toBeDefined()
    expect(classes['color:hotpink']).toBeUndefined()
    expect(Object.keys(classes).sort()).toEqual(['color:blue', 'color:red'])

    const sheet = result.stylesheet
    expect(sheet).toContain('color: red;')
    expect(sheet).toContain('color: blue;')
    expect(sheet).not.toContain('color: hotpink;')

    // The site is dynamic but proves no exact miss, so the default is
    // silent; the warn + sink info ride opt-in.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-HARVEST-07', { logs: ['compiler'] })
    expect(opted.compilerDiagnostics, 'opt-in channel populates').toBeDefined()
    const moved = (opted.compilerDiagnostics ?? []).filter(
      d => d.code !== 'ATM-I-EXPECTED-LOOKUP' && d.code !== 'ATM-I-DYNAMIC-SLOT'
    )
    expect(moved).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
      }),
      expect.objectContaining({
        severity: 'info',
        code: 'ATM-I-HARVEST-SINK',
        message: 'color under []: 2 harvested values minted',
      }),
    ])
  },
}

export default spec

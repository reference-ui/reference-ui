/**
 * Color allowlist station. The pool holds a spacing `var()`, an `oklch()`
 * value, an unlicensed named color, and `'inherit'`; a dynamic `color`
 * site and a dynamic `width` site sink side by side. The color sink mints
 * only the allowlisted word — expressions and unlicensed words never mint
 * a color — while the width sink still mints the `var()` reference and
 * the CSS-wide keyword.
 */
import { expect } from 'vitest'
import { compileCase, harvestWants, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const VAR = 'var(--spacing-4r, 16px)'
const OKLCH = 'oklch(55.4% 0.046 257.417)'

const spec: AtomicCaseSpec = {
  id: 'ATM-HARVEST-06',
  async verify(result) {
    // The color sink mints only the allowlisted word.
    expect(hasWant(result, 'color', 'inherit')).toBe(true)
    expect(hasWant(result, 'color', VAR)).toBe(false)
    expect(hasWant(result, 'color', OKLCH)).toBe(false)
    expect(hasWant(result, 'color', 'red')).toBe(false)
    // The width sink still mints the var reference and the keyword.
    expect(hasWant(result, 'width', VAR)).toBe(true)
    expect(hasWant(result, 'width', 'inherit')).toBe(true)
    expect(result.wants ?? []).toHaveLength(3)
    expect(harvestWants(result)).toHaveLength(3)

    const classes = result.css?.classes ?? {}
    expect(classes['color:inherit']).toBeDefined()
    expect(classes[`color:${VAR}`]).toBeUndefined()
    expect(classes[`color:${OKLCH}`]).toBeUndefined()
    expect(classes['color:red']).toBeUndefined()
    expect(classes[`width:${VAR}`]).toBeDefined()
    expect(classes['width:inherit']).toBeDefined()

    const sheet = result.stylesheet
    expect(sheet).toContain('color: inherit;')
    expect(sheet).not.toContain('color: var(')
    expect(sheet).not.toContain('color: oklch(')
    expect(sheet).not.toContain('color: red;')
    expect(sheet).toContain('width: var(--spacing-4r, 16px);')

    // Both sites are dynamic but prove no exact miss, so the default is
    // silent; the warns + sink infos ride opt-in.
    expect(result.diagnostics ?? []).toHaveLength(0)
    const opted = await compileCase('ATM-HARVEST-06', { logs: ['compiler'] })
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
        severity: 'warning',
        code: 'ATM-W-DYNAMIC-IDENTIFIER',
      }),
      expect.objectContaining({
        severity: 'info',
        code: 'ATM-I-HARVEST-SINK',
        message: 'color under []: 1 harvested value minted',
      }),
      expect.objectContaining({
        severity: 'info',
        code: 'ATM-I-HARVEST-SINK',
        message: 'width under []: 2 harvested values minted',
      }),
    ])
  },
}

export default spec

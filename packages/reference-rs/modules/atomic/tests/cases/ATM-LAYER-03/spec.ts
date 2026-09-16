/**
 * Layer-population station. Fixture globalCss prints into `@layer global`
 * and token light/dark values populate `@layer tokens`. Empty reset/recipes
 * stay omitted. Utility rules stay inside `@layer utilities`.
 */
import { expect } from 'vitest'
import { LAYER_PREAMBLE, LIB_PACKAGE_OPEN, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-03',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet.startsWith(`${LIB_PACKAGE_OPEN}\n${LAYER_PREAMBLE}`)).toBe(true)
    expect(sheet).toContain('@layer global {')
    expect(sheet).toContain('--spacing-root: 0.25rem')
    expect(sheet).toContain('@layer tokens {')
    expect(sheet).toContain(':root, [data-theme=light] {')
    expect(sheet).toContain('--colors-blue-600:')
    expect(sheet).toContain('[data-theme=dark]')
    expect(sheet).not.toContain('@layer reset {')
    expect(sheet).not.toContain('@layer recipes {')
    const utilitiesOpen = sheet.indexOf('@layer utilities {')
    expect(utilitiesOpen).toBeGreaterThan(-1)
    const utilities = sheet.slice(utilitiesOpen)
    expect(utilities).toContain('margin-top: var(--spacing-root);')
    expect(utilities).toContain('color: var(--colors-blue-600);')
    expect(sheet.slice(0, utilitiesOpen)).not.toContain('mt_1r')
  },
}

export default spec

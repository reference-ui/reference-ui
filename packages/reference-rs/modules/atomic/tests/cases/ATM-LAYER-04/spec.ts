/**
 * Utilities-encapsulation station. Unconditioned rules and `@container`
 * wrappers both sit inside `@layer utilities { ... }`. Tokens/global may
 * appear before that block; utility classes must not.
 */
import { expect } from 'vitest'
import { LAYER_PREAMBLE, LIB_PACKAGE_OPEN, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-04',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet.startsWith(`${LIB_PACKAGE_OPEN}\n${LAYER_PREAMBLE}`)).toBe(true)
    const utilitiesOpen = sheet.indexOf('@layer utilities {')
    expect(utilitiesOpen).toBeGreaterThan(-1)
    const body = sheet.slice(utilitiesOpen)
    expect(body).toContain('.\\@reference-ui\\/lib__mt_2r')
    expect(body).toContain('@container')
    expect(sheet.slice(0, utilitiesOpen)).not.toContain('.\\@reference-ui\\/lib__mt_2r')
    expect(sheet.includes('.\\@reference-ui\\/lib__mt_2r {') && !body.includes('.\\@reference-ui\\/lib__mt_2r')).toBe(false)
  },
}

export default spec

/**
 * Dual at-rule wrap station. `_osDark` plus array-slot `sm` must both reach
 * the sheet as nested `@media` / `@container`, in author order. Nested
 * `sm: { … }` object keys are not extract conditions (COND-01 / ORDER-01).
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const MEDIA = '@media (prefers-color-scheme: dark)'
const CONTAINER = '@container (min-width: 640px)'

const spec: AtomicCaseSpec = {
  id: 'ATM-GHOST-05',
  verify(result) {
    expect(hasWant(result, 'color', 'red', ['_osDark', 'sm'])).toBe(true)
    expect(result.css.classes?.['_osDark:sm:color:red']).toBe('osDark:sm:c_red')
    expect(result.atomCount).toBe(1)
    expect(result.diagnostics).toEqual([])
    const sheet = result.stylesheet
    const mediaAt = sheet.indexOf(MEDIA)
    const containerAt = sheet.indexOf(CONTAINER)
    const classAt = sheet.indexOf('.osDark\\:sm\\:c_red')
    expect(mediaAt).toBeGreaterThan(-1)
    expect(containerAt).toBeGreaterThan(mediaAt)
    expect(classAt).toBeGreaterThan(containerAt)
    expect(sheet.slice(mediaAt, classAt)).toContain(CONTAINER)
    expect(sheet).not.toMatch(
      /@media \(prefers-color-scheme: dark\) \{\s*\.osDark\\:sm\\:c_red/
    )
  },
}

export default spec

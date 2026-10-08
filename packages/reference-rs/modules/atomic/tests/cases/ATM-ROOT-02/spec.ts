/**
 * Author-override station. The baked default still emits first, but the
 * author's own `:root` definition keeps its value and its placement inside
 * `@layer global`, where cascade rank beats the lower `@layer root`: the
 * author always wins. Rhythm utilities resolve their calc formulas against
 * the effective (author) root.
 */
import { expect } from 'vitest'
import {
  hasWant,
  LAYER_PREAMBLE,
  layerBody,
  ROOT_DEFAULT_BLOCK,
  type AtomicCaseSpec,
} from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-ROOT-02',
  verify(result) {
    expect(hasWant(result, 'maxWidth', '140r')).toBe(true)
    expect(hasWant(result, 'marginTop', '2r')).toBe(true)
    const sheet = result.stylesheet
    expect(sheet.startsWith(`${ROOT_DEFAULT_BLOCK}@layer root-override {\n${LAYER_PREAMBLE}`)).toBe(
      true
    )
    expect(layerBody(sheet, 'root')).toContain(':root { --spacing-root: 0.25rem }')
    expect(layerBody(sheet, 'global')).toContain(':root { --spacing-root: 0.5rem }')
    const defaultAt = sheet.indexOf('--spacing-root: 0.25rem')
    const authorAt = sheet.indexOf('--spacing-root: 0.5rem')
    expect(defaultAt).toBeGreaterThan(-1)
    expect(authorAt).toBeGreaterThan(defaultAt)
    expect(sheet).toContain('max-width: calc(140 * var(--spacing-root));')
    expect(sheet).toContain('margin-top: calc(2 * var(--spacing-root));')
    expect(result.diagnostics ?? []).toEqual([])
  },
}

export default spec

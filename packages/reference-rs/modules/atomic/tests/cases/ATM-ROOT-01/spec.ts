/**
 * Baked root-default station. A system with no author `:root` and an input
 * with zero rhythm values still emits `@layer root` first: the default is
 * unconditional, so rhythm rules can never dangle. The default is the only
 * `--spacing-root` definition in the sheet.
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
  id: 'ATM-ROOT-01',
  verify(result) {
    expect(hasWant(result, 'color', 'red')).toBe(true)
    expect(hasWant(result, 'padding', '8px')).toBe(true)
    const sheet = result.stylesheet
    expect(sheet.startsWith(`${ROOT_DEFAULT_BLOCK}@layer root-default {\n${LAYER_PREAMBLE}`)).toBe(
      true
    )
    expect(layerBody(sheet, 'root')).toContain(':root { --spacing-root: 0.25rem }')
    expect(sheet).not.toContain('calc(')
    expect(sheet.indexOf('--spacing-root:')).toBe(sheet.lastIndexOf('--spacing-root:'))
    expect(result.diagnostics ?? []).toEqual([])
  },
}

export default spec

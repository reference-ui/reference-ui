/**
 * Foreign-spec rejection station. Core's portable `{ name, fragment, jsxElements }`
 * shape shares a name with the evaluated spec but none of its collections, so the
 * seam must refuse it by name with an error diagnostic and a preamble-only sheet.
 */
import { expect } from 'vitest'
import { LAYER_PREAMBLE, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-10',
  verify(result) {
    expect(result.diagnostics).toHaveLength(1)
    const [rejection] = result.diagnostics
    expect(rejection!.severity).toBe('error')
    expect(rejection!.message).toContain('baseSystem')
    expect(rejection!.message).toContain('fragment')
    expect(result.stylesheet.startsWith(LAYER_PREAMBLE)).toBe(true)
    expect(result.stylesheet).not.toContain('@layer tokens {')
    expect(result.portableStylesheet?.startsWith(LAYER_PREAMBLE)).toBe(true)
    expect(result.atomCount).toBe(0)
    expect(result.css?.classes ?? {}).toEqual({})
    expect(result.stylePlans).toEqual([])
    expect(result.stylesheet).not.toContain('data-panda-theme')
    expect(result.stylesheet).not.toContain('[data-theme=')
    expect(result.portableStylesheet ?? '').not.toContain('data-panda-theme')
    expect(result.portableStylesheet ?? '').not.toContain('[data-theme=')
  },
}

export default spec

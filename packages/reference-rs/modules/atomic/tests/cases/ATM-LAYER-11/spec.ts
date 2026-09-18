/**
 * Font-face-array station (ATM-LAYER-11, RS-24). A `fontFace` array syncs
 * and prints one `@font-face` block per entry; the single-object form
 * keeps printing exactly one block. Empty arrays mean absent (cargo).
 */
import { expect } from 'vitest'
import type { AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LAYER-11',
  verify(result) {
    const sheet = result.stylesheet
    const faces = sheet.match(/@font-face \{/g) ?? []
    expect(faces).toHaveLength(3)
    expect(sheet).toContain('src: url(/fonts/inter-normal.woff2);')
    expect(sheet).toContain('src: url(/fonts/inter-italic.woff2);')
    expect(sheet).toContain('src: url(/fonts/mono.woff2);')
    expect(sheet).toContain('font-style: normal;')
    expect(sheet).toContain('font-style: italic;')
    expect(sheet).toContain('font-family: Inter;')
    expect(sheet).toContain('font-family: "JetBrains Mono";')

    expect(result.diagnostics).toEqual([])
  },
}

export default spec

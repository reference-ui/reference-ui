import { describe, expect, it } from 'vitest'
import { readGeneratedFile } from './customProps-output.helpers'

describe('size output (e2e)', () => {
  // TODO(matrix/spacing): No matrix test currently asserts the generated box
  // pattern declaration surface for the size prop.
  it('emits size on the generated box pattern type surface', () => {
    const boxTypes = readGeneratedFile('styled', 'patterns', 'box.d.ts')
    if (!boxTypes) return

    expect(boxTypes).toMatch(/\bsize\?:/)
  })

  // TODO(matrix/spacing): No matrix test currently asserts the generated
  // style-props declaration surface for the size prop.
  it('emits size on the generated style-props utility surface', () => {
    const stylePropTypes = readGeneratedFile('styled', 'types', 'style-props.d.ts')
    if (!stylePropTypes) return

    expect(stylePropTypes).toContain('UtilityValues["size"]')
  })
})
import { describe, expect, it } from 'vitest'
import {
  hasVirtualSystemFile,
  readGeneratedFile,
  readVirtualSystemFile,
} from './customProps-output.helpers'

describe('combined custom props output (e2e)', () => {
  // MIGRATED: Covered by matrix/primitives/tests/unit/generated-output.test.ts.
  it.skip('copies the source-backed combined custom props fixture into virtual output', () => {
    expect(hasVirtualSystemFile('combinedCustomProps.fixture.tsx')).toBe(true)

    const content = readVirtualSystemFile('combinedCustomProps.fixture.tsx')
    expect(content).toContain('font="sans"')
    expect(content).toContain('weight="bold"')
    expect(content).toContain("555: { padding: '2.25rem' }")
  })

  // MIGRATED: Covered by matrix/primitives/tests/unit/generated-output.test.ts.
  it.skip('keeps primitive jsx names in the generated pattern extension bundle', () => {
    const extensionsBundle = readGeneratedFile('styled', 'extensions', 'index.mjs')
    if (!extensionsBundle) return

    expect(extensionsBundle).toContain('var PRIMITIVE_JSX_NAMES = TAGS.map(toJsxName);')
    expect(extensionsBundle).toContain('function resolvePandaJsxElements(additionalJsxElements) {')
    expect(extensionsBundle).toContain('jsx: resolvePandaJsxElements(additionalJsxElements)')
  })

  // MIGRATED: Covered by matrix/primitives/tests/e2e/primitives-contract.spec.ts.
  it.skip('extracts combined custom props from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('@container card (min-width: 555px)')
    expect(css).toContain('padding: 2.25rem;')
    expect(css).toContain('.fw_600')
    expect(css).toContain('.ff_sans')
  })
})

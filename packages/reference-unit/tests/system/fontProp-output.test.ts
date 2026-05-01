import { describe, expect, it } from 'vitest'
import {
  hasVirtualSystemFile,
  readGeneratedFile,
  readVirtualSystemFile,
} from './customProps-output.helpers'

async function waitForGeneratedFile(...segments: string[]): Promise<string | undefined> {
  const startedAt = Date.now()
  const maxWaitMs = 15_000

  while (Date.now() - startedAt < maxWaitMs) {
    const content = readGeneratedFile(...segments)

    if (content) {
      return content
    }

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  return readGeneratedFile(...segments)
}

async function waitForGeneratedFileContaining(
  needle: string,
  ...segments: string[]
): Promise<string | undefined> {
  const startedAt = Date.now()
  const maxWaitMs = 20_000

  while (Date.now() - startedAt < maxWaitMs) {
    const content = readGeneratedFile(...segments)

    if (content?.includes(needle)) {
      return content
    }

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  return readGeneratedFile(...segments)
}

describe('font prop output (e2e)', () => {
  // TODO(matrix/font): Add one generated-output assertion that this source-backed
  // font fixture is mirrored into virtual output, then retire this smoke.
  it('copies the source-backed font prop fixture into virtual output', () => {
    expect(hasVirtualSystemFile('fontProp.fixture.tsx')).toBe(true)

    const content = readVirtualSystemFile('fontProp.fixture.tsx')
    expect(content).toContain('font="sans"')
    expect(content).toContain('weight="bold"')
  })

  // MIGRATED: Covered by matrix/font/tests/e2e/font-contract.spec.ts
  // and matrix/font/tests/unit/runtime.test.ts.
  it.skip('extracts font custom props from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('.ff_sans')
    expect(css).toContain('.ls_-0\\.01em')
    expect(css).toContain('.fw_700')
  })

  // MIGRATED: Covered by matrix/font/tests/unit/runtime.test.ts.
  it.skip('emits generated system font registry types', async () => {
    const systemFontRegistryTypes = await waitForGeneratedFileContaining(
      'interface FontRegistry {',
      'system',
      'types',
      'fontRegistry.d.ts'
    )
    const systemGeneratedTypes = await waitForGeneratedFile('system', 'types.generated.d.mts')
    const reactFontRegistryTypes = await waitForGeneratedFileContaining(
      'interface FontRegistry {',
      'react',
      'types',
      'fontRegistry.d.ts'
    )
    const reactFontTypes = await waitForGeneratedFileContaining(
      'type FontProps = FallbackFontProps',
      'react',
      'types',
      'fonts.d.ts'
    )
    const reactGeneratedTypes = await waitForGeneratedFile('react', 'types.generated.d.mts')

    expect(systemFontRegistryTypes).toContain('interface FontRegistry {')
    expect(systemGeneratedTypes).toContain('interface FontRegistry {')
    expect(systemGeneratedTypes).toContain('"sans": {')
    expect(reactFontRegistryTypes).toContain('interface FontRegistry {')
    expect(reactFontTypes).toMatch(/type FontProps = FallbackFontProps/)
    expect(reactFontTypes).toContain('ScopedFontProps')
    expect(reactGeneratedTypes).toContain('"sans": {')
    expect(reactGeneratedTypes).toContain('"bold": true')
  }, 20_000)
})

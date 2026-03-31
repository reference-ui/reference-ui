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
  it('copies the source-backed font prop fixture into virtual output', () => {
    expect(hasVirtualSystemFile('fontProp.fixture.tsx')).toBe(true)

    const content = readVirtualSystemFile('fontProp.fixture.tsx')
    expect(content).toContain('font="sans"')
    expect(content).toContain('weight="bold"')
  })

  it('extracts font custom props from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('.ff_sans')
    expect(css).toContain('.ls_-0\\.01em')
    expect(css).toContain('.fw_700')
  })

  it('emits generated system font registry types', async () => {
    const systemTypes = await waitForGeneratedFileContaining(
      'interface FontRegistry {',
      'system',
      'system.d.mts'
    )
    const systemGeneratedTypes = await waitForGeneratedFile('system', 'types.generated.d.mts')
    const reactTypes = await waitForGeneratedFileContaining(
      'interface FontRegistry {',
      'react',
      'react.d.mts'
    )
    const reactGeneratedTypes = await waitForGeneratedFile('react', 'types.generated.d.mts')

    expect(systemTypes).toContain('interface FontRegistry {')
    expect(systemGeneratedTypes).toContain('interface FontRegistry {')
    expect(systemGeneratedTypes).toContain('"sans": {')
    expect(reactTypes).toContain('interface FontRegistry {')
    // Decl emit uses FallbackFontProps & conditional ScopedFontProps (see `src/types/fonts.ts`) so
    // d.ts bundlers / tsdown do not collapse FontProps to `never` when the registry is empty.
    expect(reactTypes).toMatch(/type FontProps = FallbackFontProps/)
    expect(reactTypes).toContain('ScopedFontProps')
    expect(reactGeneratedTypes).toContain('"sans": {')
    expect(reactGeneratedTypes).toContain('"bold": true')
  }, 20_000)
})

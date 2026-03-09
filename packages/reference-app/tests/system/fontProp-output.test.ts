import { describe, expect, it } from 'vitest'
import {
  hasVirtualSystemFile,
  readGeneratedFile,
  readVirtualSystemFile,
} from './customProps-output.helpers'

async function waitForGeneratedFile(...segments: string[]): Promise<string | undefined> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < 5_000) {
    const content = readGeneratedFile(...segments)

    if (content) {
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
    expect(content).toContain('font="mono"')
    expect(content).toContain('weight="bold"')
  })

  it('extracts font custom props from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('.ff_mono')
    expect(css).toContain('.ls_-0\\.04em')
    expect(css).toContain('.fw_700')
  })

  it('emits generated system font registry types', async () => {
    const systemTypes = await waitForGeneratedFile('system', 'system.d.mts')
    const systemGeneratedTypes = await waitForGeneratedFile('system', 'types.generated.d.mts')
    const reactTypes = await waitForGeneratedFile('react', 'react.d.mts')
    const reactGeneratedTypes = await waitForGeneratedFile('react', 'types.generated.d.mts')

    expect(systemTypes).toContain('interface ReferenceFontRegistry {')
    expect(systemGeneratedTypes).toContain('interface ReferenceFontRegistry {')
    expect(systemGeneratedTypes).toContain('"mono": {')
    expect(reactTypes).toContain('interface ReferenceFontRegistry {')
    expect(reactTypes).toContain('ReferenceFontProps')
    expect(reactGeneratedTypes).toContain('"mono": {')
    expect(reactGeneratedTypes).toContain('"bold": true')
  })
})

import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const refUiDir = join(pkgRoot, '.reference-ui')

function readGeneratedFile(...segments: string[]): string | undefined {
  const path = join(refUiDir, ...segments)
  if (!existsSync(path)) return undefined
  return readFileSync(path, 'utf-8')
}

describe('custom props output (e2e)', () => {
  it('copies the source-backed font prop fixture into virtual output', () => {
    const virtualFixture = join(refUiDir, 'virtual', 'src', 'system', 'fontProp.fixture.tsx')
    expect(existsSync(virtualFixture)).toBe(true)

    const content = readFileSync(virtualFixture, 'utf-8')
    expect(content).toContain('font="mono"')
    expect(content).toContain('weight="mono.bold"')
  })

  it('copies the source-backed container prop fixtures into virtual output', () => {
    const anonymousFixture = join(
      refUiDir,
      'virtual',
      'src',
      'system',
      'containerAnonymous.fixture.tsx'
    )
    const namedFixture = join(refUiDir, 'virtual', 'src', 'system', 'containerNamed.fixture.tsx')

    expect(existsSync(anonymousFixture)).toBe(true)
    expect(existsSync(namedFixture)).toBe(true)

    const anonymousContent = readFileSync(anonymousFixture, 'utf-8')
    const namedContent = readFileSync(namedFixture, 'utf-8')

    expect(anonymousContent).toContain("333: { padding: '1.25rem' }")
    expect(namedContent).toContain('container="shell"')
  })

  it('copies the source-backed combined custom props fixture into virtual output', () => {
    const virtualFixture = join(
      refUiDir,
      'virtual',
      'src',
      'system',
      'combinedCustomProps.fixture.tsx'
    )
    expect(existsSync(virtualFixture)).toBe(true)

    const content = readFileSync(virtualFixture, 'utf-8')
    expect(content).toContain('font="sans"')
    expect(content).toContain('weight="sans.semibold"')
    expect(content).toContain("555: { padding: '2.25rem' }")
  })

  it('keeps primitive jsx names in the generated pattern extension bundle', () => {
    const extensionsBundle = readGeneratedFile('styled', 'extensions', 'index.mjs')
    if (!extensionsBundle) return

    expect(extensionsBundle).toContain('var PRIMITIVE_JSX_NAMES = TAGS.map(toJsxName);')
    expect(extensionsBundle).toContain('jsx: [...PRIMITIVE_JSX_NAMES]')
  })

  it('extracts font custom props from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('.ff_mono')
    expect(css).toContain('.ls_-0\\.04em')
    expect(css).toContain('.fw_700')
  })

  it('extracts anonymous container query styles from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('@container (min-width: 333px)')
    expect(css).toContain('padding: 1.25rem;')
    expect(css).not.toContain('@container true (min-width: 333px)')
  })

  it('extracts named container query styles from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('@container shell (min-width: 777px)')
    expect(css).toContain('font-size: 1.125rem;')
  })

  it('extracts combined custom props from source-backed primitive usage', () => {
    const css = readGeneratedFile('styled', 'styles.css')
    if (!css) return

    expect(css).toContain('@container card (min-width: 555px)')
    expect(css).toContain('padding: 2.25rem;')
    expect(css).toContain('.fw_600')
    expect(css).toContain('.ff_sans')
  })
})

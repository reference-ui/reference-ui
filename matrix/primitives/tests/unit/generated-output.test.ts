import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import postcss, { type Root } from 'postcss'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..', '..')
const refUiDir = join(packageRoot, '.reference-ui')
const reactStylesheetPath = join(refUiDir, 'react', 'styles.css')
const combinedCustomPropsVirtualFixturePath = join(
  refUiDir,
  'virtual',
  'src',
  'system',
  'combinedCustomProps.fixture.tsx',
)
const extensionsBundlePath = join(refUiDir, 'styled', 'extensions', 'index.mjs')
const virtualFixtureSourcePath = join(refUiDir, 'virtual', 'src', 'primitiveCssPropFixture.ts')
const fixtureSourcePath = join(packageRoot, 'src', 'primitiveCssPropFixture.ts')
const suspiciousStylesheetFragments = ['[object Object]', 'undefined', 'NaN', '\u0000', '\uFFFD'] as const
const generatedOutput = {
  extensionsBundle: '',
  reactStylesheet: '',
  reactStylesheetAst: null as Root | null,
}

function runRefSync(): void {
  try {
    execFileSync('pnpm', ['exec', 'ref', 'sync'], {
      cwd: packageRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    })
  } catch (error) {
    if (!(error instanceof Error) || !('stdout' in error) || !('stderr' in error)) {
      throw error
    }

    const stdout = Buffer.isBuffer(error.stdout) ? error.stdout.toString('utf8') : String(error.stdout)
    const stderr = Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8') : String(error.stderr)

    throw new Error(
      ['ref sync failed', '', 'stdout:', stdout.trim() || '(empty)', '', 'stderr:', stderr.trim() || '(empty)'].join('\n'),
    )
  }
}

async function waitForGeneratedContent(
  absolutePath: string,
): Promise<string> {
  const readyContent = readGeneratedContentIfReady(absolutePath)

  if (readyContent !== null) {
    return Promise.resolve(readyContent)
  }

  runRefSync()

  const syncedContent = readGeneratedContentIfReady(absolutePath)

  if (syncedContent !== null) {
    return Promise.resolve(syncedContent)
  }

  throw new Error(`Expected generated file ${absolutePath} after ref sync`)
}

function readGeneratedContentIfReady(
  absolutePath: string,
): string | null {
  if (!existsSync(absolutePath)) {
    return null
  }

  const content = readFileSync(absolutePath, 'utf-8')

  return content.length > 0 ? content : null
}

beforeAll(async () => {
  const [reactStylesheet, extensionsBundle] = await Promise.all([
    waitForGeneratedContent(reactStylesheetPath),
    waitForGeneratedContent(extensionsBundlePath),
  ])

  generatedOutput.reactStylesheet = reactStylesheet
  generatedOutput.extensionsBundle = extensionsBundle
  generatedOutput.reactStylesheetAst = postcss.parse(generatedOutput.reactStylesheet, {
    from: reactStylesheetPath,
  })
}, 120_000)

describe('primitives generated output', () => {
  it('generates the expected primitive output artifacts', () => {
    expect(existsSync(reactStylesheetPath)).toBe(true)
    expect(existsSync(combinedCustomPropsVirtualFixturePath)).toBe(true)
    expect(existsSync(extensionsBundlePath)).toBe(true)
    expect(existsSync(virtualFixtureSourcePath)).toBe(true)
    expect(generatedOutput.reactStylesheet.length).toBeGreaterThan(0)
  })

  it('mirrors the combined custom props source fixture into virtual output', () => {
    const mirroredFixture = readFileSync(combinedCustomPropsVirtualFixturePath, 'utf-8')

    expect(mirroredFixture).toContain('font="sans"')
    expect(mirroredFixture).toContain('weight="bold"')
    expect(mirroredFixture).toContain("555: { padding: '2.25rem' }")
  })

  it('keeps primitive JSX names in the generated pattern extension bundle', () => {
    expect(generatedOutput.extensionsBundle).toContain('var PRIMITIVE_JSX_NAMES = TAGS.map(toJsxName);')
    expect(generatedOutput.extensionsBundle).toContain('function resolvePandaJsxElements(additionalJsxElements) {')
    expect(generatedOutput.extensionsBundle).toContain('jsx: resolvePandaJsxElements(additionalJsxElements)')
  })

  it('parses the generated stylesheet without syntax errors', () => {
    expect(generatedOutput.reactStylesheetAst).toBeTruthy()
    expect(generatedOutput.reactStylesheetAst?.nodes.length ?? 0).toBeGreaterThan(0)
  })

  it('keeps standard declarations in the generated stylesheet non-empty', () => {
    const invalidDeclarations: string[] = []
    let declarationCount = 0

    generatedOutput.reactStylesheetAst?.walkDecls((decl) => {
      declarationCount += 1

      if (decl.prop.trim().length === 0) {
        invalidDeclarations.push(`${decl.prop}:${decl.value}`)
        return
      }

      if (!decl.prop.startsWith('--') && decl.value.trim().length === 0) {
        invalidDeclarations.push(`${decl.prop}:${decl.value}`)
      }
    })

    expect(declarationCount).toBeGreaterThan(0)
    expect(invalidDeclarations).toEqual([])
  })

  it('keeps suspicious placeholder fragments out of the generated stylesheet', () => {
    const foundFragments = suspiciousStylesheetFragments.filter((fragment) =>
      generatedOutput.reactStylesheet.includes(fragment),
    )

    expect(generatedOutput.reactStylesheet.length).toBeGreaterThan(0)
    expect(foundFragments).toEqual([])
  })

  it('updates mirrored virtual source while keeping generated CSS stable for source-only fixture changes after ref sync', async () => {
    const originalSource = readFileSync(fixtureSourcePath, 'utf-8')
    const originalVirtualSource = readFileSync(virtualFixtureSourcePath, 'utf-8')
    const originalStylesheet = generatedOutput.reactStylesheet
    const updatedSource = originalSource
      .replace("label: 'CSS prop primitive'", "label: 'CSS prop primitive after ref sync'")
      .replace("rebuildMarker: 'stable-v1'", "rebuildMarker: 'stable-v2'")

    expect(updatedSource).not.toBe(originalSource)
    expect(originalVirtualSource).toContain("label: 'CSS prop primitive'")
    expect(originalVirtualSource).toContain("rebuildMarker: 'stable-v1'")

    try {
      writeFileSync(fixtureSourcePath, updatedSource)
      runRefSync()

      const updatedVirtualSource = readFileSync(virtualFixtureSourcePath, 'utf-8')
      const updatedStylesheet = await waitForGeneratedContent(reactStylesheetPath)

      expect(updatedVirtualSource).toContain("label: 'CSS prop primitive after ref sync'")
      expect(updatedVirtualSource).toContain("rebuildMarker: 'stable-v2'")
      expect(updatedVirtualSource).not.toContain("label: 'CSS prop primitive'")
      expect(updatedVirtualSource).not.toContain("rebuildMarker: 'stable-v1'")
      expect(updatedStylesheet).toBe(originalStylesheet)
    } finally {
      writeFileSync(fixtureSourcePath, originalSource)
      runRefSync()
    }
  }, 120_000)
})
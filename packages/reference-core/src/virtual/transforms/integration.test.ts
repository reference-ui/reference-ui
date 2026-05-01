import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { microBundle } from '../../lib/microbundle'
import { applyTransforms } from './index'

const createdDirs: string[] = []
const SOURCE_IMPORT = "import { css, recipe } from '@reference-ui/react'"
const CONSTANTS_IMPORT = "import { constants } from './constants'"
const SYSTEM_CVA_IMPORT = "import { cva } from 'src/system/css';"
const SYSTEM_CSS_IMPORT = "import { css } from 'src/system/css';"

function writeTransformFixture(srcDir: string): { stylesPath: string } {
  const constantsPath = join(srcDir, 'constants.ts')
  const stylesPath = join(srcDir, 'styles.ts')

  writeFileSync(constantsPath, "export const constants = { nested: '12px' } as const\n")
  writeFileSync(
    stylesPath,
    [
      SOURCE_IMPORT,
      CONSTANTS_IMPORT,
      'export const card = css({',
      "  '& [data-slot=inner]': { marginTop: constants.nested },",
      '})',
      'export const button = recipe({',
      '  base: { color: \'red\' },',
      '})',
    ].join('\n') + '\n'
  )

  return { stylesPath }
}

async function readFileText(filePath: string): Promise<string> {
  return import('node:fs/promises').then(fs => fs.readFile(filePath, 'utf-8'))
}

function expectNeutralizedSource(content: string): void {
  expect(content).toContain(SYSTEM_CVA_IMPORT)
  expect(content).toContain(SYSTEM_CSS_IMPORT)
  expect(content).toContain('const __reference_ui_css = css;')
  expect(content).toContain('const __reference_ui_cva = cva;')
  expect(content).toContain('__reference_ui_css({')
  expect(content).toContain('__reference_ui_cva({')
}

function expectArtifactTransform(content: string): void {
  expect(content).toContain(SYSTEM_CVA_IMPORT)
  expect(content).toContain(SYSTEM_CSS_IMPORT)
  expect(content).not.toContain('__reference_ui_css')
  expect(content).not.toContain('__reference_ui_cva')
  expect(content).toContain('css({')
  expect(content).toContain('cva({')
}

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-transform-integration-'))
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('virtual transforms integration', () => {
  it('rewrites and neutralizes normal virtual source files but preserves Panda-visible calls in __reference__ui bundles', async () => {
    const root = createTempDir()
    const srcDir = join(root, 'src')
    mkdirSync(srcDir, { recursive: true })

    const { stylesPath } = writeTransformFixture(srcDir)
    const sourceContent = await readFileText(stylesPath)
    const transformedSource = await applyTransforms({
      sourcePath: stylesPath,
      relativePath: 'src/styles.ts',
      content: sourceContent,
    })

    expectNeutralizedSource(transformedSource.content)

    const bundled = await microBundle(stylesPath, {
      format: 'esm',
      external: ['@reference-ui/react', 'react', 'react/jsx-runtime', 'react-dom'],
    })

    const transformedBundle = await applyTransforms({
      sourcePath: join(root, '.reference-ui', 'virtual', '__reference__ui', 'src', 'styles.js'),
      relativePath: '__reference__ui/src/styles.js',
      content: bundled,
    })

    expectArtifactTransform(transformedBundle.content)
  })
})
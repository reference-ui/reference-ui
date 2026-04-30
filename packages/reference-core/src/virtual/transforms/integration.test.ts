import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { microBundle } from '../../lib/microbundle'
import { applyTransforms } from './index'

const createdDirs: string[] = []

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

    const constantsPath = join(srcDir, 'constants.ts')
    const stylesPath = join(srcDir, 'styles.ts')

    writeFileSync(constantsPath, "export const constants = { nested: '12px' } as const\n")
    writeFileSync(
      stylesPath,
      [
        "import { css, recipe } from '@reference-ui/react'",
        "import { constants } from './constants'",
        'export const card = css({',
        "  '& [data-slot=inner]': { marginTop: constants.nested },",
        '})',
        'export const button = recipe({',
        '  base: { color: \'red\' },',
        '})',
      ].join('\n') + '\n'
    )

    const sourceContent = await import('node:fs/promises').then(fs => fs.readFile(stylesPath, 'utf-8'))
    const transformedSource = await applyTransforms({
      sourcePath: stylesPath,
      relativePath: 'src/styles.ts',
      content: sourceContent,
    })

    expect(transformedSource.content).toContain("import { cva } from 'src/system/css';")
    expect(transformedSource.content).toContain("import { css } from 'src/system/css';")
    expect(transformedSource.content).toContain('const __reference_ui_css = css;')
    expect(transformedSource.content).toContain('const __reference_ui_cva = cva;')
    expect(transformedSource.content).toContain('__reference_ui_css({')
    expect(transformedSource.content).toContain('__reference_ui_cva({')

    const bundled = await microBundle(stylesPath, {
      format: 'esm',
      external: ['@reference-ui/react', 'react', 'react/jsx-runtime', 'react-dom'],
    })

    const transformedBundle = await applyTransforms({
      sourcePath: join(root, '.reference-ui', 'virtual', '__reference__ui', 'src', 'styles.js'),
      relativePath: '__reference__ui/src/styles.js',
      content: bundled,
    })

    expect(transformedBundle.content).toContain("import { cva } from 'src/system/css';")
    expect(transformedBundle.content).toContain("import { css } from 'src/system/css';")
    expect(transformedBundle.content).not.toContain('__reference_ui_css')
    expect(transformedBundle.content).not.toContain('__reference_ui_cva')
    expect(transformedBundle.content).toContain('css({')
    expect(transformedBundle.content).toContain('cva({')
  })
})
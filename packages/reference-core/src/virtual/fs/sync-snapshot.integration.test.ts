import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { syncVirtualSnapshot } from './sync-snapshot'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-sync-snapshot-integration-'))
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('virtual/fs/sync-snapshot integration', () => {
  it('writes neutralized user virtual files and Panda-visible transformed __reference__ui bundles', async () => {
    const root = createTempDir()
    const srcDir = join(root, 'src')
    mkdirSync(srcDir, { recursive: true })

    writeFileSync(join(srcDir, 'constants.ts'), "export const constants = { nested: '12px' } as const\n")
    writeFileSync(
      join(srcDir, 'styles.ts'),
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

    await syncVirtualSnapshot({
      sourceDir: root,
      config: {
        include: ['src/**/*.{ts,tsx}'],
        debug: false,
      } as never,
    })

    const virtualSourcePath = join(root, '.reference-ui', 'virtual', 'src', 'styles.ts')
    const artifactPath = join(root, '.reference-ui', 'virtual', '__reference__ui', 'src', 'styles.js')

    expect(existsSync(virtualSourcePath)).toBe(true)
    expect(existsSync(artifactPath)).toBe(true)

    const virtualSource = readFileSync(virtualSourcePath, 'utf-8')
    const artifact = readFileSync(artifactPath, 'utf-8')

    expect(virtualSource).toContain("import { css } from 'src/system/css';")
    expect(virtualSource).toContain("import { cva } from 'src/system/css';")
    expect(virtualSource).toContain('const __reference_ui_css = css;')
    expect(virtualSource).toContain('const __reference_ui_cva = cva;')
    expect(virtualSource).toContain('__reference_ui_css({')
    expect(virtualSource).toContain('__reference_ui_cva({')

    expect(artifact).toContain("import { css } from 'src/system/css';")
    expect(artifact).toContain('css({')
    expect(artifact).not.toContain('__reference_ui_css')
  })
})
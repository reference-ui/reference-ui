import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPortableStylesheetFromContent } from './transform/createPortableStylesheetFromContent'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-create-portable-stylesheet-'))
  createdDirs.push(dir)
  return dir
}

async function importCreatePortableStylesheetModule() {
  const debug = vi.fn()

  vi.doMock('../../lib/log', () => ({
    log: { debug },
  }))

  const mod = await import('./createPortableStylesheet')
  return { ...mod, debug }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../lib/log')
  vi.restoreAllMocks()
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('system/stylesheet/createPortableStylesheet', () => {
  it('logs and returns undefined when the stylesheet is missing', async () => {
    const tempDir = createTempDir()
    const missingPath = resolve(tempDir, 'styled', 'styles.css')
    const { createPortableStylesheet, debug } = await importCreatePortableStylesheetModule()

    expect(createPortableStylesheet(missingPath, 'missing-layer')).toBeUndefined()
    expect(debug).toHaveBeenCalledWith(
      'css',
      `styles not found at ${missingPath}, skipping portable stylesheet`,
    )
  })

  it('reads the stylesheet and returns transformed portable css', async () => {
    const tempDir = createTempDir()
    const styledDir = resolve(tempDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const rawCss = '@layer base, tokens;\n@layer tokens { :where(:root, :host) { --color: red; } }'

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, rawCss, 'utf-8')

    const { createPortableStylesheet } = await importCreatePortableStylesheetModule()
    const result = createPortableStylesheet(stylesPath, 'local-system')

    expect(result).toBe(createPortableStylesheetFromContent(rawCss, 'local-system'))
    expect(readFileSync(stylesPath, 'utf-8')).toBe(rawCss)
  })
})

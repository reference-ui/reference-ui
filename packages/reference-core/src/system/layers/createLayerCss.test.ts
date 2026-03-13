import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLayerCssFromContent } from './transform'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-create-layer-css-'))
  createdDirs.push(dir)
  return dir
}

async function importCreateLayerCssModule() {
  const debug = vi.fn()

  vi.doMock('../../lib/log', () => ({
    log: { debug },
  }))

  const mod = await import('./createLayerCss')
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

describe('system/layers/createLayerCss', () => {
  it('logs and returns undefined when the stylesheet is missing', async () => {
    const tempDir = createTempDir()
    const missingPath = resolve(tempDir, 'styled', 'styles.css')
    const { createLayerCss, debug } = await importCreateLayerCssModule()

    expect(createLayerCss(missingPath, 'missing-layer')).toBeUndefined()
    expect(debug).toHaveBeenCalledWith(
      'layers',
      `styles not found at ${missingPath}, skipping layer CSS`
    )
  })

  it('reads the stylesheet and returns transformed layer css', async () => {
    const tempDir = createTempDir()
    const styledDir = resolve(tempDir, 'styled')
    const stylesPath = resolve(styledDir, 'styles.css')
    const rawCss = '@layer base, tokens;\n@layer tokens { :where(:root, :host) { --color: red; } }'

    mkdirSync(styledDir, { recursive: true })
    writeFileSync(stylesPath, rawCss, 'utf-8')

    const { createLayerCss } = await importCreateLayerCssModule()
    const result = createLayerCss(stylesPath, 'local-system')

    expect(result).toBe(createLayerCssFromContent(rawCss, 'local-system'))
    expect(readFileSync(stylesPath, 'utf-8')).toBe(rawCss)
  })
})

import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUT_DIR } from '../../../../../constants'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-panda-bundle-'))
  createdDirs.push(dir)
  return dir
}

async function importBundleModule() {
  vi.resetModules()

  const microBundle = vi.fn(async (entryPath: string) => `// bundled from ${entryPath}`)

  vi.doMock('../../../../../lib/microbundle', () => ({
    microBundle,
  }))

  const mod = await import('./bundle')
  return { ...mod, microBundle }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../../../../lib/microbundle')
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('system/panda/config/extensions/api/bundle', () => {
  it('computes bundle output paths under styled/extensions', async () => {
    const { getPandaExtensionsDir, getPandaExtensionsBundlePath } = await importBundleModule()

    expect(getPandaExtensionsDir(`/workspace/${DEFAULT_OUT_DIR}/styled`)).toBe(
      `/workspace/${DEFAULT_OUT_DIR}/styled/extensions`
    )
    expect(getPandaExtensionsBundlePath(`/workspace/${DEFAULT_OUT_DIR}/styled`)).toBe(
      `/workspace/${DEFAULT_OUT_DIR}/styled/extensions/index.mjs`
    )
  })

  it('writes the bundled extensions runtime into the styled extensions directory', async () => {
    const tempDir = createTempDir()
    const cliDir = resolve(tempDir, 'core')
    const styledDir = resolve(tempDir, 'styled')

    const { writePandaExtensionsBundle, microBundle } = await importBundleModule()

    const outputPath = await writePandaExtensionsBundle(cliDir, styledDir)

    expect(microBundle).toHaveBeenCalledWith(
      resolve(cliDir, 'src/system/panda/config/extensions/index.ts')
    )
    expect(outputPath).toBe(resolve(styledDir, 'extensions', 'index.mjs'))
    expect(readFileSync(outputPath, 'utf-8')).toContain(
      `// bundled from ${resolve(cliDir, 'src/system/panda/config/extensions/index.ts')}`
    )
  })

  it('mirrors the extensions bundle into outDir/styled/extensions', async () => {
    const tempDir = createTempDir()
    const cliStyledDir = resolve(tempDir, 'core-styled')
    const outDir = resolve(tempDir, DEFAULT_OUT_DIR)
    const sourceExtensionsDir = resolve(cliStyledDir, 'extensions')
    const sourceBundlePath = resolve(sourceExtensionsDir, 'index.mjs')

    mkdirSync(sourceExtensionsDir, { recursive: true })
    writeFileSync(sourceBundlePath, 'export const extensions = true\n', 'utf-8')

    const { mirrorPandaExtensionsBundle } = await importBundleModule()

    const mirroredPath = mirrorPandaExtensionsBundle(cliStyledDir, outDir)

    expect(mirroredPath).toBe(resolve(outDir, 'styled', 'extensions', 'index.mjs'))
    expect(existsSync(mirroredPath)).toBe(true)
    expect(readFileSync(mirroredPath, 'utf-8')).toBe('export const extensions = true\n')
  })

  it('resolves the built-in internal pattern extension files', async () => {
    const { resolveInternalPatternFiles } = await importBundleModule()

    expect(resolveInternalPatternFiles('/workspace/core')).toEqual([
      '/workspace/core/src/system/panda/config/extensions/container/container.ts',
      '/workspace/core/src/system/panda/config/extensions/size/size.ts',
    ])
  })
})

import { mkdtempSync, lstatSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PackageDefinition } from './package'

const createdDirs: string[] = []

const REACT_PACKAGE: PackageDefinition = {
  name: '@reference-ui/react',
  version: '0.0.0-test',
  description: 'react test package',
  bundle: true,
  main: './react.mjs',
  types: './react.d.mts',
  exports: {
    '.': {
      import: './react.mjs',
      types: './react.d.mts',
    },
  },
  postprocess: ['injectLayerName'],
}

const SYSTEM_PACKAGE: PackageDefinition = {
  name: '@reference-ui/system',
  version: '0.0.0-test',
  description: 'system test package',
  bundle: true,
  main: './system.mjs',
  types: './system.d.mts',
  exports: {
    '.': {
      import: './system.mjs',
      types: './system.d.mts',
    },
  },
}

const TYPES_PACKAGE: PackageDefinition = {
  name: '@reference-ui/types',
  version: '0.0.0-test',
  description: 'types test package',
  bundle: false,
  main: './manifest.js',
  types: './manifest.d.ts',
  exports: {
    '.': {
      import: './manifest.js',
      types: './manifest.d.ts',
    },
  },
}

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-packager-'))
  createdDirs.push(dir)
  return dir
}

async function importInstallModule(options?: {
  config?: { name?: string; skipTypescript?: boolean }
  outDirPath?: string
  bundleImpl?: (args: {
    coreDir: string
    outDir: string
    targetDir: string
    pkg: PackageDefinition
  }) => Promise<void> | void
}) {
  vi.resetModules()

  const debug = vi.fn()
  const bundlePackage = vi.fn(async (args) => {
    await options?.bundleImpl?.(args)
  })

  vi.doMock('../lib/log', () => ({
    log: {
      debug,
    },
  }))
  vi.doMock('../config', () => ({
    getConfig: () => options?.config ?? { name: 'test-layer' },
  }))
  vi.doMock('../lib/paths', () => ({
    getOutDirPath: () => options?.outDirPath ?? '/tmp/reference-ui-out',
  }))
  vi.doMock('./bundler', () => ({
    bundlePackage,
  }))

  const mod = await import('./install')
  return { ...mod, bundlePackage, debug }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/log')
  vi.doUnmock('../config')
  vi.doUnmock('../lib/paths')
  vi.doUnmock('./bundler')
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('packager/install', () => {
  it('injects config.name into the React bundle and links it into node_modules', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')
    const targetDir = resolve(outDir, 'react')
    const linkPath = resolve(nodeModulesScope, 'react')

    const { installPackage } = await importInstallModule({
      config: { name: 'brand-layer' },
      bundleImpl: async ({ targetDir: dir, pkg }) => {
        mkdirSync(dir, { recursive: true })
        writeFileSync(
          resolve(dir, pkg.main?.replace('./', '') || 'index.js'),
          'export const layer = "__REFERENCE_UI_LAYER_NAME__"\n'
        )
      },
    })

    await installPackage('/core', outDir, nodeModulesScope, REACT_PACKAGE)

    expect(readFileSync(resolve(targetDir, 'react.mjs'), 'utf-8')).toContain('brand-layer')
    expect(readFileSync(resolve(targetDir, 'react.mjs'), 'utf-8')).not.toContain(
      '__REFERENCE_UI_LAYER_NAME__'
    )
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true)
    expect(realpathSync(linkPath)).toBe(realpathSync(targetDir))
  })

  it('does not mutate non-React package bundles', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')
    const targetDir = resolve(outDir, 'system')

    const { installPackage } = await importInstallModule({
      config: { name: 'brand-layer' },
      bundleImpl: async ({ targetDir: dir, pkg }) => {
        mkdirSync(dir, { recursive: true })
        writeFileSync(
          resolve(dir, pkg.main?.replace('./', '') || 'index.js'),
          'export const untouched = "__REFERENCE_UI_LAYER_NAME__"\n'
        )
      },
    })

    await installPackage('/core', outDir, nodeModulesScope, SYSTEM_PACKAGE)

    expect(readFileSync(resolve(targetDir, 'system.mjs'), 'utf-8')).toContain(
      '__REFERENCE_UI_LAYER_NAME__'
    )
  })

  it('is safe to rerun installPackage for the same package', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')
    const targetDir = resolve(outDir, 'react')
    const linkPath = resolve(nodeModulesScope, 'react')

    const { installPackage } = await importInstallModule({
      config: { name: 'brand-layer' },
      bundleImpl: async ({ targetDir: dir, pkg }) => {
        mkdirSync(dir, { recursive: true })
        writeFileSync(
          resolve(dir, pkg.main?.replace('./', '') || 'index.js'),
          'export const layer = "__REFERENCE_UI_LAYER_NAME__"\n'
        )
      },
    })

    await installPackage('/core', outDir, nodeModulesScope, REACT_PACKAGE)
    await installPackage('/core', outDir, nodeModulesScope, REACT_PACKAGE)

    expect(readFileSync(resolve(targetDir, 'react.mjs'), 'utf-8')).toContain('brand-layer')
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true)
    expect(realpathSync(linkPath)).toBe(realpathSync(targetDir))
  })

  it('installs packages into the configured outDir structure', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.generated-reference-ui')

    const { installPackages } = await importInstallModule({
      outDirPath: outDir,
      bundleImpl: async ({ targetDir: dir, pkg }) => {
        mkdirSync(dir, { recursive: true })
        writeFileSync(resolve(dir, pkg.main?.replace('./', '') || 'index.js'), `// ${pkg.name}\n`)
      },
    })

    await installPackages('/core', workspaceDir, [REACT_PACKAGE, SYSTEM_PACKAGE])

    expect(readFileSync(resolve(outDir, 'react', 'react.mjs'), 'utf-8')).toContain(
      '@reference-ui/react'
    )
    expect(readFileSync(resolve(outDir, 'system', 'system.mjs'), 'utf-8')).toContain(
      '@reference-ui/system'
    )
    expect(lstatSync(resolve(workspaceDir, 'node_modules', '@reference-ui', 'react')).isSymbolicLink()).toBe(
      true
    )
    expect(
      lstatSync(resolve(workspaceDir, 'node_modules', '@reference-ui', 'system')).isSymbolicLink()
    ).toBe(true)
  })

  it('links non-bundled generated packages like @reference-ui/types', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')
    const targetDir = resolve(outDir, 'types')
    const linkPath = resolve(nodeModulesScope, 'types')

    const { installPackage } = await importInstallModule({
      bundleImpl: async ({ targetDir: dir, pkg }) => {
        mkdirSync(dir, { recursive: true })
        writeFileSync(resolve(dir, pkg.main?.replace('./', '') || 'index.js'), 'export default {}\n')
        writeFileSync(resolve(dir, pkg.types?.replace('./', '') || 'index.d.ts'), 'export default {}\n')
      },
    })

    await installPackage('/core', outDir, nodeModulesScope, TYPES_PACKAGE)

    expect(readFileSync(resolve(targetDir, 'manifest.js'), 'utf-8')).toContain('export default')
    expect(readFileSync(resolve(targetDir, 'manifest.d.ts'), 'utf-8')).toContain('export default')
    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true)
    expect(realpathSync(linkPath)).toBe(realpathSync(targetDir))
  })

  it('fails loudly when bundling fails before linking', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')

    const { installPackage } = await importInstallModule({
      bundleImpl: async () => {
        throw new Error('missing bundle output')
      },
    })

    await expect(installPackage('/core', outDir, nodeModulesScope, REACT_PACKAGE)).rejects.toThrow(
      'missing bundle output'
    )
  })
})

import { createHash } from 'node:crypto'
import {
  mkdtempSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUT_DIR } from '../constants'
import type { PackageDefinition } from './package'

const createdDirs: string[] = []

function expectedGeneratedVersion(userProjectDir: string, pkg: PackageDefinition): string {
  const hash = createHash('sha256')
    .update(userProjectDir)
    .update('\0')
    .update(pkg.name)
    .digest('hex')
    .slice(0, 8)

  return `${pkg.version}-${hash}`
}

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
  bundle: true,
  main: './types.mjs',
  types: './types.d.mts',
  exports: {
    '.': {
      import: './types.mjs',
      types: './types.d.mts',
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
    const outDir = resolve(workspaceDir, DEFAULT_OUT_DIR)
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')
    const targetDir = resolve(outDir, 'react')
    const installPath = resolve(nodeModulesScope, 'react')

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

    await installPackage('/core', workspaceDir, outDir, nodeModulesScope, REACT_PACKAGE)

    expect(readFileSync(resolve(targetDir, 'react.mjs'), 'utf-8')).toContain('brand-layer')
    expect(readFileSync(resolve(targetDir, 'react.mjs'), 'utf-8')).not.toContain(
      '__REFERENCE_UI_LAYER_NAME__'
    )
    expect(lstatSync(installPath).isSymbolicLink()).toBe(true)
    expect(realpathSync(installPath)).toBe(realpathSync(targetDir))
    expect(readFileSync(resolve(installPath, 'react.mjs'), 'utf-8')).toContain('brand-layer')
  })

  it('does not mutate non-React package bundles', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, DEFAULT_OUT_DIR)
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

    await installPackage('/core', workspaceDir, outDir, nodeModulesScope, SYSTEM_PACKAGE)

    expect(readFileSync(resolve(targetDir, 'system.mjs'), 'utf-8')).toContain(
      '__REFERENCE_UI_LAYER_NAME__'
    )
  })

  it('is safe to rerun installPackage for the same package', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, DEFAULT_OUT_DIR)
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')
    const targetDir = resolve(outDir, 'react')
    const installPath = resolve(nodeModulesScope, 'react')

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

    await installPackage('/core', workspaceDir, outDir, nodeModulesScope, REACT_PACKAGE)
    await installPackage('/core', workspaceDir, outDir, nodeModulesScope, REACT_PACKAGE)

    expect(readFileSync(resolve(targetDir, 'react.mjs'), 'utf-8')).toContain('brand-layer')
    expect(lstatSync(installPath).isSymbolicLink()).toBe(true)
    expect(realpathSync(installPath)).toBe(realpathSync(targetDir))
  })

  it('replaces an existing copied package with a symlink in dev mode', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, DEFAULT_OUT_DIR)
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')
    const targetDir = resolve(outDir, 'react')
    const installPath = resolve(nodeModulesScope, 'react')

    mkdirSync(installPath, { recursive: true })
    writeFileSync(resolve(installPath, 'stale.txt'), 'stale copy\n')

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

    await installPackage('/core', workspaceDir, outDir, nodeModulesScope, REACT_PACKAGE)

    expect(lstatSync(installPath).isSymbolicLink()).toBe(true)
    expect(realpathSync(installPath)).toBe(realpathSync(targetDir))
    expect(() => readFileSync(resolve(installPath, 'stale.txt'), 'utf-8')).toThrow()
  })

  it('copies packages into node_modules in build mode', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, DEFAULT_OUT_DIR)
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')
    const targetDir = resolve(outDir, 'react')
    const installPath = resolve(nodeModulesScope, 'react')
    const previousTargetDir = resolve(outDir, 'previous-react')

    mkdirSync(previousTargetDir, { recursive: true })
    writeFileSync(resolve(previousTargetDir, 'react.mjs'), 'export const previous = true\n')
    mkdirSync(nodeModulesScope, { recursive: true })
    symlinkSync(previousTargetDir, installPath)

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

    await installPackage('/core', workspaceDir, outDir, nodeModulesScope, REACT_PACKAGE, 'build')

    expect(lstatSync(installPath).isSymbolicLink()).toBe(false)
    expect(readFileSync(resolve(installPath, 'react.mjs'), 'utf-8')).toContain('brand-layer')
    expect(readFileSync(resolve(targetDir, 'react.mjs'), 'utf-8')).toContain('brand-layer')
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

  it('removes broken symlinks under node_modules/@reference-ui after install', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.generated-reference-ui')
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')
    mkdirSync(nodeModulesScope, { recursive: true })
    symlinkSync(
      resolve(workspaceDir, DEFAULT_OUT_DIR, 'removed-package'),
      resolve(nodeModulesScope, 'reference'),
    )

    expect(lstatSync(resolve(nodeModulesScope, 'reference')).isSymbolicLink()).toBe(true)

    const { installPackages } = await importInstallModule({
      outDirPath: outDir,
      bundleImpl: async ({ targetDir: dir, pkg }) => {
        mkdirSync(dir, { recursive: true })
        writeFileSync(resolve(dir, pkg.main?.replace('./', '') || 'index.js'), `// ${pkg.name}\n`)
      },
    })

    await installPackages('/core', workspaceDir, [REACT_PACKAGE])

    expect(() => lstatSync(resolve(nodeModulesScope, 'reference'))).toThrow()
    expect(lstatSync(resolve(nodeModulesScope, 'react')).isSymbolicLink()).toBe(true)
  })

  it('links generated runtime packages like @reference-ui/types', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, DEFAULT_OUT_DIR)
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')
    const targetDir = resolve(outDir, 'types')
    const installPath = resolve(nodeModulesScope, 'types')

    const { installPackage } = await importInstallModule({
      bundleImpl: async ({ targetDir: dir, pkg }) => {
        mkdirSync(dir, { recursive: true })
        const mainPath = resolve(dir, pkg.main?.replace('./', '') || 'index.js')
        const typesPath = resolve(dir, pkg.types?.replace('./', '') || 'index.d.ts')
        mkdirSync(dirname(mainPath), { recursive: true })
        mkdirSync(dirname(typesPath), { recursive: true })
        writeFileSync(mainPath, 'export const Reference = () => null\n')
        writeFileSync(typesPath, 'export declare const Reference: () => null\n')
      },
    })

    await installPackage('/core', workspaceDir, outDir, nodeModulesScope, TYPES_PACKAGE)

    expect(readFileSync(resolve(targetDir, 'types.mjs'), 'utf-8')).toContain('Reference')
    expect(readFileSync(resolve(targetDir, 'types.d.mts'), 'utf-8')).toContain('Reference')
    expect(lstatSync(installPath).isSymbolicLink()).toBe(true)
    expect(realpathSync(installPath)).toBe(realpathSync(targetDir))
  })

  it('fails loudly when bundling fails before linking', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, DEFAULT_OUT_DIR)
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')

    const { installPackage } = await importInstallModule({
      bundleImpl: async () => {
        throw new Error('missing bundle output')
      },
    })

    await expect(
      installPackage('/core', workspaceDir, outDir, nodeModulesScope, REACT_PACKAGE)
    ).rejects.toThrow(
      'missing bundle output'
    )
  })

  it('rewrites generated package versions per project before bundling', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, DEFAULT_OUT_DIR)
    const nodeModulesScope = resolve(workspaceDir, 'node_modules', '@reference-ui')

    const { installPackage, bundlePackage } = await importInstallModule({
      bundleImpl: async ({ targetDir: dir, pkg }) => {
        mkdirSync(dir, { recursive: true })
        writeFileSync(resolve(dir, pkg.main?.replace('./', '') || 'index.js'), `// ${pkg.version}\n`)
      },
    })

    await installPackage('/core', workspaceDir, outDir, nodeModulesScope, REACT_PACKAGE)

    expect(bundlePackage).toHaveBeenCalledWith({
      coreDir: '/core',
      outDir,
      targetDir: resolve(outDir, 'react'),
      pkg: expect.objectContaining({
        name: REACT_PACKAGE.name,
        version: expectedGeneratedVersion(workspaceDir, REACT_PACKAGE),
      }),
    })
  })
})

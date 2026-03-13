import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PackageDefinition } from '../package'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-bundler-'))
  createdDirs.push(dir)
  return dir
}

async function importBundlerModule(options?: {
  bundleImpl?: (coreDir: string, targetDir: string, entryPath: string, outfile: string) => Promise<void> | void
}) {
  vi.resetModules()

  const bundleWithEsbuild = vi.fn(async (...args: [string, string, string, string]) => {
    await options?.bundleImpl?.(...args)
  })

  vi.doMock('./esbuild', () => ({
    bundleWithEsbuild,
  }))

  const mod = await import('./index')
  return { ...mod, bundleWithEsbuild }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./esbuild')
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('packager/bundler', () => {
  it('delegates bundled entries to esbuild and still writes package.json', async () => {
    const workspaceDir = createTempDir()
    const coreDir = resolve(workspaceDir, 'core')
    const outDir = resolve(workspaceDir, '.reference-ui')
    const targetDir = resolve(outDir, 'system')
    const entryPath = 'src/entry/system.ts'

    mkdirSync(resolve(coreDir, 'src/entry'), { recursive: true })
    writeFileSync(resolve(coreDir, entryPath), 'export const system = true\n')

    const pkg: PackageDefinition = {
      name: '@reference-ui/system',
      version: '0.0.0-test',
      description: 'system test package',
      entry: entryPath,
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

    const { bundlePackage, bundleWithEsbuild } = await importBundlerModule({
      bundleImpl: async (_coreDir, dir, _entryPath, outfile) => {
        writeFileSync(resolve(dir, outfile), 'export const bundled = true\n')
      },
    })

    await bundlePackage({ coreDir, outDir, targetDir, pkg })

    expect(bundleWithEsbuild).toHaveBeenCalledWith(coreDir, targetDir, entryPath, 'system.mjs')
    expect(JSON.parse(readFileSync(resolve(targetDir, 'package.json'), 'utf-8'))).toMatchObject({
      name: '@reference-ui/system',
      main: './system.mjs',
      types: './system.d.mts',
    })
  })

  it('copies package assets from outDir and writes metadata for non-bundled packages', async () => {
    const workspaceDir = createTempDir()
    const coreDir = resolve(workspaceDir, 'core')
    const outDir = resolve(workspaceDir, '.reference-ui')
    const targetDir = resolve(outDir, 'react')

    mkdirSync(resolve(outDir, 'styled'), { recursive: true })
    writeFileSync(resolve(outDir, 'styled/styles.css'), '.root { color: red; }\n')

    const pkg: PackageDefinition = {
      name: '@reference-ui/react',
      version: '0.0.0-test',
      description: 'react test package',
      bundle: false,
      main: './react.mjs',
      types: './react.d.mts',
      exports: {
        '.': {
          import: './react.mjs',
          types: './react.d.mts',
        },
      },
      copyFrom: [
        {
          kind: 'file',
          from: 'outDir',
          src: 'styled/styles.css',
          dest: 'styles.css',
        },
      ],
    }

    const { bundlePackage } = await importBundlerModule()

    await bundlePackage({ coreDir, outDir, targetDir, pkg })

    expect(readFileSync(resolve(targetDir, 'styles.css'), 'utf-8')).toBe('.root { color: red; }\n')
    expect(JSON.parse(readFileSync(resolve(targetDir, 'package.json'), 'utf-8'))).toMatchObject({
      name: '@reference-ui/react',
      main: './react.mjs',
      types: './react.d.mts',
    })
  })
})

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

function writeTastyTypesFixture(coreDir: string, targetDir: string): void {
  mkdirSync(resolve(targetDir, 'tasty', 'chunks'), { recursive: true })
  writeFileSync(
    resolve(targetDir, 'tasty', 'manifest.js'),
    'export const manifest = { version: "1" }\nexport default manifest\n'
  )
  writeFileSync(
    resolve(targetDir, 'tasty', 'runtime.js'),
    'export const manifestUrl = new URL("./manifest.js", import.meta.url).href\n'
  )
  writeFileSync(resolve(targetDir, 'tasty', 'chunks/example.js'), 'export default {}\n')
  writeFileSync(
    resolve(targetDir, 'tasty', 'manifest.d.ts'),
    'declare const manifest: { version: string }\nexport default manifest\n'
  )
  writeFileSync(
    resolve(targetDir, 'tasty', 'runtime.d.ts'),
    'export declare const manifestUrl: string\n'
  )
  mkdirSync(resolve(coreDir, 'src/entry'), { recursive: true })
  writeFileSync(
    resolve(coreDir, 'src/entry/types.ts'),
    'export { Reference } from "../reference/browser/component"\n'
  )
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

  it('bundles the @reference-ui/types entry while preserving generated Tasty artifacts', async () => {
    const workspaceDir = createTempDir()
    const coreDir = resolve(workspaceDir, 'core')
    const outDir = resolve(workspaceDir, '.reference-ui')
    const targetDir = resolve(outDir, 'types')

    writeTastyTypesFixture(coreDir, targetDir)

    const pkg: PackageDefinition = {
      name: '@reference-ui/types',
      version: '0.0.0-test',
      description: 'types test package',
      entry: 'src/entry/types.ts',
      bundle: true,
      main: './types.mjs',
      types: './types.d.mts',
      exports: {
        '.': {
          import: './types.mjs',
          types: './types.d.mts',
        },
        './manifest': {
          import: './tasty/manifest.js',
          types: './tasty/manifest.d.ts',
        },
        './runtime': {
          import: './tasty/runtime.js',
          types: './tasty/runtime.d.ts',
        },
      },
      postprocess: ['rewriteTypesRuntimeImport'],
    }

    const { bundlePackage, bundleWithEsbuild } = await importBundlerModule({
      bundleImpl: async (_coreDir, dir, _entryPath, outfile) => {
        writeFileSync(
          resolve(dir, outfile),
          'export const loadRuntime = () => import("__REFERENCE_UI_TYPES_RUNTIME__")\n'
        )
      },
    })

    await bundlePackage({ coreDir, outDir, targetDir, pkg })

    expect(bundleWithEsbuild).toHaveBeenCalledWith(coreDir, targetDir, 'src/entry/types.ts', 'types.mjs')
    expect(readFileSync(resolve(targetDir, 'types.mjs'), 'utf-8')).toContain(
      '__REFERENCE_UI_TYPES_RUNTIME__'
    )
    expect(readFileSync(resolve(targetDir, 'tasty', 'manifest.js'), 'utf-8')).toContain('export const manifest')
    expect(readFileSync(resolve(targetDir, 'tasty', 'chunks/example.js'), 'utf-8')).toContain('export default')
    expect(readFileSync(resolve(targetDir, 'tasty', 'manifest.d.ts'), 'utf-8')).toContain('declare const manifest')
    expect(readFileSync(resolve(targetDir, 'tasty', 'runtime.js'), 'utf-8')).toContain('manifestUrl')
    expect(readFileSync(resolve(targetDir, 'tasty', 'runtime.d.ts'), 'utf-8')).toContain('manifestUrl')
    expect(JSON.parse(readFileSync(resolve(targetDir, 'package.json'), 'utf-8'))).toMatchObject({
      name: '@reference-ui/types',
      main: './types.mjs',
      types: './types.d.mts',
    })
  })
})

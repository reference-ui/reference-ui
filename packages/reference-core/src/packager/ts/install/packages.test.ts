import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TsPackageInput } from '../types'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-packager-ts-'))
  createdDirs.push(dir)
  return dir
}

async function importInstallPackagesTsModule(options: {
  outDir: string
  cliDir?: string
  cliDirForBuild?: string
}) {
  vi.resetModules()

  const installPackageTs = vi.fn().mockResolvedValue(undefined)
  const writeGeneratedSystemTypes = vi.fn().mockResolvedValue(undefined)
  const writeGeneratedReactTypes = vi.fn().mockResolvedValue(undefined)

  vi.doMock('../../../lib/paths', () => ({
    resolveCorePackageDir: () => options.cliDir ?? '/workspace/core',
    resolveCorePackageDirForBuild: () => options.cliDirForBuild ?? '/workspace/core-build',
  }))
  vi.doMock('../../../lib/paths/out-dir', () => ({
    getOutDirPath: () => options.outDir,
  }))
  vi.doMock('./package', () => ({
    installPackageTs,
  }))
  vi.doMock('../../../system/types/generate', () => ({
    writeGeneratedSystemTypes,
    writeGeneratedReactTypes,
  }))

  const mod = await import('./packages')
  return { ...mod, installPackageTs, writeGeneratedSystemTypes, writeGeneratedReactTypes }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../../lib/paths')
  vi.doUnmock('../../../lib/paths/out-dir')
  vi.doUnmock('./package')
  vi.doUnmock('../../../system/types/generate')
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('packager/ts/install/packages', () => {
  it('installs declaration packages into the expected target dirs and writes generated entry types', async () => {
    const workspaceDir = createTempDir()
    const outDir = resolve(workspaceDir, '.reference-ui')
    const packages: TsPackageInput[] = [
      {
        name: '@reference-ui/react',
        sourceEntry: 'src/entry/react.ts',
        outFile: 'react.mjs',
      },
      {
        name: '@reference-ui/system',
        sourceEntry: 'src/entry/system.ts',
        outFile: 'system.mjs',
      },
    ]

    const {
      installPackagesTs,
      installPackageTs,
      writeGeneratedReactTypes,
      writeGeneratedSystemTypes,
    } = await importInstallPackagesTsModule({ outDir })

    await installPackagesTs('/workspace/app', packages)

    expect(installPackageTs).toHaveBeenNthCalledWith(
      1,
      '/workspace/core',
      '/workspace/core-build',
      resolve(outDir, 'react'),
      packages[0]
    )
    expect(installPackageTs).toHaveBeenNthCalledWith(
      2,
      '/workspace/core',
      '/workspace/core-build',
      resolve(outDir, 'system'),
      packages[1]
    )
    expect(writeGeneratedSystemTypes).toHaveBeenCalledWith(
      '/workspace/app',
      resolve(outDir, 'system', 'system.d.mts')
    )
    expect(writeGeneratedReactTypes).toHaveBeenCalledWith(
      '/workspace/app',
      resolve(outDir, 'react', 'react.d.mts')
    )
  })
})

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-packager-ts-compile-'))
  createdDirs.push(dir)
  return dir
}

async function importCompileModule(options?: {
  buildImpl?: (config: Record<string, unknown>) => Promise<void>
}) {
  vi.resetModules()

  const build = vi.fn(options?.buildImpl ?? vi.fn().mockResolvedValue(undefined))
  const createTempTsconfig = vi.fn(({ tempDir }: { tempDir: string }) => {
    const tsconfigPath = join(tempDir, 'tsconfig.ref-ui-dts.json')
    writeFileSync(tsconfigPath, '{}', 'utf-8')
    return tsconfigPath
  })

  vi.doMock('tsdown', () => ({
    build,
  }))
  vi.doMock('./create-temp-tsconfig', () => ({
    createTempTsconfig,
  }))

  const mod = await import('./index')
  return { ...mod, build, createTempTsconfig }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('tsdown')
  vi.doUnmock('./create-temp-tsconfig')
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('packager/ts/compile', () => {
  it('builds declarations with tsdown and copies the emitted declaration file', async () => {
    const cliDir = createTempDir()
    const projectCwd = createTempDir()
    const targetDir = createTempDir()
    const entryFile = 'src/entry/react.ts'
    const outDtsPath = resolve(targetDir, 'react.d.mts')
    let tempDirForBuild = ''

    const { compileDeclarations, build, createTempTsconfig } = await importCompileModule({
      buildImpl: async config => {
        tempDirForBuild = config.outDir as string
        writeFileSync(
          join(tempDirForBuild, 'react.d.mts'),
          'export type X = string\n',
          'utf-8'
        )
      },
    })

    const result = await compileDeclarations(cliDir, entryFile, outDtsPath, projectCwd)

    expect(result).toBe(outDtsPath)
    expect(readFileSync(outDtsPath, 'utf-8')).toBe('export type X = string\n')
    expect(build).toHaveBeenCalledTimes(1)
    expect(createTempTsconfig).toHaveBeenCalledWith({
      cliDir,
      projectCwd,
      tempDir: tempDirForBuild,
    })
    expect(existsSync(tempDirForBuild)).toBe(false)
  })

  it('throws when tsdown does not emit a declaration file', async () => {
    const cliDir = createTempDir()
    const projectCwd = createTempDir()
    const targetDir = createTempDir()
    const outDtsPath = resolve(targetDir, 'react.d.mts')
    let tempDirForBuild = ''

    const { compileDeclarations } = await importCompileModule({
      buildImpl: async config => {
        tempDirForBuild = config.outDir as string
      },
    })

    await expect(
      compileDeclarations(cliDir, 'src/entry/react.ts', outDtsPath, projectCwd)
    ).rejects.toThrow(`tsdown did not produce .d.ts or .d.mts in ${tempDirForBuild}`)
    expect(existsSync(tempDirForBuild)).toBe(false)
  })

  it('wraps tsdown build errors', async () => {
    const cliDir = createTempDir()
    const projectCwd = createTempDir()
    const targetDir = createTempDir()
    const outDtsPath = resolve(targetDir, 'react.d.mts')

    const { compileDeclarations } = await importCompileModule({
      buildImpl: async () => {
        throw new Error('boom')
      },
    })

    await expect(
      compileDeclarations(cliDir, 'src/entry/react.ts', outDtsPath, projectCwd)
    ).rejects.toThrow('tsdown build failed for src/entry/react.ts: boom')
  })
})

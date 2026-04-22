import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-packager-ts-compile-'))
  createdDirs.push(dir)
  return dir
}

async function importCompileModule(options?: {
  buildImpl?: (config: Record<string, unknown>) => Promise<void>
  diagnosticsResult?: string
}) {
  vi.resetModules()

  const build = vi.fn(options?.buildImpl ?? vi.fn().mockResolvedValue(undefined))
  const createTempTsconfig = vi.fn(({ tempDir }: { tempDir: string }) => {
    const tsconfigPath = join(tempDir, 'tsconfig.ref-ui-dts.json')
    writeFileSync(tsconfigPath, '{}', 'utf-8')
    return tsconfigPath
  })
  const collectDeclarationDiagnostics = vi.fn(
    options?.diagnosticsResult
      ? vi.fn().mockResolvedValue(options.diagnosticsResult)
      : vi.fn().mockResolvedValue('diagnostics: direct TypeScript diagnostic run exited cleanly and reported no errors.')
  )

  vi.doMock('tsdown', () => ({
    build,
  }))
  vi.doMock('./create-temp-tsconfig', () => ({
    createTempTsconfig,
  }))
  vi.doMock('./diagnostics', () => ({
    collectDeclarationDiagnostics,
  }))

  const mod = await import('./index')
  return { ...mod, build, createTempTsconfig, collectDeclarationDiagnostics }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('tsdown')
  vi.doUnmock('./create-temp-tsconfig')
  vi.doUnmock('./diagnostics')
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
    const sourceEntryPath = resolve(cliDir, entryFile)
    mkdirSync(dirname(sourceEntryPath), { recursive: true })
    writeFileSync(sourceEntryPath, 'export type X = string\n', 'utf-8')
    const outDtsPath = resolve(targetDir, 'react.d.mts')
    let tempOutDirForBuild = ''
    let entryForBuild = ''

    const { compileDeclarations, build, createTempTsconfig } = await importCompileModule({
      buildImpl: async config => {
        tempOutDirForBuild = config.outDir as string
        entryForBuild = (config.entry as string[])[0]
        writeFileSync(
          join(tempOutDirForBuild, 'react.d.mts'),
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
      tempDir: dirname(tempOutDirForBuild),
    })
    expect(entryForBuild).toBe(entryFile)
    expect(existsSync(dirname(tempOutDirForBuild))).toBe(false)
  })

  it('throws when tsdown does not emit a declaration file', async () => {
    const cliDir = createTempDir()
    const projectCwd = createTempDir()
    const targetDir = createTempDir()
    const sourceEntryPath = resolve(cliDir, 'src/entry/react.ts')
    mkdirSync(dirname(sourceEntryPath), { recursive: true })
    writeFileSync(sourceEntryPath, 'export type X = string\n', 'utf-8')
    const outDtsPath = resolve(targetDir, 'react.d.mts')
    let tempOutDirForBuild = ''

    const { compileDeclarations, collectDeclarationDiagnostics } = await importCompileModule({
      buildImpl: async config => {
        tempOutDirForBuild = config.outDir as string
      },
      diagnosticsResult: 'diagnostics: TS2307 Cannot find module',
    })

    await expect(
      compileDeclarations(cliDir, 'src/entry/react.ts', outDtsPath, projectCwd)
    ).rejects.toThrow(/diagnostics: TS2307 Cannot find module/)
    expect(collectDeclarationDiagnostics).toHaveBeenCalledTimes(1)
    expect(existsSync(dirname(tempOutDirForBuild))).toBe(false)
  })

  it('wraps tsdown build errors', async () => {
    const cliDir = createTempDir()
    const projectCwd = createTempDir()
    const targetDir = createTempDir()
    const sourceEntryPath = resolve(cliDir, 'src/entry/react.ts')
    mkdirSync(dirname(sourceEntryPath), { recursive: true })
    writeFileSync(sourceEntryPath, 'export type X = string\n', 'utf-8')
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

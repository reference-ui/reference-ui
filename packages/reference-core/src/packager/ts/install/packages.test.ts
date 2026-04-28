import {
  readdirSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createdDirs: string[] = []

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  createdDirs.push(dir)
  return dir
}

async function importPackagesModule(options: {
  cliDir: string
  outDir: string
}) {
  vi.resetModules()
  let capturedTsconfigFiles: string[] = []
  let capturedTsconfigContents: Record<string, unknown> | undefined

  const emitDeclarationTree = (sourceDir: string, outDir: string): void => {
    for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
      const sourcePath = resolve(sourceDir, entry.name)

      if (entry.isDirectory()) {
        emitDeclarationTree(sourcePath, outDir)
        continue
      }

      if (!entry.name.match(/\.[cm]?[jt]sx?$/) || entry.name.endsWith('.d.ts')) {
        continue
      }

      const relativePath = sourcePath.slice(resolve(options.cliDir, 'src').length + 1)
      const targetPath = resolve(
        outDir,
        relativePath.replace(/\.[cm]?[jt]sx?$/, '.d.ts')
      )

      mkdirSync(dirname(targetPath), { recursive: true })
      writeFileSync(
        targetPath,
        `// emitted from ${relativePath}\n${readFileSync(sourcePath, 'utf-8')}`,
        'utf-8'
      )
    }
  }

  const spawnMonitoredAsync = vi.fn(async (_command: string, args: string[]) => {
    const projectIndex = args.indexOf('--project')
    const outDirIndex = args.indexOf('--outDir')
    if (projectIndex >= 0) {
      const tsconfigPath = args[projectIndex + 1]
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8')) as {
        files: string[]
      } & Record<string, unknown>
      capturedTsconfigFiles = tsconfig.files
      capturedTsconfigContents = tsconfig
    }
    if (outDirIndex >= 0) {
      emitDeclarationTree(resolve(options.cliDir, 'src'), args[outDirIndex + 1] ?? options.outDir)
    }

    return { code: 0, signal: null, stdout: '', stderr: '' }
  })
  const writeGeneratedSystemTypes = vi.fn(async () => {})
  const writeGeneratedReactTypes = vi.fn(async () => {})

  vi.doMock('../../../lib/child-process', () => ({
    formatSpawnMonitoredFailure: vi.fn(() => 'spawn failed'),
    spawnMonitoredAsync,
  }))
  vi.doMock('../../../lib/paths', () => ({
    resolveCorePackageDir: vi.fn(() => options.cliDir),
  }))
  vi.doMock('../../../lib/paths/out-dir', () => ({
    getOutDirPath: vi.fn(() => options.outDir),
  }))
  vi.doMock('../../../lib/profiler', () => ({
    logProfilerSample: vi.fn(),
  }))
  vi.doMock('../../../system/types/generate', () => ({
    writeGeneratedSystemTypes,
    writeGeneratedReactTypes,
  }))

  const mod = await import('./packages')
  return {
    ...mod,
    getCapturedTsconfigFiles: () => capturedTsconfigFiles,
    getCapturedTsconfigContents: () => capturedTsconfigContents,
    spawnMonitoredAsync,
    writeGeneratedSystemTypes,
    writeGeneratedReactTypes,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../../lib/child-process')
  vi.doUnmock('../../../lib/paths')
  vi.doUnmock('../../../lib/paths/out-dir')
  vi.doUnmock('../../../lib/profiler')
  vi.doUnmock('../../../system/types/generate')
  vi.restoreAllMocks()

  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function writeReactSupportFixture(cliDir: string): void {
  mkdirSync(resolve(cliDir, 'src/entry'), { recursive: true })
  writeFileSync(resolve(cliDir, 'src/entry/react.ts'), 'export {}\n', 'utf-8')

  mkdirSync(resolve(cliDir, 'src/system/primitives/nested'), { recursive: true })
  writeFileSync(
    resolve(cliDir, 'src/system/primitives/index.tsx'),
    "export { type Extra } from './nested/extra'\nexport const Div = 'div'\n",
    'utf-8'
  )
  writeFileSync(
    resolve(cliDir, 'src/system/primitives/nested/extra.ts'),
    'export type Extra = true\n',
    'utf-8'
  )

  mkdirSync(resolve(cliDir, 'src/types'), { recursive: true })
  writeFileSync(
    resolve(cliDir, 'src/types/index.ts'),
    "export type { DivProps } from './props'\n",
    'utf-8'
  )
  writeFileSync(
    resolve(cliDir, 'src/types/props.ts'),
    'export type DivProps = { children?: string }\n',
    'utf-8'
  )

  mkdirSync(resolve(cliDir, 'src/system/runtime'), { recursive: true })
  writeFileSync(resolve(cliDir, 'src/system/runtime/index.ts'), 'export const css = {}\n', 'utf-8')
}

function expectCapturedReactSupportTsconfigFiles(files: string[]): void {
  expect(files).toHaveLength(17)
  expect(files.some((file) => file.endsWith('/src/entry/react.ts'))).toBe(true)
  expect(files.some((file) => file.endsWith('/src/system/primitives/index.tsx'))).toBe(true)
  expect(files.some((file) => file.endsWith('/src/system/primitives/types.ts'))).toBe(true)
  expect(files.some((file) => file.endsWith('/src/system/runtime/index.ts'))).toBe(true)
  expect(files.some((file) => file.endsWith('/src/types/index.ts'))).toBe(true)
  expect(files.some((file) => file.endsWith('/src/types/props.ts'))).toBe(true)
  expect(files.some((file) => file.endsWith('/src/types/style-props.ts'))).toBe(true)
  expect(files.some((file) => file.endsWith('/src/types/system-style-object.ts'))).toBe(true)
}

function expectGeneratedReactSupportFiles(outDir: string): void {
  expect(readFileSync(resolve(outDir, 'react/react.d.mts'), 'utf-8')).toBe(
    "export * from './entry/react'\n"
  )
  expect(readFileSync(resolve(outDir, 'react/system/primitives/index.d.ts'), 'utf-8')).toContain(
    'Div'
  )
  expect(
    readFileSync(resolve(outDir, 'react/system/primitives/nested/extra.d.ts'), 'utf-8')
  ).toContain('Extra')
  expect(readFileSync(resolve(outDir, 'react/types/index.d.ts'), 'utf-8')).toContain('props')
  expect(readFileSync(resolve(outDir, 'react/types/props.d.ts'), 'utf-8')).toContain('DivProps')
  expect(readFileSync(resolve(outDir, 'react/system/runtime/index.d.ts'), 'utf-8')).toContain('css')
}

describe('packager/ts/install/packages', () => {
  it('emits react support declaration files from source roots into the generated package', async () => {
    const cliDir = createTempDir('reference-ui-core-cli-')
    const outDir = createTempDir('reference-ui-core-out-')
    writeReactSupportFixture(cliDir)

    const {
      getCapturedTsconfigFiles,
      installPackagesTs,
      spawnMonitoredAsync,
      writeGeneratedReactTypes,
      writeGeneratedSystemTypes,
    } =
      await importPackagesModule({ cliDir, outDir })

    await installPackagesTs(cliDir, [
      {
        name: '@reference-ui/react',
        sourceEntry: 'src/entry/react.ts',
        outFile: 'react.mjs',
      },
    ])

    expect(spawnMonitoredAsync).toHaveBeenCalledTimes(1)
    expectCapturedReactSupportTsconfigFiles(getCapturedTsconfigFiles())
    expectGeneratedReactSupportFiles(outDir)
    expect(writeGeneratedReactTypes).toHaveBeenCalledWith(
      cliDir,
      resolve(outDir, 'react/react.d.mts')
    )
    expect(writeGeneratedSystemTypes).toHaveBeenCalledWith(
      cliDir,
      resolve(outDir, 'system/system.d.mts')
    )
  })

  it('writes a synthetic tsconfig with an explicit catch-all path base for styled aliases', async () => {
    const cliDir = createTempDir('reference-ui-core-cli-')
    const outDir = createTempDir('reference-ui-core-out-')

    mkdirSync(resolve(cliDir, 'src/entry'), { recursive: true })
    writeFileSync(resolve(cliDir, 'src/entry/react.ts'), 'export {}\n', 'utf-8')

    mkdirSync(resolve(cliDir, 'src/system/primitives'), { recursive: true })
    writeFileSync(resolve(cliDir, 'src/system/primitives/index.tsx'), 'export const Div = "div"\n', 'utf-8')

    mkdirSync(resolve(cliDir, 'src/system/runtime'), { recursive: true })
    writeFileSync(resolve(cliDir, 'src/system/runtime/index.ts'), 'export const css = {}\n', 'utf-8')

    mkdirSync(resolve(cliDir, 'src/types'), { recursive: true })
    writeFileSync(resolve(cliDir, 'src/types/index.ts'), 'export type Example = true\n', 'utf-8')

    const { getCapturedTsconfigContents, installPackagesTs } = await importPackagesModule({ cliDir, outDir })

    await installPackagesTs(cliDir, [
      {
        name: '@reference-ui/react',
        sourceEntry: 'src/entry/react.ts',
        outFile: 'react.mjs',
      },
    ])

    const tsconfig = getCapturedTsconfigContents() as {
      compilerOptions?: {
        paths?: Record<string, string[]>
      }
    }

    expect(tsconfig).toBeTruthy()
    expect(tsconfig.compilerOptions?.paths?.['*']).toEqual(['./*'])
    expect(tsconfig.compilerOptions?.paths?.['@reference-ui/styled']).toHaveLength(1)
    expect(tsconfig.compilerOptions?.paths?.['@reference-ui/styled/*']).toHaveLength(1)
  })
})
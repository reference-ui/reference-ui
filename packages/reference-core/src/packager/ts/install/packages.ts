import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { logProfilerSample } from '../../../lib/profiler'
import {
  formatSpawnMonitoredFailure,
  spawnMonitoredAsync,
} from '../../../lib/child-process'
import { resolveCorePackageDir } from '../../../lib/paths'
import { getOutDirPath } from '../../../lib/paths/out-dir'
import {
  writeGeneratedReactTypes,
  writeGeneratedSystemTypes,
} from '../../../system/types/generate'
import { REACT_DTS_INCLUDE } from '../../../constants'
import { getPackageDir, getDeclarationBasename } from '../../layout'
import type { TsPackageInput } from '../types'
import { writeTsconfig } from '../tsconfig'

function resolveTsgoCli(projectCwd: string, cliDir: string): string {
  const require = createRequire(import.meta.url)
  const packageJsonPath = require.resolve('@typescript/native-preview/package.json', {
    paths: [projectCwd, cliDir],
  })

  return join(dirname(packageJsonPath), 'bin', 'tsgo.js')
}

function getEntryModuleSpecifier(entryFile: string): string {
  return `./${entryFile.replace(/^src\//, '').replace(/\.[cm]?[jt]sx?$/, '')}`
}

function getDeclarationEntryFiles(pkg: TsPackageInput): string[] {
  if (pkg.name === '@reference-ui/react') {
    return [pkg.sourceEntry, ...REACT_DTS_INCLUDE]
  }

  return [pkg.sourceEntry]
}

async function installPackageTs(
  cliDir: string,
  projectCwd: string,
  targetDir: string,
  pkg: TsPackageInput
): Promise<void> {
  const tsgoCli = resolveTsgoCli(projectCwd, cliDir)
  mkdirSync(targetDir, { recursive: true })

  const tempDir = mkdtempSync(join(targetDir, '.ref-ui-tsgo-'))
  const tsconfigPath = writeTsconfig({
    cliDir,
    entryFiles: getDeclarationEntryFiles(pkg),
    projectCwd,
    tempDir,
  })

  try {
    const result = await spawnMonitoredAsync(
      process.execPath,
      [tsgoCli, '--project', tsconfigPath, '--outDir', targetDir],
      {
        cwd: cliDir,
        processName: `packager-ts:${pkg.name}`,
        logCategory: 'packager:ts',
      }
    )

    if (result.code !== 0) {
      throw new Error(formatSpawnMonitoredFailure(`tsgo (${pkg.name})`, result))
    }

    const rootTypesPath = join(targetDir, getDeclarationBasename(pkg.outFile))
    writeFileSync(
      rootTypesPath,
      `export * from '${getEntryModuleSpecifier(pkg.sourceEntry)}'\n`,
      'utf-8'
    )
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

export async function installPackagesTs(
  cwd: string,
  packages: TsPackageInput[]
): Promise<void> {
  const cliDir = resolveCorePackageDir(cwd)
  const outDir = getOutDirPath(cwd)
  mkdirSync(outDir, { recursive: true })

  logProfilerSample('packager-ts:packages:iterate:begin')
  for (const pkg of packages) {
    const targetDir = getPackageDir(outDir, pkg.name)
    logProfilerSample(`packager-ts:pkg:before:${pkg.name}`)
    await installPackageTs(cliDir, cwd, targetDir, pkg)
    logProfilerSample(`packager-ts:pkg:after:${pkg.name}`)
  }
  logProfilerSample('packager-ts:packages:iterate:end')

  const systemDir = getPackageDir(outDir, '@reference-ui/system')
  const systemTypesPath = resolve(systemDir, getDeclarationBasename('system.mjs'))
  const reactDir = getPackageDir(outDir, '@reference-ui/react')
  const reactTypesPath = resolve(reactDir, getDeclarationBasename('react.mjs'))

  logProfilerSample('packager-ts:write-generated:begin')
  await writeGeneratedSystemTypes(cwd, systemTypesPath)
  await writeGeneratedReactTypes(cwd, reactTypesPath)
  logProfilerSample('packager-ts:write-generated:end')
}

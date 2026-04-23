import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
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
import { getPackageDir, getDeclarationBasename } from '../../layout'
import type { TsPackageInput } from '../types'
import { writeTsconfig } from '../tsconfig'

function copyDeclarationDirectory(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) {
    return
  }

  mkdirSync(targetDir, { recursive: true })

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = join(sourceDir, entry.name)
    const targetPath = join(targetDir, entry.name)

    if (entry.isDirectory()) {
      copyDeclarationDirectory(sourcePath, targetPath)
      continue
    }

    if (entry.name.endsWith('.d.ts')) {
      copyFileSync(sourcePath, targetPath)
    }
  }
}

function copyReactSupportDeclarations(cliDir: string, targetDir: string): void {
  copyDeclarationDirectory(
    resolve(cliDir, 'src/system/primitives'),
    join(targetDir, 'system/primitives')
  )
  copyDeclarationDirectory(resolve(cliDir, 'src/types'), join(targetDir, 'types'))

  const publicCssSourcePath = resolve(cliDir, 'src/system/css/public.d.ts')
  const publicCssTargetPath = join(targetDir, 'system/css/public.d.ts')

  if (existsSync(publicCssSourcePath)) {
    mkdirSync(dirname(publicCssTargetPath), { recursive: true })
    copyFileSync(publicCssSourcePath, publicCssTargetPath)
  }
}

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
    entryFile: pkg.sourceEntry,
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

    if (pkg.name === '@reference-ui/react') {
      copyReactSupportDeclarations(cliDir, targetDir)
    }
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

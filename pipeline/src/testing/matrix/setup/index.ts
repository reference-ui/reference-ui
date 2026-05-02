/**
 * Matrix workspace setup.
 *
 * This module owns the pipeline-managed preparation step for matrix fixtures.
 * It writes the managed package.json files and optionally installs workspace
 * dependencies so both local and containerized matrix flows start from the
 * same contract.
 */

import { existsSync, readdirSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildWorkspaceArtifacts } from '../../../build/index.js'
import { repoRoot, run } from '../../../build/workspace.js'
import {
  getPreferredLocalMatrixBundlers,
  listMatrixPackageDefinitions,
  type MatrixPackageDefinition,
} from '../discovery/index.js'
import { createManagedBundlerFiles } from '../managed/bundlers/index.js'
import { createManagedMatrixPackageJson, type MatrixFixturePackageJson } from '../managed/package-json/index.js'
import { createManagedPlaywrightConfigSource } from '../managed/playwright/index.js'
import { createManagedReactMainSource } from '../managed/react/index.js'
import { createManagedVitestConfigSource } from '../managed/vitest/index.js'
import { hasMatrixPlaywrightTests, hasMatrixVitestTests } from '../test-presence.js'
import { validateMatrixFixtures } from '../validate.js'

export interface MatrixSetupOptions {
  install?: boolean
  packageNames?: readonly string[]
  sync?: boolean
}

const localManagedFixtureFilePaths = [
  'index.html',
  'playwright.config.ts',
  'src/main.tsx',
  'vite.config.ts',
  'vitest.config.ts',
  'webpack.config.cjs',
] as const

async function readExistingPackageJson(packageDir: string): Promise<MatrixFixturePackageJson | undefined> {
  const packageJsonPath = resolve(packageDir, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return undefined
  }

  return JSON.parse(await readFile(packageJsonPath, 'utf8')) as MatrixFixturePackageJson
}

function resolveManagedReactEntryImportPath(packageDir: string): string {
  const srcDirectory = resolve(packageDir, 'src')

  if (existsSync(srcDirectory) && readdirSync(srcDirectory).includes('Index.tsx')) {
    return './Index'
  }

  return './index'
}

function hasMatrixVitestGlobalSetup(packageDir: string): boolean {
  return existsSync(resolve(packageDir, 'tests', 'unit', 'global-setup.ts'))
}

export function shouldManageMatrixFixturePlaywrightConfig(
  definition: Pick<MatrixPackageDefinition, 'packageName'>,
): boolean {
  return definition.packageName !== '@matrix/playwright'
}

export function createManagedMatrixFixtureFiles(definition: MatrixPackageDefinition): Record<string, string> {
  const localBundlers = getPreferredLocalMatrixBundlers(definition.config.bundlers)
  const managedFiles: Record<string, string> = {
    ...createManagedBundlerFiles({
      bundlers: localBundlers,
      react: definition.config.react,
      title: `Reference UI ${definition.config.name} matrix`,
    }),
    'src/main.tsx': createManagedReactMainSource({
      entryImportPath: resolveManagedReactEntryImportPath(definition.dir),
      runtime: definition.config.react,
    }),
  }

  if (hasMatrixVitestTests(definition.dir)) {
    managedFiles['vitest.config.ts'] = createManagedVitestConfigSource({
      globalSetupPath: hasMatrixVitestGlobalSetup(definition.dir)
        ? './tests/unit/global-setup.ts'
        : null,
    })
  }

  if (hasMatrixPlaywrightTests(definition.dir) && shouldManageMatrixFixturePlaywrightConfig(definition)) {
    managedFiles['playwright.config.ts'] = createManagedPlaywrightConfigSource(localBundlers)
  }

  return managedFiles
}

export async function setupMatrixPackages(options: MatrixSetupOptions = {}): Promise<void> {
  validateMatrixFixtures()
  const definitions = listMatrixPackageDefinitions(options.packageNames)

  for (const definition of definitions) {
    const packageJsonPath = resolve(definition.dir, 'package.json')
    const existingPackageJson = await readExistingPackageJson(definition.dir)
    const generatedPackageJson = createManagedMatrixPackageJson({
      config: definition.config,
      existingPackageJson,
      packageDir: definition.dir,
      packageName: definition.packageName,
    })
    const managedFiles = createManagedMatrixFixtureFiles(definition)

    await writeFile(packageJsonPath, generatedPackageJson)

    await Promise.all(
      localManagedFixtureFilePaths
        .filter(relativePath => !(relativePath in managedFiles))
        .map(async (relativePath) => {
          if (relativePath === 'playwright.config.ts' && !shouldManageMatrixFixturePlaywrightConfig(definition)) {
            return
          }

          await rm(resolve(definition.dir, relativePath), { force: true })
        }),
    )

    for (const [relativePath, source] of Object.entries(managedFiles)) {
      const outputPath = resolve(definition.dir, relativePath)
      await writeFile(outputPath, source)
    }

    console.log(`Set up ${definition.packageName} package.json`)
  }

  if (options.install !== false) {
    await run('pnpm', ['install'], {
      cwd: repoRoot,
      interactive: true,
      label: 'Installing workspace dependencies for matrix packages',
    })
  }

  if (!options.sync) {
    return
  }

  await buildWorkspaceArtifacts()

  for (const definition of definitions) {
    await run('pnpm', ['run', 'sync'], {
      cwd: definition.dir,
      interactive: true,
      label: `Running ref sync for ${definition.packageName}`,
    })
  }
}
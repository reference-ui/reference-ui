/**
 * Matrix workspace setup.
 *
 * This module owns the pipeline-managed preparation step for matrix fixtures.
 * It writes the managed package.json files and optionally installs workspace
 * dependencies so both local and containerized matrix flows start from the
 * same contract.
 */

import { existsSync, readdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { repoRoot, run } from '../../../build/workspace.js'
import { listMatrixPackageDefinitions } from '../discovery/index.js'
import { createManagedBundlerFiles } from '../managed/bundlers/index.js'
import { createManagedMatrixPackageJson, type MatrixFixturePackageJson } from '../managed/package-json/index.js'
import { createManagedReactMainSource } from '../managed/react/index.js'
import { validateMatrixFixtures } from '../validate.js'

export interface MatrixSetupOptions {
  install?: boolean
  packageNames?: readonly string[]
  sync?: boolean
}

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

export async function setupMatrixPackages(options: MatrixSetupOptions = {}): Promise<void> {
  validateMatrixFixtures()
  const definitions = listMatrixPackageDefinitions(options.packageNames)

  for (const definition of definitions) {
    const packageJsonPath = resolve(definition.dir, 'package.json')
    const existingPackageJson = await readExistingPackageJson(definition.dir)
    const generatedPackageJson = createManagedMatrixPackageJson({
      config: definition.config,
      existingPackageJson,
      packageName: definition.packageName,
    })
    const managedFiles = {
      ...createManagedBundlerFiles({
        bundlers: definition.config.bundlers,
        react: definition.config.react,
        title: `Reference UI ${definition.config.name} matrix`,
      }),
      'src/main.tsx': createManagedReactMainSource({
        entryImportPath: resolveManagedReactEntryImportPath(definition.dir),
        runtime: definition.config.react,
      }),
    }

    await writeFile(packageJsonPath, generatedPackageJson)

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

  for (const definition of definitions) {
    await run('pnpm', ['run', 'sync'], {
      cwd: definition.dir,
      interactive: true,
      label: `Running ref sync for ${definition.packageName}`,
    })
  }
}
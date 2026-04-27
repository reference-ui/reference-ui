/**
 * Matrix workspace setup.
 *
 * This module owns the pipeline-managed preparation step for matrix fixtures.
 * It writes the managed package.json files and optionally installs workspace
 * dependencies so both local and containerized matrix flows start from the
 * same contract.
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { repoRoot, run } from '../../../build/workspace.js'
import { listMatrixPackageDefinitions } from '../discovery/index.js'
import { createManagedMatrixPackageJson, type MatrixFixturePackageJson } from '../managed/package-json/index.js'
import { validateMatrixFixtures } from '../validate.js'

export interface MatrixSetupOptions {
  install?: boolean
  packageNames?: readonly string[]
}

async function readExistingPackageJson(packageDir: string): Promise<MatrixFixturePackageJson | undefined> {
  const packageJsonPath = resolve(packageDir, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return undefined
  }

  return JSON.parse(await readFile(packageJsonPath, 'utf8')) as MatrixFixturePackageJson
}

export async function setupMatrixPackages(options: MatrixSetupOptions = {}): Promise<void> {
  validateMatrixFixtures()
  const definitions = listMatrixPackageDefinitions(options.packageNames)

  for (const definition of definitions) {
    const packageJsonPath = resolve(definition.dir, 'package.json')
    const existingPackageJson = await readExistingPackageJson(definition.dir)
    const generatedPackageJson = createManagedMatrixPackageJson({
      existingPackageJson,
      packageName: definition.packageName,
    })

    await writeFile(packageJsonPath, generatedPackageJson)
    console.log(`Set up ${definition.packageName} package.json`)
  }

  if (options.install === false) {
    return
  }

  await run('pnpm', ['install'], {
    cwd: repoRoot,
    interactive: true,
    label: 'Installing workspace dependencies for matrix packages',
  })
}
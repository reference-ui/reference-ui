/**
 * Matrix bootstrap validation.
 *
 * This is the first pipeline-owned matrix entrypoint. Right now it only checks
 * matrix fixture discovery, but it is intentionally separate from the pipeline
 * unit-test suite because it validates real workspace matrix inputs.
 */

import { fileURLToPath } from 'node:url'
import { listMatrixWorkspacePackages } from './discovery/index.js'

export function validateMatrixFixtures(): void {
  const matrixPackages = listMatrixWorkspacePackages()

  if (matrixPackages.length === 0) {
    throw new Error('No matrix packages found. Add a matrix.json with a name and refSync config inside the matrix/ directory.')
  }

  for (const entry of matrixPackages) {
    if (!entry.workspacePackage.scripts.test) {
      throw new Error(`Matrix package ${entry.workspacePackage.name} must define a \`test\` script.`)
    }
  }

  const packageNames = matrixPackages.map((entry) => entry.workspacePackage.name)
  console.log('Discovered matrix packages:')
  for (const packageName of packageNames) {
    console.log(`- ${packageName}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validateMatrixFixtures()
}
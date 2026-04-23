/**
 * Matrix bootstrap validation.
 *
 * This is the first pipeline-owned matrix entrypoint. Right now it only checks
 * matrix fixture discovery, but it is intentionally separate from the pipeline
 * unit-test suite because it validates real workspace matrix inputs.
 */

import { fileURLToPath } from 'node:url'
import { listMatrixWorkspacePackages } from './discovery.js'

export function validateMatrixFixtures(): void {
  const matrixPackages = listMatrixWorkspacePackages()

  if (matrixPackages.length === 0) {
    throw new Error('No matrix-enabled packages found. Add a matrix.json file with {"matrix": true}.')
  }

  const packageNames = matrixPackages.map((entry) => entry.workspacePackage.name)

  if (!packageNames.includes('@fixtures/install-test')) {
    throw new Error('Expected @fixtures/install-test to be discoverable as the first matrix-enabled fixture.')
  }

  for (const entry of matrixPackages) {
    if (!entry.workspacePackage.scripts.test) {
      throw new Error(`Matrix fixture ${entry.workspacePackage.name} must define a \`test\` script.`)
    }
  }

  console.log('Discovered matrix packages:')
  for (const packageName of packageNames) {
    console.log(`- ${packageName}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validateMatrixFixtures()
}
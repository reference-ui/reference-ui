/**
 * Project helpers for tests. getProject() reads the bootstrapped project from setup.
 */

import type { MatrixEntry } from '../environments/matrix.js'
import { generateSandbox } from '../environments/generator/index.js'

export interface Project {
  root: string
  cleanup: () => Promise<void>
}

declare global {
  var __REF_TEST_PROJECT__: Project | undefined
}

export function getProject(): Project {
  const project = globalThis.__REF_TEST_PROJECT__
  if (!project) {
    throw new Error(
      'No project. Ensure environments/setup.ts runs before tests (via Vitest project setupFiles).'
    )
  }
  return project
}

/** @deprecated Use getProject() — setup bootstraps per Vitest project */
export async function createProject(config?: MatrixEntry): Promise<Project> {
  const { MATRIX } = await import('../environments/matrix.js')
  const entry = config ?? MATRIX[0]
  return generateSandbox(entry)
}

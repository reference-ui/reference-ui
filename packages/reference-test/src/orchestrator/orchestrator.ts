/**
 * Orchestrator - entry point for test execution.
 * Iterates over matrix, generates projects, runs core test suite.
 */

import { log } from '../lib/log.js'
import { generateProject } from '../project/generator.js'
import { Runner } from '../runner/runner.js'
import { MATRIX } from './matrix/index.js'
import type { ProjectConfig } from '../project/types.js'

/**
 * Generate sandbox projects for every matrix entry.
 * Creates .sandbox/<bundler>-react<version>/ for each combination.
 * Used for inspection; tests use createProjectAndRunner (which generates per run).
 */
export async function generateAllSandboxProjects(): Promise<void> {
  log('orchestrator', 'generating sandbox for', MATRIX.length, 'matrix entr' + (MATRIX.length === 1 ? 'y' : 'ies'))
  for (const env of MATRIX) {
    await generateProject({ environment: env })
  }
  log('orchestrator', 'sandbox ready')
}

/**
 * Create a project and runner for a matrix entry.
 * Used by test.each(MATRIX) to run the core suite per environment.
 */
export async function createProjectAndRunner(
  environment: ProjectConfig['environment']
): Promise<{ project: Awaited<ReturnType<typeof generateProject>>; runner: Runner }> {
  const project = await generateProject({ environment })
  const runner = new Runner(project, environment.bundler)
  return { project, runner }
}

/** Matrix entries for Vitest test.each */
export function getMatrixEntries(): Array<[string, ProjectConfig['environment']]> {
  return MATRIX.map((env) => [
    `${env.reactVersion}-${env.bundler}-${env.bundlerVersion}`,
    env,
  ])
}

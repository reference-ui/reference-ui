/**
 * Orchestrator - entry point for test execution.
 * Owns matrix knowledge. Iterates over matrix, generates projects, runs tests in each.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { log } from '../lib/log.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
import { generateProject } from '../project/generator.js'
import { Runner } from '../runner/runner.js'
import { MATRIX } from './matrix/index.js'
import type { ProjectConfig } from '../project/types.js'

const PACKAGE_ROOT = join(__dirname, '..', '..')
const SANDBOX_BASE = join(PACKAGE_ROOT, '.sandbox')

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

/**
 * Run tests in each sandbox project. Orchestrator-only: knows matrix, project paths.
 * Tests run from within each project and are environment-agnostic.
 */
export async function runMatrixTests(): Promise<void> {
  await generateAllSandboxProjects()

  for (const env of MATRIX) {
    const folderName = `${env.bundler}-react${env.reactVersion}`
    const projectPath = join(SANDBOX_BASE, folderName)

    log('orchestrator', 'running tests in', folderName)

    const result = await execa('pnpm', ['test'], {
      cwd: projectPath,
      reject: false,
    })

    if (result.exitCode !== 0) {
      throw new Error(`Tests failed in ${folderName}:\n${result.stderr}`)
    }
  }
}

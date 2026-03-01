/**
 * Runner: shared helpers and commands for running tests and dev server.
 * Resolves default project, prepares sandboxes, and provides env for Playwright.
 */

import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { loadConfig } from '../config/index.js'
import { MATRIX, getPort } from '../matrix/index.js'
import type { MatrixEntry } from '../matrix/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '..', '..')

/** Resolve default project from config. Throws if invalid. */
export function getDefaultProject(): MatrixEntry {
  const cfg = loadConfig()
  const project = MATRIX.find((e) => e.name === cfg.defaultProject)
  if (!project) throw new Error(`Unknown defaultProject: ${cfg.defaultProject}`)
  return project
}

/** Path to sandbox for a matrix entry. */
export function getSandboxDir(project: MatrixEntry): string {
  return join(PACKAGE_ROOT, '.sandbox', project.name)
}

/** Env vars for Playwright when running against a project. */
export function projectEnv(project: MatrixEntry): NodeJS.ProcessEnv {
  return {
    ...process.env,
    REF_TEST_PROJECT: project.name,
    REF_TEST_PORT: String(getPort(project)),
  }
}

/** Run test:prepare for a single project. */
export async function prepareProject(project: MatrixEntry): Promise<void> {
  await execa('pnpm', ['run', 'test:prepare'], {
    env: { ...process.env, REF_TEST_PROJECT: project.name },
    stdio: 'inherit',
  })
}

/** Run tests for default project. */
export async function runQuick(): Promise<void> {
  const project = getDefaultProject()
  await prepareProject(project)
  await execa('pnpm', ['exec', 'playwright', 'test', '--project', project.name], {
    env: projectEnv(project),
    stdio: 'inherit',
  })
}

/** Run Playwright UI for default project. */
export async function runUi(): Promise<void> {
  const project = getDefaultProject()
  await prepareProject(project)
  await execa('playwright', ['test', '--ui', '--project', project.name], {
    env: projectEnv(project),
    stdio: 'inherit',
  })
}

/** Start dev server for default project. */
export async function startDev(): Promise<void> {
  const project = getDefaultProject()
  const proc = spawn('pnpm', ['run', 'dev'], {
    cwd: getSandboxDir(project),
    stdio: 'inherit',
    env: process.env,
  })
  proc.on('exit', (code) => process.exit(code ?? 0))
}

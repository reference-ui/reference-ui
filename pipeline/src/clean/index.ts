/**
 * Cleanup entrypoint for pipeline-managed local state.
 *
 * Today that means the build cache, the managed Verdaccio registry state, and
 * the long-lived Dagger engine cache volume used by matrix runs.
 */

import { spawnSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pipelineStateDir } from '../build/workspace.js'
import { failStep, finishStep, startStep } from '../lib/log/index.js'
import { cleanManagedLocalRegistry } from '../registry/index.js'

const buildStateDir = resolve(pipelineStateDir, 'build')

function runDockerCommand(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  return {
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
  }
}

function dockerAvailable(): boolean {
  return runDockerCommand(['version']).status === 0
}

function listDaggerEngineContainerIds(): string[] {
  const result = runDockerCommand(['ps', '-aq', '--filter', 'name=dagger-engine-'])

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || 'Failed to list Dagger engine containers.')
  }

  return result.stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

async function cleanDaggerEngineCache(): Promise<boolean> {
  if (!dockerAvailable()) {
    return false
  }

  const containerIds = listDaggerEngineContainerIds()

  if (containerIds.length === 0) {
    return false
  }

  const removal = runDockerCommand(['rm', '--force', '--volumes', ...containerIds])

  if (removal.status !== 0) {
    throw new Error(removal.stderr.trim() || 'Failed to remove Dagger engine containers and volumes.')
  }

  return true
}

export async function cleanPipeline(): Promise<void> {
  const step = startStep('Clean pipeline state')

  try {
    await cleanManagedLocalRegistry()
    await rm(buildStateDir, { force: true, recursive: true })
    const cleanedDaggerCache = await cleanDaggerEngineCache()
    finishStep(
      step,
      cleanedDaggerCache
        ? 'Cleaned local registry, build cache, and Dagger engine cache'
        : 'Cleaned local registry and build cache',
    )
  } catch (error) {
    failStep(step, 'Failed to clean pipeline state')
    throw error
  }
}
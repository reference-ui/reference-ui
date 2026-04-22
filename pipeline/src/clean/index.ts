/**
 * Cleanup entrypoint for pipeline-managed local state.
 *
 * Today that means the build cache plus the managed Verdaccio registry state.
 */

import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pipelineStateDir } from '../build/workspace.js'
import { failStep, finishStep, startStep } from '../lib/log/index.js'
import { cleanManagedLocalRegistry } from '../registry/index.js'

const buildStateDir = resolve(pipelineStateDir, 'build')

export async function cleanPipeline(): Promise<void> {
  const step = startStep('Clean pipeline state')

  try {
    await cleanManagedLocalRegistry()
    await rm(buildStateDir, { force: true, recursive: true })
    finishStep(step, 'Cleaned local registry and build cache')
  } catch (error) {
    failStep(step, 'Failed to clean pipeline state')
    throw error
  }
}
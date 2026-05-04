/**
 * Shared filesystem and runtime constants for the matrix runner.
 *
 * Centralising these paths keeps helper modules aligned without forcing the
 * orchestration layer to thread the same values through every call.
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { VirtualNativeTarget } from '../../../../../packages/reference-rs/js/shared/targets.js'

const runnerDir = dirname(fileURLToPath(import.meta.url))

export const matrixDir = resolve(runnerDir, '..')
export const pipelineDir = resolve(runnerDir, '..', '..', '..', '..')
export const repoRoot = resolve(pipelineDir, '..')
export const matrixLogDir = resolve(repoRoot, '.pipeline', 'testing', 'matrix')
export const matrixConsumerArtifactsDir = resolve(matrixLogDir, 'artifacts')
export const matrixNativeTarget: VirtualNativeTarget = 'linux-x64-gnu'
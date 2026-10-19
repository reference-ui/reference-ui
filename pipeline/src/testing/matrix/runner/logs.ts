/**
 * Shared file-backed logging for matrix runner stages.
 *
 * Writes per-stage logs under .pipeline/testing/matrix and resets consumer
 * artifact dirs between runs while preserving log history. Keeps log layout in
 * one module so reporting and cleanup agree on paths.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { matrixConsumerArtifactsDir, matrixLogDir } from './paths.js'
import type { MatrixPackageRunContext, MatrixPackageStageLogPhase } from './types.js'

const legacyMatrixGeneratedLogDir = resolve(matrixLogDir, 'generated')

export async function resetMatrixConsumerArtifactsDir(logDir: string = matrixLogDir): Promise<void> {
  await rm(resolve(logDir, 'artifacts'), { force: true, recursive: true })

  if (logDir === matrixLogDir) {
    await rm(legacyMatrixGeneratedLogDir, { force: true, recursive: true })
  } else {
    await rm(resolve(logDir, 'generated'), { force: true, recursive: true })
  }

  await mkdir(logDir, { recursive: true })
}

export async function writeStageLog(fileName: string, output: string, logDir: string = matrixLogDir): Promise<void> {
  await mkdir(logDir, { recursive: true })
  await writeFile(resolve(logDir, fileName), output)
}

export async function writeMatrixPackageStageLog(
  packageRunContext: MatrixPackageRunContext,
  phase: MatrixPackageStageLogPhase,
  output: string,
): Promise<void> {
  await writeStageLog(`${packageRunContext.logPrefix}-${phase}.log`, output)
}
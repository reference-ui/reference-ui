/**
 * Shared file-backed logging for matrix runner stages.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { matrixLogDir } from './paths.js'
import type { MatrixPackageRunContext, MatrixPackageStageLogPhase } from './types.js'

export async function writeStageLog(fileName: string, output: string): Promise<void> {
  await mkdir(matrixLogDir, { recursive: true })
  await writeFile(resolve(matrixLogDir, fileName), output)
}

export async function writeMatrixPackageStageLog(
  packageRunContext: MatrixPackageRunContext,
  phase: MatrixPackageStageLogPhase,
  output: string,
): Promise<void> {
  await writeStageLog(`${packageRunContext.logPrefix}-${phase}.log`, output)
}
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

type WriteFileAtomicOptions = Parameters<typeof writeFileSync>[2]
type WriteFileAtomicData = Parameters<typeof writeFileSync>[1]

function getTempPath(filePath: string): string {
  return `${filePath}.tmp-${process.pid}-${Date.now()}`
}

function cleanupTempFile(tempPath: string): void {
  try {
    rmSync(tempPath, { force: true })
  } catch {
    // Best-effort cleanup only.
  }
}

/**
 * Write a file through a temp path and atomic rename so readers do not observe
 * a partially-written destination.
 */
export function writeFileAtomic(
  filePath: string,
  data: WriteFileAtomicData,
  options?: WriteFileAtomicOptions,
): void {
  mkdirSync(dirname(filePath), { recursive: true })
  const tempPath = getTempPath(filePath)

  try {
    writeFileSync(tempPath, data, options)
    renameSync(tempPath, filePath)
  } catch (error) {
    cleanupTempFile(tempPath)
    throw error
  }
}
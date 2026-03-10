import { workerData } from 'node:worker_threads'
import type { ReferenceUIConfig } from './types'
import { DEFAULT_OUT_DIR } from './constants'

/** Main-thread only. Workers use workerData from pool. */
let mainConfig: ReferenceUIConfig | undefined
let mainCwd: string | undefined

export function setConfig(cfg: ReferenceUIConfig): void {
  mainConfig = cfg
}

export function setCwd(cwd: string): void {
  mainCwd = cwd
}

export function getConfig(): ReferenceUIConfig | undefined {
  return (workerData as { config?: ReferenceUIConfig } | undefined)?.config ?? mainConfig
}

/** Cwd (project root) from workerData or main thread. Used by workers to resolve outDir. */
export function getCwd(): string | undefined {
  return (workerData as { cwd?: string } | undefined)?.cwd ?? mainCwd
}

export function getOutDir(): string {
  return getConfig()?.outDir ?? DEFAULT_OUT_DIR
}

export function clearConfig(): void {
  mainConfig = undefined
  mainCwd = undefined
}

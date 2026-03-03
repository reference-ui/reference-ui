import { workerData } from 'node:worker_threads'
import type { ReferenceUIConfig } from './types'
import { DEFAULT_OUT_DIR } from './constants'

/** Main-thread only. Workers use workerData from pool. */
let mainConfig: ReferenceUIConfig | undefined

export function setConfig(cfg: ReferenceUIConfig): void {
  mainConfig = cfg
}

export function getConfig(): ReferenceUIConfig | undefined {
  return (workerData as { config?: ReferenceUIConfig } | undefined)?.config ?? mainConfig
}

export function getOutDir(): string {
  return getConfig()?.outDir ?? DEFAULT_OUT_DIR
}

export function clearConfig(): void {
  mainConfig = undefined
}

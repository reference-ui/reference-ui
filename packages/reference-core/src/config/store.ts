// In-memory store for the active Neo config and project root.
// It takes setConfig and setCwd calls and emits the current values to readers.
// This module is a Neo-owned simplification of the core store with no worker machinery.

import type { ReferenceUIConfig } from './types.ts'
import { DEFAULT_OUT_DIR } from './constants.ts'

let mainConfig: ReferenceUIConfig | undefined
let mainCwd: string | undefined

export function setConfig(cfg: ReferenceUIConfig): void {
  mainConfig = cfg
}

export function setCwd(cwd: string): void {
  mainCwd = cwd
}

export function getConfig(): ReferenceUIConfig | undefined {
  return mainConfig
}

/** Project root for resolving the outDir. Set once per sync run. */
export function getCwd(): string | undefined {
  return mainCwd
}

export function getOutDir(): string {
  return DEFAULT_OUT_DIR
}

export function clearConfig(): void {
  mainConfig = undefined
  mainCwd = undefined
}

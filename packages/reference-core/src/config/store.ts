import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { workerData } from 'node:worker_threads'
import type { ReferenceUIConfig } from './types'
import { DEFAULT_OUT_DIR } from './constants'
import { getProjectTmpDirPath } from '../lib/paths'

/** Main-thread only. Workers use workerData from pool. */
let mainConfig: ReferenceUIConfig | undefined
let mainCwd: string | undefined

const CONFIG_SNAPSHOT_FILE = 'config.snapshot.json'

function getConfigSnapshotPath(cwd: string): string {
  return join(getProjectTmpDirPath(cwd), CONFIG_SNAPSHOT_FILE)
}

function writeConfigSnapshot(cwd: string, config: ReferenceUIConfig): void {
  const snapshotPath = getConfigSnapshotPath(cwd)
  mkdirSync(getProjectTmpDirPath(cwd), { recursive: true })
  writeFileSync(`${snapshotPath}.tmp`, JSON.stringify(config, null, 2) + '\n', 'utf-8')
  renameSync(`${snapshotPath}.tmp`, snapshotPath)
}

function readConfigSnapshot(cwd: string): ReferenceUIConfig | undefined {
  const snapshotPath = getConfigSnapshotPath(cwd)

  if (!existsSync(snapshotPath)) {
    return undefined
  }

  try {
    return JSON.parse(readFileSync(snapshotPath, 'utf-8')) as ReferenceUIConfig
  } catch {
    return undefined
  }
}

export function setConfig(cfg: ReferenceUIConfig): void {
  mainConfig = cfg

  if (mainCwd) {
    writeConfigSnapshot(mainCwd, cfg)
  }
}

export function setCwd(cwd: string): void {
  mainCwd = cwd

  if (mainConfig) {
    writeConfigSnapshot(cwd, mainConfig)
  }
}

export function getConfig(): ReferenceUIConfig | undefined {
  const workerContext = workerData as { config?: ReferenceUIConfig; cwd?: string } | undefined
  const snapshotConfig = workerContext?.cwd ? readConfigSnapshot(workerContext.cwd) : undefined

  return snapshotConfig ?? workerContext?.config ?? mainConfig
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

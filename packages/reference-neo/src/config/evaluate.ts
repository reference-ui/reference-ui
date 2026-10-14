// Evaluation for bundled Neo config code as an ESM module.
// It takes bundled code plus the source path and emits the raw config export, or a timeout error when the module never settles.
// This module is a Neo-owned copy of the core config evaluator.

import { mkdir, mkdtemp, rm, rmdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { getOutDirPath, getProjectTmpDirPath } from '../lib/paths/index.ts'
import { ConfigEvaluationTimeoutError } from './errors.ts'

/**
 * How long one config module may take to evaluate. Config code runs in
 * milliseconds, so a longer wait is a hang. A one-shot ends with the named
 * error; a watch resync reports it and keeps watching until the config is
 * fixed; a watch boot exits with it, since there is no baseline to watch yet.
 * The bound sits past the watch's stuck and shutdown bounds (5 s and 3 s), so a
 * wedged pass is still reported as stuck before the bound settles it.
 */
export const CONFIG_EVALUATION_TIMEOUT_MS = 30_000

export interface EvaluateConfigOptions {
  /** Bound on evaluating the config module, in ms. Defaults to CONFIG_EVALUATION_TIMEOUT_MS. */
  timeoutMs?: number
}

// Every evaluation of one project shares the tmp root, and each cleanup removes
// the root once it is empty. A creator that loses that race between its mkdir and
// its mkdtemp sees the root, or the out dir above it, vanish: ENOENT, or EINVAL on
// macOS. Creating the root again is the fix. rmdir still removes only an empty dir,
// so the root never disappears under an evaluation that already holds its own dir.
const VANISHED_DIR_CODES = new Set(['ENOENT', 'EINVAL'])
const MAX_CREATE_ATTEMPTS = 20

/** Make this evaluation's own temp dir under the shared tmp root, creating the root again if a cleanup removed it. */
async function createEvalDir(tempRoot: string): Promise<string> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await mkdir(tempRoot, { recursive: true })
      return await mkdtemp(join(tempRoot, 'config-eval-'))
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code
      if (code === undefined || !VANISHED_DIR_CODES.has(code) || attempt >= MAX_CREATE_ATTEMPTS) throw error
    }
  }
}

// The timer is ref'd, so it keeps the event loop alive while the import waits. A
// top-level await that never settles rejects here, instead of Node ending the
// process with its unsettled-await exit 13 and no message.
async function importWithTimeout(url: string, configPath: string, timeoutMs: number): Promise<unknown> {
  let timer: NodeJS.Timeout | undefined
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ConfigEvaluationTimeoutError(configPath, timeoutMs)), timeoutMs)
  })
  try {
    const mod: unknown = await Promise.race([import(/* @vite-ignore */ url), expired])
    return mod
  } finally {
    clearTimeout(timer)
  }
}

// The config's export: its default when it has one, else the module namespace.
function exportOf(mod: unknown): unknown {
  if (typeof mod !== 'object' || mod === null || !('default' in mod)) return mod
  return mod.default ?? mod
}

/**
 * Evaluate the bundled user config as an ESM module rooted beside the source config.
 *
 * The config bundle is emitted as ESM so dependencies that rely on `import.meta`
 * keep working during config evaluation, and bare package imports resolve using
 * the user's project as the module base.
 *
 * @param bundledCode - The bundled JavaScript string (ESM format)
 * @param configPath - Absolute path to the original config file being evaluated
 * @param options - Evaluation bound; the default is CONFIG_EVALUATION_TIMEOUT_MS
 * @returns The evaluated config object (raw, may have default export)
 */
export async function evaluateConfig(
  bundledCode: string,
  configPath: string,
  options: EvaluateConfigOptions = {}
): Promise<unknown> {
  const tempRoot = getProjectTmpDirPath(dirname(configPath))
  const tempDir = await createEvalDir(tempRoot)

  try {
    const tempFile = join(tempDir, 'config.bundle.mjs')
    await writeFile(tempFile, bundledCode, 'utf8')
    const url = `${pathToFileURL(tempFile).href}?t=${Date.now()}`
    return exportOf(await importWithTimeout(url, configPath, options.timeoutMs ?? CONFIG_EVALUATION_TIMEOUT_MS))
  } finally {
    await rm(tempDir, { recursive: true, force: true })
    // Drop the project tmp root when this eval leaves it empty, so sync
    // never strands `.reference-ui/tmp/` behind (coverage-map note d).
    // rmdir only removes empty dirs; a shared root stays untouched.
    try {
      await rmdir(tempRoot)
    } catch {
      // Non-empty or already gone: another eval still owns the root.
    }
    // Drop the output dir itself when the eval leaves it empty, so a
    // config-load failure leaves no folder behind at all (SYNC-08).
    try {
      await rmdir(getOutDirPath(dirname(configPath)))
    } catch {
      // Non-empty or already gone: a previous sync still owns the folder.
    }
  }
}

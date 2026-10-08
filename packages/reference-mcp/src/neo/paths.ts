// Generated-folder path helpers vendored from Neo (F4 declaration-safe).
// They take a project root and emit out-dir paths plus config discovery.
// Byte-identical in behavior to Neo's lib/paths seam, which is itself a
// copy of core's; vendored (not retargeted) because pipeline/paths and the
// server project files are reachable from the package `types` entry, where
// an unresolvable `@reference-ui/neo/*` id would break consumers (TS2307
// proven with skipLibCheck on). F4 explicitly allows vendoring.

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export const DEFAULT_OUT_DIR = '.reference-ui'

const CONFIG_CANDIDATES = ['ui.config.ts', 'ui.config.js', 'ui.config.mjs'] as const

/**
 * Search for a config file in the given directory.
 * Tries ui.config.ts, ui.config.js, ui.config.mjs in that order.
 * @returns Absolute path to the config file, or null if not found.
 */
export function resolveRefConfigFile(cwd: string): string | null {
  for (const candidate of CONFIG_CANDIDATES) {
    const path = resolve(cwd, candidate)
    if (existsSync(path)) return path
  }
  return null
}

/** Resolve the absolute out-dir path relative to cwd. */
export function getOutDirPath(cwd: string): string {
  return resolve(cwd, DEFAULT_OUT_DIR)
}

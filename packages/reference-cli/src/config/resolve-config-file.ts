import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const CONFIG_CANDIDATES = ['ui.config.ts', 'ui.config.js', 'ui.config.mjs'] as const

/**
 * Search for a config file in the given directory.
 * Tries ui.config.ts, ui.config.js, ui.config.mjs in that order.
 * @returns Absolute path to the config file, or null if not found.
 */
export function resolveConfigFile(cwd: string): string | null {
  for (const candidate of CONFIG_CANDIDATES) {
    const path = resolve(cwd, candidate)
    if (existsSync(path)) return path
  }
  return null
}

/**
 * Auto-detect bundler from project files.
 * Keeps tests environment-agnostic.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

export function detectBundler(projectRoot: string): 'vite' | 'webpack' | 'rollup' {
  if (existsSync(join(projectRoot, 'vite.config.ts')) || existsSync(join(projectRoot, 'vite.config.js'))) {
    return 'vite'
  }
  if (
    existsSync(join(projectRoot, 'webpack.config.js')) ||
    existsSync(join(projectRoot, 'webpack.config.ts'))
  ) {
    return 'webpack'
  }
  if (
    existsSync(join(projectRoot, 'rollup.config.js')) ||
    existsSync(join(projectRoot, 'rollup.config.mjs'))
  ) {
    return 'rollup'
  }
  return 'vite'
}

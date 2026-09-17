// Option and result shapes for the Neo microbundle seam.
// It takes nothing and emits the bundling contract esbuild builds honor.
// This module is a Neo-owned copy of the core microbundle types.

import type * as esbuild from 'esbuild'

export interface MicroBundleResult {
  code: string
  metafile?: esbuild.Metafile
}

export interface MicroBundleOptions {
  /** Modules to leave as require/import (not bundled). Defaults to heavy build-tool deps. */
  external?: string[]
  /** Whether bare package specifiers should remain external instead of being bundled. */
  packages?: 'bundle' | 'external'
  /** Resolve these module ids to absolute paths (for config bundling so defineConfig ids → local entry). */
  alias?: Record<string, string>
  format?: 'esm' | 'cjs' | 'iife'
  platform?: 'node' | 'browser' | 'neutral'
  target?: string | string[]
  minify?: boolean
  keepNames?: boolean
  treeShaking?: boolean
  mainFields?: string[]
  conditions?: string[]
  tsconfigRaw?: esbuild.TsconfigRaw
  metafile?: boolean
  /** Additional esbuild plugins. */
  plugins?: esbuild.Plugin[]
}

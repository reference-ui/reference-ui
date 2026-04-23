import type * as esbuild from 'esbuild'

export interface MicroBundleOptions {
  /** Modules to leave as require/import (not bundled). Defaults to heavy build-tool deps. */
  external?: string[]
  /** Whether bare package specifiers should remain external instead of being bundled. */
  packages?: 'bundle' | 'external'
  /** Resolve these module ids to absolute paths (for fragment bundling so @reference-ui/system → CLI entry). */
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
}

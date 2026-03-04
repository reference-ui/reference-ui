export interface MicroBundleOptions {
  /** Modules to leave as require/import (not bundled). Defaults to heavy build-tool deps. */
  external?: string[]
  format?: 'esm' | 'cjs' | 'iife'
  platform?: 'node' | 'browser' | 'neutral'
  target?: string | string[]
  minify?: boolean
  keepNames?: boolean
  treeShaking?: boolean
  mainFields?: string[]
  conditions?: string[]
}

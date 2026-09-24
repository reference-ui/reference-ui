// Public config surface for Neo ui.config files.
// It takes author options and emits the validated ReferenceUIConfig shape.
// This module is a Neo-owned copy of the core config types trimmed to the surviving fields.

import type { BaseSystem } from '../system/base/types.ts'

export type { BaseSystem }

/**
 * Opt-in diagnostic channel names for the compiler backchannel.
 * `'compiler'` carries dynamic refusals, spreads, harvest activity, and
 * dead branches; the future runtime channel may extend this union.
 */
export type LogChannel = 'compiler'

export interface ReferenceUIConfig {
  /**
   * Glob patterns for files to scan for fragment collection and atomic input.
   * These roots feed the fragment scan; no codegen copy happens in Neo.
   *
   * @example
   * include: ['src/**\/*.{ts,tsx}', 'app/**\/*.{ts,tsx}']
   */
  include: string[]

  /**
   * Identity of this design system (CSS @layer, data-layer selector).
   * Required. Primitives automatically render this value as data-layer on the DOM.
   */
  name: string

  /**
   * Upstream systems to merge in before this package's own tokens.
   * Each entry is a BaseSystem (from baseSystem.mjs of another package).
   */
  extends?: BaseSystem[]

  /**
   * Visual-only upstream systems: their streams join the merge in bucket
   * order (extends, then layers) while fragments and roster stay extends-only.
   * Each entry is a BaseSystem (from baseSystem.mjs of another package).
   */
  layers?: BaseSystem[]

  /**
   * Escape hatch for JSX element names that static tracing cannot infer.
   * Hosts are discovered by StyleTrace per compile; list here only generated
   * component surfaces and member spellings (e.g. `NSPanel` for `<NS.Panel>`).
   */
  jsxElements?: string[]

  /**
   * Static utility synthesis: style properties map to token values, or '*'
   * for the whole token category. Condition prefixes ride the key
   * ('_hover:color'). The engine emits these atoms with no call site.
   */
  staticCss?: Record<string, string[]>

  /**
   * Enable normalize CSS reset.
   * @default true
   */
  normalizeCss?: boolean

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean

  /**
   * Opt-in diagnostic channels for the compiler backchannel.
   * Omit or pass `[]` for userspace diagnostics only; `['compiler']`
   * returns compiler telemetry in `compilerDiagnostics` and prints it
   * as `[neo] compiler` lines. Unrelated to `debug`, which stays the
   * JS infrastructure logger and never implies this channel.
   */
  logs?: LogChannel[]
}

/**
 * Define Reference UI configuration with type safety.
 * Use this in your ui.config.ts file.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@reference-ui/neo'
 *
 * export default defineConfig({
 *   name: 'my-app',
 *   include: ['src/**\/*.{ts,tsx}']
 * })
 * ```
 */
export function defineConfig(cfg: ReferenceUIConfig): ReferenceUIConfig {
  return cfg
}

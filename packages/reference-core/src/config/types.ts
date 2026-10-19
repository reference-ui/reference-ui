// Public config surface for Core ui.config files.
// It takes author options and emits the validated ReferenceUIConfig shape.
// This module is a core-owned copy of the retired reference-core config types trimmed to the surviving fields.

import type { BaseSystem } from '../system/base/types.ts'

export type { BaseSystem }

/**
 * Opt-in diagnostic channel names for the compiler backchannel.
 * `'compiler'` carries dynamic refusals, spreads, harvest activity, and
 * dead branches; the future runtime channel may extend this union.
 */
export type LogChannel = 'compiler'

/**
 * Token categories a `strict` list may name. Each narrows its style props
 * and css values to that category's tokens at typegen.
 */
export type StrictCategory = 'colors' | 'radii' | 'spacing'

export interface ReferenceUIConfig {
  /**
   * Glob patterns for files to scan for fragment collection and atomic input.
   * These roots feed the fragment scan; no codegen copy happens in Core.
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
   * Token categories that narrow typegen. Omitted or empty means open mode.
   * A strict category accepts only its tokens; colors also accept tones and
   * the keywords white, black, inherit, currentColor and transparent. Raw `/50`
   * opacity and free strings are rejected in JSX style props and css.
   *
   * @example
   * strict: ['colors', 'spacing']
   */
  strict?: readonly StrictCategory[]

  /**
   * Component names admitted as the app's own style hosts by name. Not needed:
   * StyleTrace finds every component that forwards style props, and import
   * provenance decides ownership. A name here admits only a project or
   * unbound tag; a component imported from a package is never own.
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
   * returns compiler telemetry in `compilerDiagnostics`, counted in the
   * one-line warning summary and listed behind the compiler tag under
   * --verbose. Unrelated to `debug`, which stays the
   * JS infrastructure logger and never implies this channel.
   */
  logs?: LogChannel[]

  /**
   * Atlas selectors for the MCP server's component inventory. Read by
   * `@reference-ui/mcp`; Core passes them through and never reads them.
   */
  mcp?: ReferenceUIMcpConfig

  /**
   * Let the MCP server present `@reference-ui/lib` components to coding agents.
   * Read by `@reference-ui/mcp`; `use_reference_library` is the same flag.
   * @default true
   */
  useReferenceLibrary?: boolean
  use_reference_library?: boolean

  /**
   * Let the MCP server list `@reference-ui/icons` through `list_icons`.
   * Set to false when the project uses its own icons. Read by
   * `@reference-ui/mcp`; `use_reference_icons` is the same flag.
   * @default true
   */
  useReferenceIcons?: boolean
  use_reference_icons?: boolean
}

/**
 * MCP-only selectors, separate from the top-level `include` that feeds sync.
 */
export interface ReferenceUIMcpConfig {
  /** Atlas include selectors for the MCP component inventory. */
  include?: string[]

  /** Atlas exclude selectors for the MCP component inventory. */
  exclude?: string[]
}

/**
 * Define Reference UI configuration with type safety.
 * Use this in your ui.config.ts file.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@reference-ui/core'
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

/**
 * Public config API for ui.config.ts files.
 * Types and defineConfig helper — isolated so bundling user config doesn't pull in load.
 */

import type { BaseSystem } from '../types'

/**
 * Token categories that can be strictly enforced via {@link ReferenceUIConfig.strict}.
 *
 * - `colors` — restricts color-bearing props to color tokens (plus `white`,
 *   `black`, `inherit`, `currentColor`, `transparent`).
 * - `radii` — restricts border-radius props to radius tokens (plus `none`,
 *   `inherit`, `initial`, `revert`).
 * - `spacing` — restricts margin/padding/gap props to spacing tokens (plus
 *   `0`, `auto`, `inherit`, `initial`, `revert`).
 */
export type StrictTokenCategory = 'colors' | 'radii' | 'spacing'

export interface ReferenceUIMcpConfig {
  /**
   * Atlas include selectors used only for the MCP component inventory build.
   * These do not affect virtual sync, Panda scan, or the design-system include surface.
   */
  include?: string[]

  /**
   * Atlas exclude selectors used only for the MCP component inventory build.
   */
  exclude?: string[]
}

export interface ReferenceUIConfig {
  /**
   * Glob patterns for files to scan for Panda CSS extraction.
   * These files will be copied to a 'codegen' folder to isolate Panda.
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
   * Each entry is a BaseSystem (from dist/baseSystem.mjs of another package).
   */
  extends?: BaseSystem[]

  /**
   * Explicit JSX element names to include in Panda/component discovery.
   * Use this for generated component surfaces that static tracing cannot infer.
   */
  jsxElements?: string[]

  /**
   * Include an upstream system's component CSS in an isolated cascade layer.
   * Components render correctly. Tokens do NOT land in your Panda config or TypeScript types.
   * Each entry must have a `css` field (run `ref sync` on the upstream package first).
   */
  layers?: BaseSystem[]

  /**
   * Token categories whose style props are restricted to design-token values
   * (plus a small set of category-specific escape hatches).
   *
   * Omit to leave all props open. Pass an empty array to opt out of every
   * category, including the default `colors` strictness.
   *
   * @example
   * strict: ['colors', 'radii']
   */
  strict?: StrictTokenCategory[]

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
   * MCP-specific Atlas selectors.
   * This surface is intentionally separate from the top-level `include`, which
   * controls design-system source mirroring and Panda scan input.
   */
  mcp?: ReferenceUIMcpConfig

  /**
   * Skip TypeScript declaration generation (tsup).
   * Use in test environments where .d.ts output is not needed.
   * @default false
   */
  skipTypescript?: boolean
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

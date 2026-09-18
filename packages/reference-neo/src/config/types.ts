// Public config surface for Neo ui.config files.
// It takes author options and emits the validated ReferenceUIConfig shape.
// This module is a Neo-owned copy of the core config types trimmed to the surviving fields.

/**
 * Portable design-system artefact emitted by sync.
 * Neo-owned copy of the core BaseSystem shape (name plus fragment payload).
 */
export interface BaseSystem {
  name: string
  /** Bundled fragment IIFEs representing the full upstream config contribution. */
  fragment: string
  /** Pre-compiled component CSS for layers mode, including any bundled upstream stylesheets. */
  css?: string
  /** Resolved non-primitive JSX elements contributed by this system and its upstream extends chain. */
  jsxElements?: string[]
}

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
   * Explicit JSX element names to include in styletrace discovery.
   * Use this for generated component surfaces that static tracing cannot infer.
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

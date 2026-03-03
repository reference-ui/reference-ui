/**
 * Public config API for ui.config.ts files.
 * Types and defineConfig helper — isolated so bundling user config doesn't pull in load.
 */

/**
 * Shape of the bundled config read by extends[]. Emitted as dist/baseSystem.mjs.
 * Only reflects the public API: tokens(), font(), keyframes(), globalCss() — nothing else.
 */
export interface BaseSystem {
  name: string
  tokens: Record<string, unknown>
  font: Record<string, unknown>
  keyframes: Record<string, unknown>
  globalCss: Record<string, unknown>
  /** Pre-compiled component CSS for layers mode. Scoped to @layer &lt;name&gt; + [data-layer] token block. */
  css?: string
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
   * Required.
   */
  name: string

  /**
   * Upstream systems to merge in before this package's own tokens.
   * Each entry is a BaseSystem (from dist/baseSystem.mjs of another package).
   */
  extends?: BaseSystem[]

  /**
   * Include an upstream system's component CSS in an isolated cascade layer.
   * Components render correctly. Tokens do NOT land in your Panda config or TypeScript types.
   * Each entry must have a `css` field (run `ref sync` on the upstream package first).
   */
  layers?: BaseSystem[]

  /**
   * Output directory for CLI artefacts (virtual, generated config, etc).
   * Virtual dir is written to outDir/virtual.
   * @default '.reference-ui'
   */
  outDir?: string

  /**
   * Virtual directory where transformed files are written.
   * @deprecated Use outDir instead; virtual is always outDir/virtual
   */
  virtualDir?: string

  /**
   * Enable normalize CSS reset.
   * @default true
   */
  normalizeCss?: boolean

  /**
   * Use reference-ui design system components and tokens.
   * @default true
   */
  useDesignSystem?: boolean

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean

  /**
   * Skip TypeScript declaration generation (tsdown).
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
 *   include: ['src/**\/*.{ts,tsx}']
 * })
 * ```
 */
export function defineConfig(cfg: ReferenceUIConfig): ReferenceUIConfig {
  return cfg
}

/**
 * Public config API for ui.config.ts files.
 * Types and defineConfig helper — isolated so bundling user config doesn't pull in load-config.
 */

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
   * Virtual directory where transformed files are written.
   * @default '.virtual'
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

/**
 * Reference UI Configuration System
 * 
 * This module provides the defineConfig() helper for type-safe configuration.
 * Users export the config from ui.config.ts, and the CLI loads it via bundle-n-require.
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
   * Enable normalize CSS reset.
   * @default true
   */
  normalizeCss?: boolean

  /**
   * Use reference-ui design system components and tokens.
   * @default true
   */
  useDesignSystem?: boolean
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

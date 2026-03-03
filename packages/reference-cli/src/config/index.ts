/**
 * Reference UI Configuration System
 *
 * This module provides the defineConfig() helper for type-safe configuration.
 * Users export the config from ui.config.ts, and the CLI loads it via bundle-n-require.
 */

export type { ReferenceUIConfig, BaseSystem } from './types'
export { defineConfig } from './types'
export { setConfig, getConfig, getOutDir, clearConfig } from './store'
export { loadUserConfig } from './load'
export {
  ConfigNotFoundError,
  LoadConfigError,
  ConfigValidationError,
} from './errors'

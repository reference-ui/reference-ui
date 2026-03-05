/**
 * Reference UI Configuration System
 *
 * This module provides the defineConfig() helper for type-safe configuration.
 * Users export the config from ui.config.ts, and the CLI loads it via bundle-n-require.
 */

export type { ReferenceUIConfig, BaseSystem } from './types'
export { defineConfig } from './types'
export {
  setConfig,
  setCwd,
  getConfig,
  getCwd,
  getOutDir,
  clearConfig,
} from './store'
export { loadUserConfig } from './load'
export {
  ConfigNotFoundError,
  LoadConfigError,
  ConfigValidationError,
} from './errors'

// Fragment collectors - user-facing API for extending Panda config
export { tokens } from '../system/api/tokens'
export { keyframes } from '../system/api/keyframes'
export { utilities } from '../system/api/utilities'
export { globalCss } from '../system/api/globalCss'
export { staticCss } from '../system/api/staticCss'
export { globalFontface } from '../system/api/globalFontface'

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

// System API — tokens() is the single public entry for now (see system/fragments.md)
export { tokens } from '../system/api'
export { keyframes } from '../system/panda/api/keyframes'
export { utilities } from '../system/panda/api/utilities'
export { globalCss } from '../system/panda/api/globalCss'
export { staticCss } from '../system/panda/api/staticCss'
export { globalFontface } from '../system/panda/api/globalFontface'

/**
 * Virtual Filesystem Module
 * 
 * The virtual filesystem copies user files and applies transforms
 * to prepare them for consumption by Panda CSS and other tools.
 * 
 * Key features:
 * - File watching with change detection
 * - Minimal AST transforms (MDX -> JSX, etc.)
 * - Event-driven architecture for extensibility
 * - Isolated from Panda CSS - other tools can read from here too
 */

// Types
export type { VirtualOptions, FileChangeEvent, FileChangeHandler, InitVirtualOptions } from './types'
export type { SupportedInputExtension, SupportedVirtualExtension } from './config.internal'

// Functions
export { initVirtual } from './init'
export { syncVirtual } from './sync'
export { transformFile } from './transform'
export { copyToVirtual, removeFromVirtual } from './copy'
export { setupWatcher } from './watcher'

// Constants
export {
  DEFAULT_VIRTUAL_DIR,
  TRANSFORMED_EXTENSIONS,
  WATCHER_CONFIG,
  GLOB_CONFIG,
  TRANSFORM_EXTENSIONS
} from './config.internal'

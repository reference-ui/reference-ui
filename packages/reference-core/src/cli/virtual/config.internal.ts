/**
 * Internal configuration constants for the virtual filesystem module.
 * These values control the behavior of file watching, transformations, and cleanup.
 */

/**
 * Default directory name for the virtual filesystem.
 * Files are copied and transformed into this directory.
 */
export const DEFAULT_VIRTUAL_DIR = '.virtual'

/**
 * Transform mappings for file extensions.
 * Maps source extensions to their transformed output extensions.
 * Extensions that map to themselves are copied as-is without transformation.
 */
const TRANSFORM_EXTENSIONS_ENTRIES = [
  ['.mdx', '.jsx'],
  ['.js', '.js'],
  ['.jsx', '.jsx'],
  ['.ts', '.ts'],
  ['.tsx', '.tsx'],
] as const

/**
 * Supported input file extension types (what users write)
 */
export type SupportedInputExtension = (typeof TRANSFORM_EXTENSIONS_ENTRIES)[number][0]

/**
 * Supported virtual file extension types (what appears in .virtual/)
 */
export type SupportedVirtualExtension = (typeof TRANSFORM_EXTENSIONS_ENTRIES)[number][1]

/**
 * Transform mappings map
 */
export const TRANSFORM_EXTENSIONS = new Map(TRANSFORM_EXTENSIONS_ENTRIES)

/**
 * Type guard for supported input extensions.
 */
export function isTransformExtension(ext: string): ext is SupportedInputExtension {
  return TRANSFORM_EXTENSIONS.has(ext as SupportedInputExtension)
}

/**
 * File extensions that can appear in the virtual directory.
 * Derived from the output values of TRANSFORM_EXTENSIONS.
 * Used when cleaning up to check for all possible transformed file extensions.
 */
export const TRANSFORMED_EXTENSIONS = [...new Set(TRANSFORM_EXTENSIONS.values())] as const

/**
 * Chokidar file watcher configuration.
 * These settings control how file changes are detected and debounced.
 */
export const WATCHER_CONFIG = {
  /**
   * Don't ignore initial add events - we want to process existing files
   */
  ignoreInitial: false,

  /**
   * Keep the watcher running persistently
   */
  persistent: true,

  /**
   * Wait for file writes to finish before processing.
   * This prevents reading partial file contents during writes.
   */
  awaitWriteFinish: {
    /**
     * Amount of time in ms for a file size to remain constant
     * before emitting its event.
     */
    stabilityThreshold: 100,

    /**
     * File size polling interval in ms.
     */
    pollInterval: 100,
  },
} as const

/**
 * Fast-glob configuration for file discovery.
 */
export const GLOB_CONFIG = {
  /**
   * Only match files, not directories
   */
  onlyFiles: true,

  /**
   * Return absolute paths
   */
  absolute: true,
} as const

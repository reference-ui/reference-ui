/**
 * Virtual filesystem types for the CLI
 *
 * The virtual filesystem copies user files and applies transforms
 * to prepare them for consumption by Panda CSS and other tools.
 */

/**
 * Options for initializing the virtual filesystem.
 * Used with initVirtual() and syncVirtual().
 */
export interface InitVirtualOptions {
  /**
   * Virtual directory where transformed files are written
   * @default '.virtual'
   */
  virtualDir?: string
}

/**
 * Internal options used by the virtual module.
 * Includes all resolved paths and configuration.
 */
export interface VirtualOptions {
  /**
   * Source directory (typically the user's project root)
   */
  sourceDir: string

  /**
   * Virtual directory where transformed files are written
   * @default '.virtual'
   */
  virtualDir?: string

  /**
   * Glob patterns for files to include
   */
  include: string[]

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean
}

export interface TransformOptions {
  /**
   * Source file path (absolute)
   */
  sourcePath: string

  /**
   * Destination file path (absolute)
   */
  destPath: string

  /**
   * File content to transform
   */
  content: string

  /**
   * Source directory (for calculating relative paths)
   */
  sourceDir?: string

  /**
   * Enable debug logging
   */
  debug?: boolean
}

export interface TransformResult {
  /**
   * Transformed content
   */
  content: string

  /**
   * New file extension (if changed)
   * @example '.mdx' -> '.jsx'
   */
  extension?: string

  /**
   * Whether the file was transformed
   */
  transformed: boolean
}

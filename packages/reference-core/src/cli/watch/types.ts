/**
 * Watch module types
 */

export interface WatchOptions {
  /**
   * Directory to watch (user's project root)
   */
  sourceDir: string

  /**
   * Glob patterns to watch
   */
  include: string[]

  /**
   * Enable debug logging
   */
  debug?: boolean
}

export interface WatchPayload extends WatchOptions {}

export type FileEvent = 'add' | 'change' | 'unlink'

export interface FileChangeEvent {
  /**
   * Type of event
   */
  event: FileEvent

  /**
   * Relative path from sourceDir
   */
  path: string

  /**
   * File stats (if available)
   */
  stats?: any
}

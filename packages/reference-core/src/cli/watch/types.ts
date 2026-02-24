/**
 * Watch module types
 */

import type { ReferenceUIConfig } from '../config'

export interface WatchOptions {
  /**
   * Directory to watch (user's project root)
   */
  sourceDir: string

  /**
   * Full user configuration
   */
  config: ReferenceUIConfig
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

/**
 * Vanilla Extract module types
 *
 * Self-contained benchmark for VE: setup project, run build, track memory.
 */

import type { ReferenceUIConfig } from '../config'

/**
 * Payload for the vanilla worker
 */
export interface VanillaWorkerPayload {
  /**
   * Project root (user cwd)
   */
  cwd: string
  /**
   * User config (for include patterns, etc.)
   */
  config: ReferenceUIConfig
  /**
   * Directory for benchmark project (default: .ref/vanilla-bench)
   */
  benchDir?: string
  /**
   * Stress test: number of style files to generate (default: 0 = minimal)
   */
  stressFiles?: number
  /**
   * Stress test: styles per file (default: 20)
   */
  stressStylesPerFile?: number
}

/**
 * Options for initializing the vanilla module
 */
export interface InitVanillaOptions {
  /**
   * Directory for benchmark project
   * @default '.ref/vanilla-bench'
   */
  benchDir?: string
  /**
   * Stress test: number of style files (0 = minimal)
   */
  stressFiles?: number
  /**
   * Stress test: styles per file
   */
  stressStylesPerFile?: number
}

import type { ReferenceUIConfig } from '../config'

export interface VirtualWorkerPayload {
  sourceDir: string
  config: ReferenceUIConfig
}

export interface TransformOptions {
  sourcePath: string
  content: string
  sourceDir?: string
  debug?: boolean
  /** Forwarded to the Rust responsive-styles pass for inline named breakpoints. */
  breakpoints?: Record<string, string>
}

export interface TransformResult {
  content: string
  extension?: string
  transformed: boolean
}

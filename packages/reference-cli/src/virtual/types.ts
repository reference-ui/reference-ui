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
}

export interface TransformResult {
  content: string
  extension?: string
  transformed: boolean
}

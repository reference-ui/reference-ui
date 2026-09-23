/**
 * High-level TypeScript wrapper and orchestration API for Reference UI typegen.
 * Exposes synchronous and asynchronous declaration emission methods bridging JS build tools with the native Rust core.
 * Ingests an EvaluatedSystemSpec and optional strict category list and returns declaration text.
 * Returns deterministic .d.ts text strings without performing filesystem operations.
 */
import { emitDtsNative, primitivesVocabularyNative } from './runtime.js'
import type {
  EmitDtsOptions,
  EvaluatedSystemSpec,
  PrimitivesVocabulary,
  PropValueDomain,
} from './types.js'

export type { EmitDtsOptions, EvaluatedSystemSpec, PrimitivesVocabulary, PropValueDomain }

export function emitDtsSync(options: EmitDtsOptions): string {
  const requestJson = JSON.stringify(options)
  return emitDtsNative(requestJson)
}

export function primitivesVocabulary(): PrimitivesVocabulary {
  return primitivesVocabularyNative()
}

export async function emitDts(options: EmitDtsOptions): Promise<string> {
  return emitDtsSync(options)
}

/**
 * Native Node-API ABI bindings and invocation helpers for type declaration generation.
 * Defines exported symbol manifests and interfaces for raw emit requests.
 * Serializes typegen options into JSON strings for the Rust engine.
 * Receives emitted .d.ts text string without filesystem side effects.
 */
import { callNativeJson, requireNative } from '../../runtime/js/native.js'
import type { PrimitivesVocabulary, TypegenDetailedEmit } from './types.js'

export const TYPEGEN_NATIVE_EXPORTS = [
  'emitDtsSync',
  'emitDtsDetailed',
  'primitivesVocabulary',
] as const

export interface TypegenNative {
  emitDtsSync(requestJson: string): string
  emitDtsDetailed(requestJson: string): string
  primitivesVocabulary(): string
}

export function emitDtsNative(requestJson: string): string {
  const native = requireNative<TypegenNative>('emit typegen')
  return native.emitDtsSync(requestJson)
}

export function emitDtsDetailedNative(requestJson: string): TypegenDetailedEmit {
  return callNativeJson<TypegenDetailedEmit, TypegenNative>('emit typegen with diagnostics', native =>
    native.emitDtsDetailed(requestJson)
  )
}

export function primitivesVocabularyNative(): PrimitivesVocabulary {
  return callNativeJson<PrimitivesVocabulary, TypegenNative>('read typegen vocabulary', native =>
    native.primitivesVocabulary()
  )
}

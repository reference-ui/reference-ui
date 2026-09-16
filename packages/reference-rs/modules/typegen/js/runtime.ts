/**
 * Native Node-API ABI bindings and invocation helpers for type declaration generation.
 * Defines exported symbol manifests and interfaces for raw emit requests.
 * Serializes typegen options into JSON strings for the Rust engine.
 * Receives emitted .d.ts text string without filesystem side effects.
 */
import { requireNative } from '../../runtime/js/native.js'

export const TYPEGEN_NATIVE_EXPORTS = ['emitDtsSync'] as const

export interface TypegenNative {
  emitDtsSync(requestJson: string): string
}

export function emitDtsNative(requestJson: string): string {
  const native = requireNative<TypegenNative>('emit typegen')
  return native.emitDtsSync(requestJson)
}

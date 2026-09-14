/**
 * Native Node-API ABI bindings and invocation helpers for atomic style compilation.
 * Defines exported symbol manifests and interfaces for raw compile requests.
 * Serializes virtual file configurations into JSON strings for the Rust engine.
 * Deserializes compiler output containing generated stylesheets, runtime maps, and diagnostics.
 */
import { callNativeJson } from '../../runtime/js/native'
import type { CompileResult } from './types'

export const ATOMIC_NATIVE_EXPORTS = ['compileSystem'] as const

export interface AtomicNative {
  compileSystem(requestJson: string): string
}

export function compileSystem(requestJson: string): CompileResult {
  return callNativeJson<CompileResult, AtomicNative>('compile atomic', (native) =>
    native.compileSystem(requestJson)
  )
}

/**
 * Native Node-API ABI bindings and invocation helpers for system style compilation.
 * Defines exported symbol manifests and interfaces for raw compile requests.
 * Serializes virtual file configurations into JSON strings for the Rust engine.
 * Deserializes compiler output containing generated stylesheets, runtime maps, and diagnostics.
 */
import { callNativeJson } from '../../runtime/js/native'
import type { CompileResult } from './types'

export const SYSTEM_NATIVE_EXPORTS = ['compileSystem'] as const

export interface SystemNative {
  compileSystem(requestJson: string): string
}

export function compileSystem(requestJson: string): CompileResult {
  return callNativeJson<CompileResult, SystemNative>('compile system', (native) =>
    native.compileSystem(requestJson)
  )
}

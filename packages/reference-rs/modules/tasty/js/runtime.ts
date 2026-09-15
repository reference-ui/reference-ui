/**
 * Native Node-API ABI bindings and invocation helpers for Tasty module generation.
 * Defines exported symbol manifests and interfaces for raw module scanning and emission.
 * Passes root directory paths and include globs to the Rust scanner.
 * Emits raw serialized module maps and diagnostic payloads from the native engine.
 */
import { callNativeJson } from '../../runtime/js/native'

export interface RawScannerDiagnostic {
  file_id: string
  message: string
}

export interface EmittedModulesPayload {
  modules: Record<string, string>
  type_declarations: Record<string, string>
  diagnostics?: RawScannerDiagnostic[]
}

export const TASTY_NATIVE_EXPORTS = ['scanAndEmitModules'] as const

export interface TastyNative {
  scanAndEmitModules(rootDir: string, include: string[]): string
}

export function scanAndEmitModules(
  rootDir: string,
  include: string[]
): Partial<EmittedModulesPayload> {
  return callNativeJson<Partial<EmittedModulesPayload>, TastyNative>(
    'scan and emit modules',
    native => native.scanAndEmitModules(rootDir, include)
  )
}

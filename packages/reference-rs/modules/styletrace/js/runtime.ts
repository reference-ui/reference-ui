/**
 * Native Node-API ABI bindings and invocation helpers for Styletrace analysis.
 * Defines exported symbol manifests and interfaces for wrapper hierarchy tracing.
 * Resolves style-bearing JSX component names through the native Rust engine.
 * Emits serialized component identifiers for the Reference UI style compiler.
 */
import { callNativeJson } from '../../runtime/js/native'

export const STYLETRACE_NATIVE_EXPORTS = ['analyzeStyletrace'] as const

export interface StyletraceNative {
  analyzeStyletrace(rootDir: string, syncRootHint?: string): string
}

export function analyzeStyletrace(rootDir: string, syncRootHint?: string): string[] {
  return callNativeJson<string[], StyletraceNative>('analyze Styletrace data', (native) =>
    native.analyzeStyletrace(rootDir, syncRootHint)
  )
}

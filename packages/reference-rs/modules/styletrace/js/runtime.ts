/**
 * Native Node-API ABI bindings and invocation helpers for Styletrace analysis.
 * Defines exported symbol manifests and interfaces for wrapper hierarchy tracing.
 * Resolves style-bearing JSX component names and module-qualified bindings through the native Rust engine.
 * Emits serialized component identifiers and bindings for the Reference UI style compiler.
 */
import { callNativeJson } from '../../runtime/js/native'
import type { TracedBinding } from './index'

export const STYLETRACE_NATIVE_EXPORTS = [
  'analyzeStyletrace',
  'analyzeStyletraceBindings',
] as const

export interface StyletraceNative {
  analyzeStyletrace(rootDir: string, syncRootHint?: string): string
  analyzeStyletraceBindings(sourceRoot: string, declarationRoot?: string): string
}

export function analyzeStyletrace(rootDir: string, syncRootHint?: string): string[] {
  return callNativeJson<string[], StyletraceNative>('analyze Styletrace data', native =>
    native.analyzeStyletrace(rootDir, syncRootHint)
  )
}

export function analyzeStyletraceBindings(
  sourceRoot: string,
  declarationRoot?: string
): TracedBinding[] {
  return callNativeJson<TracedBinding[], StyletraceNative>(
    'analyze Styletrace bindings',
    native => native.analyzeStyletraceBindings(sourceRoot, declarationRoot)
  )
}

/**
 * Native Node-API ABI bindings and invocation helpers for Styletrace analysis.
 * Defines exported symbol manifests and interfaces for wrapper hierarchy tracing.
 * Resolves style-bearing JSX component names and module-qualified bindings through the native Rust engine.
 * Emits serialized component identifiers and bindings for the Reference UI style compiler.
 */
import { callNativeJson } from '../../runtime/js/native'
import type { StyletraceDetailedResult, TracedBinding } from './index'

export const STYLETRACE_NATIVE_EXPORTS = [
  'analyzeStyletrace',
  'analyzeStyletraceBindings',
  'analyzeStyletraceDetailed',
] as const

export interface StyletraceNative {
  analyzeStyletrace(rootDir: string, syncRootHint?: string): string
  analyzeStyletraceBindings(sourceRoot: string, declarationRoot?: string): string
  analyzeStyletraceDetailed(sourceRoot: string, declarationRoot?: string): string
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

export function analyzeStyletraceDetailed(
  sourceRoot: string,
  declarationRoot?: string
): StyletraceDetailedResult {
  return callNativeJson<StyletraceDetailedResult, StyletraceNative>(
    'analyze Styletrace data with diagnostics',
    native => native.analyzeStyletraceDetailed(sourceRoot, declarationRoot)
  )
}

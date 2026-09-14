/**
 * High-level TypeScript wrapper and orchestration API for the native Reference UI system compiler.
 * Exposes synchronous and asynchronous compilation methods bridging JavaScript build tools with the native Rust core.
 * Handles JSON serialization of compilation requests and deserialization of stylesheets, class maps, and diagnostics.
 */
import { compileSystem } from './runtime.js'
import type { CompileRequest, CompileResult } from './types.js'

export type {
  CompileRequest,
  CompileResult,
  CssRuntime,
  Diagnostic,
  DiagnosticSeverity,
  VirtualSource,
  Want,
} from './types.js'

export function compileSync(request: CompileRequest): CompileResult {
  const requestJson = JSON.stringify(request)
  return compileSystem(requestJson)
}

export async function compile(request: CompileRequest): Promise<CompileResult> {
  return compileSync(request)
}

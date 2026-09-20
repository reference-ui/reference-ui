/**
 * High-level TypeScript wrapper and orchestration API for the native Reference UI atomic compiler.
 * Exposes synchronous and asynchronous compilation methods bridging JavaScript build tools with the native Rust core.
 * Handles JSON serialization of compilation requests and deserialization of stylesheets, class maps, and diagnostics.
 */
import { compileSystem } from './runtime.js'
import type { AnyCompileRequest, CompileResult } from './types.js'

export type {
  AnyCompileRequest,
  CompileRequest,
  CompileResult,
  CssRuntime,
  Diagnostic,
  DiagnosticSeverity,
  EvaluatedSystemSpec,
  LogChannel,
  LowerStep,
  NamerFontTable,
  NamerGuard,
  NamerTables,
  NativeCompileRequest,
  NativeRuntimeArtifact,
  RecipeMatch,
  RecipeRuntimeTable,
  RecipeTable,
  RuntimeDeclaration,
  RuntimeStylePlan,
  VirtualSource,
  Want,
} from './types.js'

export {
  createStylePlanIndex,
  mergeDeclarations,
  mergeStylePlans,
  resolveStyleDeclarations,
  serializeCanonicalJson,
  serializeLookupKey,
  splitSlot,
  type StylePlanQuery,
} from './plans.js'

export function compileSync(request: AnyCompileRequest): CompileResult {
  const requestJson = JSON.stringify(request)
  return compileSystem(requestJson)
}

export async function compile(request: AnyCompileRequest): Promise<CompileResult> {
  return compileSync(request)
}

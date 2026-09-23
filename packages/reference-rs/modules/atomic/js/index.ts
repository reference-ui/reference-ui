/**
 * High-level TypeScript wrapper and orchestration API for the native Reference UI atomic compiler.
 * Exposes synchronous and asynchronous compilation methods bridging JavaScript build tools with the native Rust core.
 * Handles JSON serialization of compilation requests and deserialization of stylesheets, class maps, and diagnostics.
 */
import { compileSystem, releaseScan as releaseScanJson, scanSystem } from './runtime.js'
import type {
  AnyCompileRequest,
  CompileResult,
  ReleaseScanRequest,
  ReleaseScanResponse,
  ScanRequest,
  ScanResponse,
} from './types.js'

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
  ReleaseScanRequest,
  ReleaseScanResponse,
  RuntimeDeclaration,
  RuntimeStylePlan,
  ScanHit,
  ScanManifestEntry,
  ScanRequest,
  ScanResponse,
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

export function scanSync(request: ScanRequest): ScanResponse {
  const requestJson = JSON.stringify(request)
  return scanSystem(requestJson)
}

export async function scan(request: ScanRequest): Promise<ScanResponse> {
  return scanSync(request)
}

export function releaseScanSync(request: ReleaseScanRequest): ReleaseScanResponse {
  const requestJson = JSON.stringify(request)
  return releaseScanJson(requestJson)
}

export async function releaseScan(request: ReleaseScanRequest): Promise<ReleaseScanResponse> {
  return releaseScanSync(request)
}

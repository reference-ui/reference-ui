import { compileSystem } from '../../../runtime/index.js'
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
  const resultJson = compileSystem(requestJson)
  return JSON.parse(resultJson) as CompileResult
}

export async function compile(request: CompileRequest): Promise<CompileResult> {
  return compileSync(request)
}

/**
 * Atlas public entry: analysis functions plus inventory and diagnostic types.
 * Takes project roots with optional configs and emits component lists or
 * detailed results with template diagnostics. Callers needing failure modes
 * use `analyzeDetailed()`; `analyze()` returns components only for convenience.
 */
export { analyze, analyzeDetailed } from './analyzer'
export type {
  AtlasAnalysisResult,
  AtlasDiagnostic,
  AtlasDiagnosticCode,
  Component,
  ComponentInterface,
  ComponentProp,
  AtlasConfig,
  Usage,
} from './types'

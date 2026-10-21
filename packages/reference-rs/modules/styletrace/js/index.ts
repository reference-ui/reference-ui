/**
 * JavaScript interface for the Styletrace JSX wrapper and prop resolution system.
 * Accepts source project paths and staged declaration root directory paths.
 * Coordinates with the native Rust engine to trace wrapper hierarchies and exposed style props.
 * Emits component identifiers and module-qualified bindings recognized by the style system compiler.
 */
import path from 'node:path'

import type { Diagnostic as StyletraceDiagnostic } from '../../diagnostics/js/index.js'
import {
  analyzeStyletrace,
  analyzeStyletraceBindings,
  analyzeStyletraceDetailed,
} from './runtime.js'

export interface TracedBinding {
  module: string
  name: string
}

export type { StyletraceDiagnostic }

export type StyletraceDiagnosticCode =
  | 'STT-W-SKIPPED-FILE'
  | 'STT-E-SCAN-FAILED'
  | 'STT-E-UNRESOLVED-SURFACE'
  | 'STT-W-CLASS-COMPONENT'
  | 'STT-W-UNRESOLVED-HOC-ARGUMENT'
  | 'STT-W-TYPE-EXPANSION-LIMIT'

export interface StyletraceDetailedResult {
  bindings: TracedBinding[]
  diagnostics: StyletraceDiagnostic[]
  /**
   * Each traced export name to the declared prop names it keeps for itself
   * (never forwarded to a style primitive), sorted and unique. Always present;
   * `{}` when no traced component owns a prop.
   */
  owned: Record<string, string[]>
}

export async function traceBindings(
  sourceRoot: string,
  declarationRoot?: string
): Promise<TracedBinding[]> {
  const normalizedSource = path.resolve(sourceRoot)
  const normalizedDecl = declarationRoot ? path.resolve(declarationRoot) : undefined

  return analyzeStyletraceBindings(normalizedSource, normalizedDecl)
}

export async function trace(rootDir: string, syncRootHint?: string): Promise<string[]> {
  const normalizedRoot = path.resolve(rootDir)
  const normalizedSyncRootHint = syncRootHint ? path.resolve(syncRootHint) : undefined

  return analyzeStyletrace(normalizedRoot, normalizedSyncRootHint)
}

export async function traceDetailed(
  sourceRoot: string,
  declarationRoot?: string
): Promise<StyletraceDetailedResult> {
  const normalizedSource = path.resolve(sourceRoot)
  const normalizedDecl = declarationRoot ? path.resolve(declarationRoot) : undefined

  return analyzeStyletraceDetailed(normalizedSource, normalizedDecl)
}

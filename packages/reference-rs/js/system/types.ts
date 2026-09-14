/**
 * TypeScript type definitions for Reference UI system compiler inputs, outputs, and intermediate data structures.
 * Defines contracts for virtual sources, compilation requests, diagnostic reporting, CSS runtime maps, and authored wants.
 * Ensures strict end-to-end type safety across the native N-API boundary and JavaScript tooling.
 */

export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export interface Diagnostic {
  severity: DiagnosticSeverity
  message: string
  file?: string
  line?: number
  column?: number
}

export interface CssRuntime {
  classes?: Record<string, string>
}

export interface Want {
  prop: string
  value: { String: string } | { Number: string } | { Bool: boolean } | 'Null' | unknown
  when: string[]
  important: boolean
  origin?: string
}

export interface VirtualSource {
  path: string
  content: string
}

export interface CompileRequest {
  rootDir?: string
  files?: VirtualSource[]
}

export interface CompileResult {
  stylesheet: string
  css: CssRuntime
  diagnostics: Diagnostic[]
  wants?: Want[]
}

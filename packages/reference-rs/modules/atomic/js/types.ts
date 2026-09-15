/**
 * TypeScript type definitions for Reference UI atomic compiler inputs, outputs, and intermediate data structures.
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

export interface BreakpointObject {
  value?: string
  [k: string]: unknown
}

export type BreakpointsInput =
  | string[]
  | Record<string, string | number | BreakpointObject>

export interface FontInput {
  weights?: Record<string, string>
  css?: Record<string, string>
}

export type FontsInput = Record<string, FontInput>

export interface TokensInput {
  breakpoints?: BreakpointsInput
  fonts?: FontsInput
  [k: string]: unknown
}

export interface BaseSystemInput {
  breakpoints?: BreakpointsInput
  fonts?: FontsInput
  [k: string]: unknown
}

export interface CompileRequest {
  rootDir?: string
  files?: VirtualSource[]
  breakpoints?: BreakpointsInput
  fonts?: FontsInput
  tokens?: TokensInput
  baseSystem?: BaseSystemInput
}

export interface CompileResult {
  stylesheet: string
  css: CssRuntime
  diagnostics: Diagnostic[]
  wants?: Want[]
}

/**
 * TypeScript type definitions for Reference UI atomic compiler inputs, outputs, and intermediate data structures.
 * Defines contracts for virtual sources, compilation requests, diagnostic reporting, CSS runtime maps, recipe tables, and authored wants.
 * `baseSystem` is the design-system dump; omitted means the frozen `@reference-ui/lib` fixture.
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

export interface TokenEntry {
  category: string
  cssVar: string
  light: string
  dark: string
}

export interface FontDefinition {
  value?: string
  weights?: Record<string, string>
  css?: Record<string, string>
}

export interface BreakpointScale {
  names?: string[]
  widths?: Record<string, string>
}

export interface BaseSystemInput {
  name?: string
  tokens?: Record<string, TokenEntry>
  fonts?: Record<string, FontDefinition>
  breakpoints?: BreakpointScale
  conditions?: Record<string, string>
  globalCss?: string[]
  keyframes?: Record<string, string>
  recipes?: Record<string, string>
  /** Property → token names, or `['*']` for every token in that property's category. */
  staticCss?: Record<string, string[]>
}

export interface CompileRequest {
  rootDir?: string
  files?: VirtualSource[]
  baseSystem?: BaseSystemInput
}

export interface RecipeMatch {
  props: Record<string, string>
  className: string
}

export interface RecipeTable {
  name: string
  className: string
  variants: Record<string, Record<string, string>>
  compoundVariants: RecipeMatch[]
  combinations: RecipeMatch[]
}

export interface CompileResult {
  stylesheet: string
  css: CssRuntime
  diagnostics: Diagnostic[]
  wants?: Want[]
  recipes?: RecipeTable[]
}

/**
 * Frozen cross-package contract definitions for Reference RS cutover (PLAN.md §3).
 * Defines TypeScript interfaces for EvaluatedSystemSpec, NativeRuntimeArtifact,
 * CompileResult, PortableBaseSystem, and NativeCompileRequest.
 * Every N and C packet references these types and their committed JSON fixtures.
 * Serves as the single source of truth for serialization shapes across JS and Rust.
 */

export type GlobalDeclarationValue =
  | string
  | number
  | boolean
  | null
  | GlobalDeclarationValue[]
  | { [key: string]: GlobalStyleNode }

export type GlobalStyleNode = Record<string, GlobalDeclarationValue | Record<string, unknown>>

export interface EvaluatedSystemSpec {
  schemaVersion: 1
  profile: 'reference-ui'
  name: string
  /**
   * Upstream system names adopted beneath this spec by `BaseSystem::from_specs`
   * (BAS-EXTEND-*). Absent or empty means standalone; order is declaration order
   * with later upstreams winning. Added by RS-4; existing fixtures omit it.
   */
  extends?: string[]
  tokens: Record<string, unknown>
  fonts: Record<string, unknown>
  breakpoints?: Record<string, string | { value: string }>
  conditions?: Record<string, string>
  globalCss: Array<{
    source: string
    rules: Record<string, GlobalStyleNode>
  }>
  keyframes: Record<string, unknown>
  recipes: Record<string, unknown>
  staticCss: Record<string, string[]>
  provenance: Array<{
    source: string
    kind: 'tokens' | 'fonts' | 'keyframes' | 'globalCss' | 'recipes' | 'fragment'
    keys?: string[]
  }>
}

export interface RuntimeDeclaration {
  slot: string
  className: string
}

export interface RuntimeStylePlan {
  system: string
  when: string[]
  prop: string
  value: unknown
  important: boolean
  declarations: RuntimeDeclaration[]
}

export interface RecipeRuntimeTable {
  qualifiedName: string
  className: string
  base: string
  variantKeys: string[]
  variantMap: Record<string, Record<string, string>>
  defaultVariants: Record<string, string>
  compoundVariants: Array<{
    selection?: Record<string, string>
    variant?: string
    disabled?: string
    css?: Record<string, unknown>
    className?: string
  }>
  combinations: Record<string, string>
}

export interface NativeRuntimeArtifact {
  schemaVersion: 1
  stylePlans: RuntimeStylePlan[]
  recipes: Record<string, RecipeRuntimeTable>
  stylePropNames: string[]
}

export interface Diagnostic {
  message: string
  severity?: 'error' | 'warning' | 'info'
  code?: string
  source?: string
}

export type LogChannel = 'compiler'

export interface CompileResult {
  stylesheet: string
  portableStylesheet: string
  runtime: NativeRuntimeArtifact
  /** Compile-internal plans: the rows the artifact carries, surfaced for proof. */
  stylePlans: RuntimeStylePlan[]
  diagnostics: Diagnostic[]
  wants?: unknown[]
  atomCount?: number
  tracedJsxHosts?: string[]
  compilerDiagnostics?: Diagnostic[]
}

export interface PortableCssChunk {
  system: string
  hash: string
  css: string
}

export interface PortableFragment {
  source: string
  code: string
}

export interface PortableBaseSystem {
  schemaVersion: 1
  name: string
  fragments: PortableFragment[]
  cssChunks: PortableCssChunk[]
  runtime: NativeRuntimeArtifact
  jsxElements: string[]
}

export interface NativeCompileRequest {
  schemaVersion: 1
  spec: EvaluatedSystemSpec
  jsxHosts: string[]
  sourceRoot: string
  declarationRoot: string
  /**
   * Glob scope (RS-10, station ATM-SCAN-01) relative to `sourceRoot`: only
   * matching sources compile and the rest are skipped silently. Absent or
   * empty preserves the legacy scan-all behavior.
   */
  include?: string[]
  /**
   * Opt-in diagnostic channels (S5 backchannel): when `logs` contains
   * 'compiler', the result also carries `compilerDiagnostics`. Unknown
   * channels are ignored so channels evolve additively.
   */
  logs?: LogChannel[]
}

export interface OutputInventory {
  expectedPaths: string[]
  forbiddenPaths: string[]
}

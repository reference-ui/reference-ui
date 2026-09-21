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
  /** Legacy pre-composed selection → classes. New artifacts omit it; the runtime composes from base, variantMap, and compounds. */
  combinations?: Record<string, string>
  /** Width breakpoints with matching `@container` rules, in scale order. The responsive derivation gate. */
  responsiveBreakpoints?: string[]
  /** Legacy per-breakpoint map: axis → breakpoint → value → class. New artifacts omit it; the runtime derives `{bp}:{variantMap[axis][value]}`. */
  responsiveVariantMap?: Record<string, Record<string, Record<string, string>>>
}

/**
 * One lowering step. `scalar: true` (emit/keep only) runs the step for
 * string/number values alone, mirroring the oracle's `extract_raw_val`
 * gate; absent means the step reads every value kind.
 */
export type LowerStep =
  | { on?: NamerGuard; longhands: [string, string, string, string]; shape: 'trbl' }
  | {
      on?: NamerGuard
      longhands: [string, string, string]
      shape: 'trio'
      style: 'border' | 'outline'
    }
  | { on?: NamerGuard; longhands: [string, string]; shape: 'pair' }
  | { on?: NamerGuard; rewrite: Record<string, string> }
  | { on?: NamerGuard; scalar?: boolean; emit: Array<[string, string]> }
  | { on?: NamerGuard; macro: 'font' | 'weight' }
  | { on?: NamerGuard; scalar?: boolean; keep: true }
  | { drop: true }

export type NamerGuard =
  | 'bool:true'
  | 'empty'
  | 'whole'
  /** `{eq}` trims unless the step opts out; only container's `{eq:'true'}` carries `trimmed: false`. */
  | { eq: string; trimmed?: boolean }
  | { in: string }

export interface NamerFontTable {
  weight: string
  weights: Record<string, string>
  css: Array<[string, string]>
}

export interface NamerTables {
  rulesVersion: number
  aliases: Record<string, string>
  prefixes: Record<string, string>
  lowerings: Record<string, LowerStep[]>
  keywords: Record<string, string[]>
  weightKeywords: Array<[string, string]>
  colorProps: string[]
  breakpoints: string[]
  /**
   * Breakpoint name to post-`into_px` width, only where the scale declares
   * one (`base` never present). The range gate reads it: `*Down` / `*Only` /
   * `*To*` consult width parses the class never carries.
   */
  breakpointWidths: Record<string, string>
  /**
   * Known `_` keys verbatim: authored keys plus their underscore twins,
   * unioned with both preset spellings. The request tests membership
   * exactly; the class segment still strips one `_`.
   */
  conditions: string[]
  fonts: Record<string, NamerFontTable>
}

export interface NativeRuntimeArtifact {
  schemaVersion: 2
  /** The closed namer tables both namers read; version-pinned at registration. */
  namer: NamerTables
  recipes: Record<string, RecipeRuntimeTable>
  stylePropNames: string[]
}

export interface Diagnostic {
  message: string
  severity?: 'error' | 'warning' | 'info'
  code?: string
  source?: string
}

export type LogChannel = 'compiler' | 'proof'

export interface CompileResult {
  stylesheet: string
  portableStylesheet: string
  runtime: NativeRuntimeArtifact
  /**
   * Compile-internal plans: the compiler rows, surfaced for proof and the
   * differential. Present only when the request's `logs` includes 'proof';
   * the default slim result omits it (with wants, css, recipes, atomCount).
   */
  stylePlans?: RuntimeStylePlan[]
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
   * 'compiler', the result also carries `compilerDiagnostics`; when it
   * contains 'proof', the result also carries the compile-internal rows
   * (stylePlans, wants, css, recipes, atomCount) stations read. Unknown
   * channels are ignored so channels evolve additively. User configs only
   * accept 'compiler'; 'proof' is a test-observability channel.
   */
  logs?: LogChannel[]
}

export interface OutputInventory {
  expectedPaths: string[]
  forbiddenPaths: string[]
}

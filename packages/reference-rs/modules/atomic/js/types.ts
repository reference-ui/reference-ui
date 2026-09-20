/**
 * TypeScript type definitions for Reference UI atomic compiler inputs, outputs, and intermediate data structures.
 * Defines contracts for virtual sources, compilation requests, diagnostic reporting, CSS runtime maps, recipe tables, and authored wants.
 * `compile()` accepts the legacy `{ baseSystem }` shape and the frozen `NativeCompileRequest` for one wave; both lower to the same native compile.
 */
import type {
  EvaluatedSystemSpec,
  LogChannel,
  LowerStep,
  NamerFontTable,
  NamerGuard,
  NamerTables,
  NativeCompileRequest,
} from '../../../contracts/types.js'

export type {
  EvaluatedSystemSpec,
  LogChannel,
  LowerStep,
  NamerFontTable,
  NamerGuard,
  NamerTables,
  NativeCompileRequest,
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export interface Diagnostic {
  severity: DiagnosticSeverity
  /** Stable failure-class code (`ATM-W-…` / `ATM-E-…`); never parse `message` to filter. */
  code: string
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
  file?: string
  line?: number
  column?: number
}

export interface VirtualSource {
  path: string
  content: string
}

export interface CompileRequest {
  rootDir?: string
  files?: VirtualSource[]
  baseSystem: EvaluatedSystemSpec
  /**
   * Glob scope (RS-10, station ATM-SCAN-01) relative to `rootDir`: only
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
  /**
   * TEMPORARY passthrough (deleted next slice): include the per-atom
   * `stylePlans` rows in `runtime` for readers that still index them.
   * Absent or true keeps the rows; false ships schema 2 without them.
   */
  stylePlansPassthrough?: boolean
}

/** Either wire shape `compile()` accepts: legacy `{ baseSystem, ... }` or frozen `{ schemaVersion: 1, spec, ... }`. */
export type AnyCompileRequest = CompileRequest | NativeCompileRequest

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
  /** Per-breakpoint variant classes: axis → breakpoint → value → class. `base` reads `variantMap`. */
  responsiveVariantMap: Record<string, Record<string, Record<string, string>>>
}

export interface NativeRuntimeArtifact {
  /**
   * TEMPORARY transition (narrowed next slice): the compiler ships 2 while
   * hand-built readers still pin 1.
   */
  schemaVersion: 1 | 2
  /**
   * TEMPORARY optional (required next slice): the closed namer tables. Hand
   * readers built before the tables omit it; every compiler artifact carries it.
   */
  namer?: NamerTables
  recipes: Record<string, RecipeRuntimeTable>
  stylePropNames: string[]
  /**
   * TEMPORARY passthrough (deleted next slice): the per-atom rows for readers
   * that still index them. Required on the type so existing readers keep
   * typechecking; absent at runtime when the compile disables the passthrough.
   */
  stylePlans: RuntimeStylePlan[]
}

export interface CompileResult {
  stylesheet: string
  portableStylesheet?: string
  runtime: NativeRuntimeArtifact
  /** Compile-internal plans: the rows the artifact carries, surfaced for proof. */
  stylePlans: RuntimeStylePlan[]
  css?: CssRuntime
  diagnostics: Diagnostic[]
  wants?: Want[]
  recipes?: RecipeRuntimeTable[]
  /** Distinct AtomSet size. Test observability for ATM-GHOST-04. */
  atomCount?: number
  /** Component names StyleTrace discovered in this compile (ATM-SEAM-05). */
  tracedJsxHosts?: string[]
  /** Opt-in compiler backchannel (S5): present only when requested via `logs`. */
  compilerDiagnostics?: Diagnostic[]
}

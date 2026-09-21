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
   * 'compiler', the result also carries `compilerDiagnostics`; when it
   * contains 'proof', the result also carries the compile-internal rows
   * stations read. Unknown channels are ignored so channels evolve additively.
   */
  logs?: LogChannel[]
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
  /** Table stem. Legacy artifacts ship it; new artifacts omit it and the runtime uses the registry key (always identical). */
  qualifiedName?: string
  /** Axis order. Legacy artifacts ship it; new artifacts omit it and the runtime reads `Object.keys(variantMap)` (always identical, same order). */
  variantKeys?: string[]
  /** Per-axis value names. New artifacts ship names only; the runtime derives each class as `{stem}_{axis[0]}_{value}` plus `{stem}__base`. */
  variantMap: Record<string, string[]>
  /** Authored defaults: axis to its index in the value list (new), or to the value itself (legacy, or unresolvable). */
  defaultVariants: Record<string, number | string>
  compoundVariants: Array<{
    /** Unexpanded predicates (new); the runtime derives the closed class. Absent on legacy records. */
    predicates?: Record<string, string[]>
    selection?: Record<string, string>
    variant?: string
    disabled?: string
    css?: Record<string, unknown>
    className?: string
  }>
  /** Legacy pre-composed selection → classes. New artifacts omit it; the runtime composes from base, variantMap, and compounds. */
  combinations?: Record<string, string>
  /** Width breakpoints with matching `@container` rules, in scale order. The responsive derivation gate. Hoisted to the artifact in new artifacts; table-level wins when present. */
  responsiveBreakpoints?: string[]
  /** Legacy per-breakpoint map: axis → breakpoint → value → class. New artifacts omit it; the runtime derives `{bp}:{variantMap[axis][value]}`. */
  responsiveVariantMap?: Record<string, Record<string, Record<string, string>>>
}

export interface NativeRuntimeArtifact {
  schemaVersion: 2
  /** The closed namer tables both namers read; version-pinned at registration. */
  namer: NamerTables
  recipes: Record<string, RecipeRuntimeTable>
  stylePropNames: string[]
  /** Hoisted width-breakpoint list shared by every table; the responsive derivation gate. */
  responsiveBreakpoints?: string[]
}

export interface CompileResult {
  stylesheet: string
  portableStylesheet?: string
  runtime: NativeRuntimeArtifact
  /**
   * Compile-internal plans: the compiler rows, surfaced for proof and the
   * differential. Present only when the request's `logs` includes 'proof';
   * production reads the sheets, runtime, diagnostics, and hosts. The
   * station harness always requests proof, so specs read this directly.
   */
  stylePlans?: RuntimeStylePlan[]
  /** Per-atom class map. Proof channel only; stations pin css.json goldens off it. */
  css?: CssRuntime
  diagnostics: Diagnostic[]
  /** Extraction rows with origin/file/line. Proof channel only. */
  wants?: Want[]
  /** Top-level recipe tables (same tables as the runtime.recipes map). Proof channel only. */
  recipes?: RecipeRuntimeTable[]
  /** Distinct AtomSet size. Test observability for ATM-GHOST-04. Proof channel only. */
  atomCount?: number
  /** Component names StyleTrace discovered in this compile (ATM-SEAM-05). */
  tracedJsxHosts?: string[]
  /** Opt-in compiler backchannel (S5): present only when requested via `logs`. */
  compilerDiagnostics?: Diagnostic[]
}

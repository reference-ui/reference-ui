// Native contract: the RS-cut request/result/diagnostic types the recipe hands
// to the engine. It takes the frozen contracts surface plus the structural
// carries the dist types trail, and emits the compile call boundary every
// native consumer shares. Nothing here executes; the calls live beside it.

import type {
  NativeCompileRequest,
  NativeRuntimeArtifact,
} from '@reference-ui/rust/contracts'
import type { LogChannel } from '../config/types.ts'
import type { SystemStreams } from '../system/base/types.ts'

// Structural mirror of the frozen VirtualSource: the shape
// sync hands to the engine when it already holds the bytes.
export interface NativeSourceFile {
  path: string
  content: string
}

/**
 * Frozen compile request plus the `include` glob scope. The dist
 * contracts types trail the frozen source, so the seam carries the scope
 * structurally until the RS-owned dist refresh lands.
 */
export interface ScopedCompileRequest extends NativeCompileRequest {
  include: string[]
  /**
   * Opt-in diagnostic channels. Carried structurally like
   * `include`: undefined drops from the serialized request when unset.
   */
  logs?: LogChannel[]
  /**
   * In-memory sources. Carried structurally like `include`:
   * the dist contracts types trail the frozen source, so the seam describes
   * the field here until the RS-owned dist refresh lands.
   */
  files?: NativeSourceFile[]
  /**
   * Native retention ref: exactly-one-of with `files`. The
   * engine drains the retained bytes. Neither means the legacy disk scan.
   */
  retentionToken?: number
  /**
   * Upstream system names (extends then layers, self excluded) the engine
   * qualifies external wants against. Carried structurally like `include`:
   * undefined drops from the serialized request, so a no-upstream compile
   * gains no key and the Rust default `[]` keeps the old path.
   */
  upstreamSystems?: string[]
  /**
   * The upstream systems whose tokens this compile's vocabulary carries: the
   * extends closure, never a layered system. The engine's own token layer also
   * declares on their [data-layer] stamps, so this system's token values win
   * inside their components. Carried structurally like `include`; undefined
   * drops from the serialized request when nothing is extended.
   */
  extendedSystems?: string[]
  /**
   * The names each extended upstream publishes, keyed by system name. The
   * engine drops them from the own roster: an upstream's component renders
   * through that package's runtime. Carried structurally like `include`;
   * undefined drops from the serialized request when no upstream names one.
   */
  upstreamHosts?: Record<string, string[]>
}

export interface NativeDiagnosticSpan {
  start: number
  end: number
}

export interface NativeDiagnosticLabel {
  span: NativeDiagnosticSpan
  message: string
}

export interface NativeDiagnostic {
  severity: 'error' | 'warning' | 'info'
  message: string
  // Stable failure-class code from the Rust code table
  // (`ATM-W-*` warnings, `ATM-E-*` errors, `ATM-I-*` info).
  code?: string
  file?: string
  line?: number
  column?: number
  // Rendering channel: cheap byte offsets plus labeled underlines plus
  // `= help:` lines, resolved to caret positions only when presented.
  span?: NativeDiagnosticSpan
  labels?: NativeDiagnosticLabel[]
  help?: string[]
}

export interface NativeCompileResult {
  stylesheet: string
  portableStylesheet?: string
  /** Own-system layer blocks with both token variants. Required: schema 2 guarantees presence. */
  streams: SystemStreams
  runtime: NativeRuntimeArtifact
  diagnostics: NativeDiagnostic[]
  /**
   * Wrapper hosts StyleTrace discovered inside `compile()`, sorted and
   * unique. Absent on engines older than the discovery slice; publish
   * treats a missing field as no traced hosts.
   */
  tracedJsxHosts?: string[]
  /**
   * Prop names each traced wrapper keeps for itself, by component name, sorted
   * and unique. Absent on engines older than the owned-props slice; publish
   * treats a missing field as nothing owned.
   */
  tracedJsxOwned?: Record<string, string[]>
  /**
   * Compiler-channel diagnostics, present only when `logs` requested them.
   * The engine omits this field for userspace-only compiles; sync counts
   * its entries in the one-line warning summary and lists them behind
   * the compiler tag under --verbose, without touching the userspace
   * warning collapse.
   */
  compilerDiagnostics?: NativeDiagnostic[]
}

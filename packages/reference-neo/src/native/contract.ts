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

// Structural mirror of the frozen VirtualSource (C3 single read): the shape
// sync hands to the engine when it already holds the bytes.
export interface NativeSourceFile {
  path: string
  content: string
}

/**
 * Frozen compile request plus the RS-10 `include` glob scope. The dist
 * contracts types trail the frozen source, so the seam carries the scope
 * structurally until the RS-owned dist refresh lands.
 */
export interface ScopedCompileRequest extends NativeCompileRequest {
  include: string[]
  /**
   * Opt-in diagnostic channels (S5 backchannel). Carried structurally like
   * `include`: undefined drops from the serialized request when unset.
   */
  logs?: LogChannel[]
  /**
   * In-memory sources (C3 single read). Carried structurally like `include`:
   * the dist contracts types trail the frozen source, so the seam describes
   * the field here until the RS-owned dist refresh lands.
   */
  files?: NativeSourceFile[]
  /**
   * Native retention ref (C3-in-reverse): exactly-one-of with `files`. The
   * engine drains the retained bytes. Neither means the legacy disk scan.
   */
  retentionToken?: number
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
   * Compiler-channel diagnostics, present only when `logs` requested them.
   * The engine omits this field for userspace-only compiles; sync counts
   * its entries in the one-line warning summary and lists them behind
   * the compiler tag under --verbose, without touching the userspace
   * warning collapse.
   */
  compilerDiagnostics?: NativeDiagnostic[]
}

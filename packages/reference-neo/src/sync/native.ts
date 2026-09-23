// Native compile seam over the reference-rs atomic module.
// It takes the frozen compile request and emits the compiled stylesheet bundle.
// The rs dist type entries cannot resolve under NodeNext, so this seam
// imports the runtime dynamically and describes the call boundary structurally.

import type {
  NativeCompileRequest,
  NativeRuntimeArtifact,
} from '@reference-ui/rust/contracts'
import type { LogChannel } from '../config/types.ts'

// Structural mirror of the frozen VirtualSource (C3 single read): the shape
// sync hands to the engine when it already holds the bytes. Also kept for
// compile-files.ts, which still collects include-scoped sources.
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
   * The engine omits this field for userspace-only compiles; sync prints
   * its entries as `[neo] compiler` lines without touching the userspace
   * warning collapse.
   */
  compilerDiagnostics?: NativeDiagnostic[]
}

interface AtomicModule {
  compile(request: NativeCompileRequest): Promise<NativeCompileResult>
}

interface AtomicReleaseModule {
  releaseScan(request: { retentionToken: number }): Promise<{ released: boolean }>
}

export async function compileNative(request: NativeCompileRequest): Promise<NativeCompileResult> {
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule
  return atomic.compile(request)
}

/**
 * Release a live scan retention without draining. Error-path-only: the sync
 * `finally` between scan and compile; never on the happy path.
 */
export async function releaseRetention(token: number): Promise<{ released: boolean }> {
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicReleaseModule
  return atomic.releaseScan({ retentionToken: token })
}

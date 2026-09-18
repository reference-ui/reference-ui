// Native compile seam over the reference-rs atomic module.
// It takes the frozen compile request and emits the compiled stylesheet bundle.
// The rs dist type entries cannot resolve under NodeNext, so this seam
// imports the runtime dynamically and describes the call boundary structurally.

import type {
  NativeCompileRequest,
  NativeRuntimeArtifact,
} from '@reference-ui/rust/contracts'

// Kept for compile-files.ts, which still collects include-scoped sources;
// the frozen request carries roots plus include globs instead of files.
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
}

export interface NativeDiagnostic {
  severity: 'error' | 'warning' | 'info'
  message: string
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
}

interface AtomicModule {
  compile(request: NativeCompileRequest): Promise<NativeCompileResult>
}

export async function compileNative(request: NativeCompileRequest): Promise<NativeCompileResult> {
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule
  return atomic.compile(request)
}

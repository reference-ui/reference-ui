// Neo diagnostic types: the one typed vocabulary above the native cut.
// It takes the compile-boundary wire shape and emits the legacy working
// alias plus the validated typed form the transport enforces. Channels name
// the three producers the CLI collapses into one report, while options and
// dedupe groups ride here so presentation and reporting share them cyclessly.
import type { NativeDiagnostic } from '../native/contract.ts'

/**
 * Working diagnostic above the cut: the compile boundary shape, verbatim.
 * `code` stays optional and `info` stays legal here because the landed
 * channels still carry codeless tasty strings and compiler telemetry.
 */
export type NeoDiagnostic = NativeDiagnostic

/** Severity the typed form admits: warnings continue, errors refuse. */
export type TypedSeverity = 'warning' | 'error'

/**
 * Byte offsets into one source file: `start` inclusive, `end` exclusive,
 * both in UTF-8 bytes. Zero-width spans point at one caret position.
 * Recorded cheaply below the cut; resolved to line and column above it.
 */
export interface DiagnosticSpan {
  start: number
  end: number
}

/**
 * One labeled underline inside a rendered frame: the byte range plus the
 * note beneath it.
 */
export interface DiagnosticLabel {
  span: DiagnosticSpan
  message: string
}

/**
 * Validated diagnostic: severity plus a `NS-SEV-NAME` code plus a non-blank
 * message, with the optional source location and the rendering channel.
 * Construction and parsing both validate, so a value of this type is always
 * shippable across the cut.
 */
export interface TypedDiagnostic {
  severity: TypedSeverity
  code: string
  message: string
  file?: string
  line?: number
  column?: number
  span?: DiagnosticSpan
  labels?: DiagnosticLabel[]
  help?: string[]
}

/** The three producers the CLI collapses into one warning report. */
export type DiagnosticChannel = 'userspace' | 'compiler' | 'ref'

/** Warning-report options, threaded from `ref sync --verbose`. */
export interface DiagnosticReportOptions {
  verbose?: boolean
}

/** One deduped group: the first-seen entry plus its repeat count. */
export interface DeduplicatedDiagnostic {
  entry: NeoDiagnostic
  count: number
}

/**
 * Structural compile-result view the pull reads. Both diagnostic lists are
 * readonly because the pull never mutates the engine result it inspects.
 */
export interface CompileResultView {
  diagnostics: readonly NeoDiagnostic[]
  compilerDiagnostics?: readonly NeoDiagnostic[]
}

/**
 * Structural tasty-diagnostic view the ref push reads. Scanner and manifest
 * items both ride the typed shape now: severity plus a `TST-*` code plus the
 * message, with the source location and rendering channel when present.
 */
export interface TastyDiagnosticView {
  level: 'warning' | 'error'
  code: string
  message: string
  file?: string
  line?: number
  column?: number
  span?: DiagnosticSpan
  labels?: DiagnosticLabel[]
  help?: string[]
}

/**
 * Core type definitions for the Reference RS case testing framework.
 * Defines standard contracts for test case discovery, context resolution,
 * semantic spec verification, standing invariant gauges, and golden artifacts.
 * These types establish a uniform testing lifecycle across all compiler modules.
 */

/**
 * Execution context provided to case hooks and specs.
 */
export interface StationContext {
  /** Folder name, e.g. "ATM-LEAF-01" */
  caseName: string
  /** Extracted ID prefix, e.g. "ATM-LEAF-01" */
  caseId: string
  /** Absolute path to the case root */
  caseDir: string
  /** Absolute path to case input directory */
  inputDir: string
  /** Absolute path to case output directory */
  outputDir: string
}

/**
 * Contract implemented by every case's spec.ts.
 */
export interface StationSpec<TResult> {
  /** Primary SPEC.md ID anchor (must match folder prefix) */
  id: string
  /** Secondary or related SPEC IDs proved by this case */
  ids?: string[]
  /** Domain-specific assertions executed against the compilation result */
  verify(result: TResult, context: StationContext): void | Promise<void>
}

/**
 * Declared golden artifact emitted by the compiler.
 */
export interface GoldenDefinition<TResult> {
  /** Filename relative to output/, e.g. "styles.css", "analysis.json" */
  fileName: string
  /** Serialization format */
  format: 'text' | 'json'
  /** Extracts the data payload from the compiler result */
  extract(result: TResult): unknown
}

/**
 * Universal invariant gauge enforced across every case in a suite.
 */
export type StandingGauge<TResult> = (
  result: TResult,
  context: StationContext
) => void | Promise<void>

/**
 * Suite configuration for createStationSuite().
 */
export interface StationSuiteConfig<TResult> {
  /** Top-level Vitest describe block label */
  suiteName: string
  /** Absolute path to cases/ directory */
  casesDir: string
  /** Folder discovery regex; group 1 is the case id (default: ATL-BAR-01 style). */
  folderPattern?: RegExp
  /** Compiles or executes the case on-demand */
  compile(context: StationContext): Promise<TResult>
  /** Goldens verified or written for each case */
  goldens: GoldenDefinition<TResult>[]
  /** Universal invariants executed on every case */
  standingGauges?: StandingGauge<TResult>[]
  /** Mandatory files required inside each case folder */
  requiredFiles?: string[]
  /** Normalizer applied to golden text and JSON serialization before diffing or writing */
  normalizeText?(content: string, fileName: string, context: StationContext): string
  /** Known-invalid CSS fragments allowed when writing stylesheet goldens */
  allowedCssProblems?(context: StationContext): readonly string[]
}

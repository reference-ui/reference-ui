// Shared shapes for the Neo fragment collector seam.
// It takes nothing and emits the collector, scan, and bundle contracts.
// This module is a Neo-owned copy of the core fragment types trimmed of config templating.

export const CONFIG_FRAGMENT_SOURCE_PROPERTY = '__refConfigFragmentSource'

export interface FragmentCollectorConfig<TInput = unknown, TOutput = TInput> {
  name: string
  targetFunction?: string
  globalKey?: string
  logLabel?: string
  /** Transform collected fragments before returning them. Defaults to identity (input === output). */
  transform?: (input: TInput) => TOutput
}

export interface FragmentCollector<TInput = unknown, TOutput = TInput> {
  (fragment: TInput): void
  config: {
    name: string
    globalKey: string
    logLabel: string
    targetFunction?: string
    transform?: (input: TInput) => TOutput
  }
  collect: (fragment: TInput) => void
  init: () => void
  getFragments: () => TOutput[]
  cleanup: () => void
  /** Returns the JS snippet that initialises this collector's globalThis slot in generated files */
  toScript: () => string
  /** Returns the JS snippet that defines the runtime function bundled files call */
  toRuntimeFunction: () => string
  /** Returns an IIFE that retrieves and transforms fragments from globalThis (for templates) */
  toGetter: () => string
}

export interface ScanOptions {
  /** Glob patterns to search (e.g. from config.include) */
  include: string[]
  /** Function call names to look for (e.g. ['tokens', 'recipe']). Used when importFrom is not provided. */
  functionNames?: string[]
  /** Module ids to detect in import statements (e.g. '@reference-ui/neo'). Preferred discovery mode. */
  importFrom?: string | string[]
  /** Glob patterns to exclude. Defaults to node_modules-only; the d.ts match exclusion is emulated. */
  exclude?: string[]
  /** Working directory for glob resolution. Default: process.cwd() */
  cwd?: string
}

/** A bundled fragment file — the source bundled to a self-contained IIFE string */
export interface FragmentBundle {
  /** Absolute path of the original source file */
  file: string
  /** Self-contained IIFE JS bundle (functions intact, all imports inlined) */
  bundle: string
}

/** Bundle-only API: pass resolved file paths, get portable IIFE bundle strings back */
export interface BundleFragmentsOptions {
  files: string[]
  /** Alias module ids to paths when bundling (e.g. @reference-ui/neo → API entry). */
  alias?: Record<string, string>
  /** Additional externals to avoid bundling. Esbuild requires string[] only. */
  external?: string[]
}

/** Single-collector API: pass resolved file paths + one collector, get TOutput[] back */
export interface CollectOptions<TInput = unknown, TOutput = TInput> {
  files: string[]
  collector: FragmentCollector<TInput, TOutput>
  tempDir: string
  /** Alias module ids to paths when bundling (avoids pulling in full config/esbuild). */
  alias?: Record<string, string>
  /** Additional externals when bundling. */
  external?: string[]
}

/**
 * Minimum interface required by the planner. Use this so any FragmentCollector is accepted
 * without needing explicit casts (variance prevents FragmentCollector<A, B> → FragmentCollector<unknown, unknown>).
 */
export interface CollectorForPlanner {
  config: { name: string; targetFunction?: string; [k: string]: unknown }
  init: () => void
  getFragments: () => unknown[]
  cleanup: () => void
}

/** Planner API: pass multiple collectors + glob patterns, get Record<name, T[]> back */
export interface CollectOptionsPlanner {
  collectors: CollectorForPlanner[]
  include: string[]
  /** Module ids to detect in import statements. When provided, planner discovery uses imports instead of function names. */
  importFrom?: string | string[]
  tempDir: string
  /** Working directory for glob resolution. Default: process.cwd() */
  cwd?: string
}

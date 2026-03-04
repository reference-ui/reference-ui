export interface FragmentCollectorConfig {
  name: string
  targetFunction?: string
  globalKey?: string
  logLabel?: string
}

export interface FragmentCollector<T = unknown> {
  (fragment: T): void
  config: {
    name: string
    globalKey: string
    logLabel: string
    targetFunction?: string
  }
  collect: (fragment: T) => void
  init: () => void
  getFragments: () => T[]
  cleanup: () => void
}

export interface ScanOptions {
  /** Glob patterns to search (e.g. from config.include) */
  include: string[]
  /** Function call names to look for (e.g. ['tokens', 'recipe']) */
  functionNames: string[]
  /** Glob patterns to exclude node_modules and declaration files. Defaults to node_modules and .d.ts globs. */
  exclude?: string[]
  /** Working directory for glob resolution. Default: process.cwd() */
  cwd?: string
}

/** Single-collector API: pass resolved file paths + one collector, get T[] back */
export interface CollectOptions<T = unknown> {
  files: string[]
  collector: FragmentCollector<T>
  tempDir: string
}

/** Planner API: pass multiple collectors + glob patterns, get Record<name, T[]> back */
export interface CollectOptionsPlanner {
  collectors: FragmentCollector<unknown>[]
  include: string[]
  tempDir: string
  /** Working directory for glob resolution. Default: process.cwd() */
  cwd?: string
}

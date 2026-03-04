export interface FragmentCollectorConfig {
  /**
   * Unique identifier for this collector (e.g., 'panda-config', 'box-patterns')
   */
  name: string

  /**
   * Function name to scan for in user code (e.g. 'tokens', 'recipe').
   * Used by the planner API to find files that call this collector.
   */
  targetFunction?: string

  /**
   * Global key used to store the collector array on globalThis.
   * Defaults to __ref${capitalize(targetFunction ?? name)}Collector when omitted.
   */
  globalKey?: string

  /**
   * Optional logging label for debug output (defaults to `fragments:${name}`)
   */
  logLabel?: string
}

export interface ScanOptions {
  /**
   * Directories to scan for fragment calls
   */
  directories: string[]

  /**
   * Function names to scan for (e.g., ['extendPandaConfig', 'tokens'])
   */
  functionNames: string[]

  /**
   * File patterns to include (default: ['**\/*.{ts,tsx}'])
   */
  include?: string[]

  /**
   * File patterns to exclude (default: ['**\/node_modules/**', '**\/*.d.ts'])
   */
  exclude?: string[]
}

export interface CollectOptions<T = unknown> {
  /**
   * Files to execute and collect fragments from
   */
  files: string[]

  /**
   * Fragment collector to use
   */
  collector: FragmentCollector<T>

  /**
   * Temporary directory for bundled files (default: cwd/.ref/fragments)
   */
  tempDir?: string
}

/**
 * Planner API: collect using glob patterns and multiple collectors.
 * Returns keyed object { [collectorName]: T[] }.
 */
export interface CollectOptionsPlanner<T = unknown> {
  /**
   * Collectors to run (each collector's targetFunction is scanned for).
   */
  collectors: FragmentCollector<T>[]

  /**
   * Glob patterns for files to scan (e.g. config.include from ui.config.ts).
   */
  include: string[]

  /**
   * Temporary directory for bundled files (default: cwd/.ref/fragments)
   */
  tempDir?: string
}

export interface FragmentCollector<T = unknown> {
  /**
   * Call signature: users call this in code: `tokens({ ... })`
   */
  (fragment: T): void

  /**
   * Configuration for this collector
   */
  readonly config: FragmentCollectorConfig

  /**
   * Function users call to register fragments (same as calling the collector).
   */
  collect(fragment: T): void

  /**
   * Initialize the collector on globalThis (must be called before bundled code runs)
   */
  init(): void

  /**
   * Get collected fragments and clean up globalThis
   */
  getFragments(): T[]

  /**
   * Clean up globalThis (removes the collector)
   */
  cleanup(): void
}

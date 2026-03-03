export interface FragmentCollectorConfig {
  /**
   * Unique identifier for this collector (e.g., 'panda-config', 'box-patterns')
   */
  name: string

  /**
   * Global key used to store the collector array on globalThis.
   * Should be unique and prefixed to avoid collisions (e.g., '__refPandaConfig')
   */
  globalKey: string

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

export interface FragmentCollector<T = unknown> {
  /**
   * Configuration for this collector
   */
  readonly config: FragmentCollectorConfig

  /**
   * Function users call to register fragments.
   * This is what gets called in user code: `tokens({ ... })`
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

/**
 * Bundler interface - all bundler implementations must satisfy this contract.
 * Extensible for new bundlers without modifying core.
 */

/** Configuration written to disk for a specific bundler */
export interface BundlerConfig {
  /** Contents of config file (e.g. vite.config.ts, webpack.config.js) */
  configContent: string
  /** Filename for the config */
  configFilename: string
}

/** Bundler implementation contract */
export interface Bundler {
  readonly name: string
  /** Generate bundler config for the project */
  getConfig(reactVersion: string): BundlerConfig
  /** Build command (e.g. ['npm', 'run', 'build']) */
  getBuildCommand(projectRoot: string): string[]
  /** Dev server command and args */
  getDevServerCommand(projectRoot: string, port: number): string[]
}

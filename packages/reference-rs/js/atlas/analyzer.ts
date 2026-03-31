import type { Component, AtlasConfig } from './types'

/**
 * Analyze a project and return a usage profile for every tracked component.
 *
 * Local project files are always indexed. Pass `config.include` to also track
 * library components, and `config.exclude` to suppress specific patterns.
 *
 * @param rootDir - Absolute path to the project root to analyze.
 * @param config  - Optional include/exclude filter config.
 */
export async function analyze(
  _rootDir: string,
  _config?: AtlasConfig
): Promise<Component[]> {
  throw new Error('Atlas.analyze() is not yet implemented')
}

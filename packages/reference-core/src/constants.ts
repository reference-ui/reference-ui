/** Shared constants for Reference UI output layout and tooling. */

/**
 * Unscoped names of generated packages (`@reference-ui/<name>`). Each matches the
 * folder under the sync out dir and the entry under `node_modules/@reference-ui/`
 * (see packager `installPackages`).
 */
export const GENERATED_PACKAGE_NAMES = [
  'react',
  'system',
  'styled',
  'types',
] as const

/**
 * Generated output directories under `.reference-ui/` whose raw file writes
 * should not trigger immediate bundler refresh handling.
 *
 * Includes {@link GENERATED_PACKAGE_NAMES} plus non-package roots written under
 * the same out dir (e.g. `mcp`, `virtual`).
 */
export const GENERATED_OUTPUT_ROOTS = [
  ...GENERATED_PACKAGE_NAMES,
  'mcp',
  'virtual',
] as const

export const DEFAULT_OUT_DIR = '.reference-ui'

/**
 * Picomatch-style glob for the sync output directory under any ancestor (watchers,
 * virtual copy, Panda fragment scan excludes).
 */
export const SYNC_OUTPUT_DIR_GLOB = `**/${DEFAULT_OUT_DIR}/**`

// Shared constants for Neo config bundling and output layout.
// It takes nothing and emits the out-dir default plus the defineConfig externals.
// This module is a Neo-owned copy of the core config constants with Neo ids added.

export { DEFAULT_OUT_DIR } from '../constants.ts'

/**
 * Package ids that are (1) left external when bundling user config and
 * (2) aliased to the Neo author entry when bundling, so config can
 * use defineConfig without pulling in a full host. Core ids stay so
 * author ui.config files keep working unchanged.
 */
export const CONFIG_EXTERNALS = [
  '@reference-ui/core',
  '@reference-ui/core/config',
  '@reference-ui/cli',
  '@reference-ui/cli/config',
  '@reference-ui/neo',
  '@reference-ui/neo/config',
] as const

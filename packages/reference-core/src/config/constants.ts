// Shared constants for Core config bundling and output layout.
// It takes nothing and emits the out-dir default plus the defineConfig externals.

export { DEFAULT_OUT_DIR } from '../constants.ts'

/**
 * Package ids that are (1) left external when bundling user config and
 * (2) aliased to the Core root barrel when bundling, so config can
 * use defineConfig without pulling in a full host. The cli ids stay so
 * author ui.config files keep working unchanged.
 */
export const CONFIG_EXTERNALS = [
  '@reference-ui/core',
  '@reference-ui/core/config',
  '@reference-ui/cli',
  '@reference-ui/cli/config',
] as const

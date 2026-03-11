/**
 * Default output directory for CLI artefacts.
 * Not user-configurable; used for virtual, generated config, etc.
 */
export const DEFAULT_OUT_DIR = '.reference-ui'

/**
 * Package ids that are (1) left external when bundling user config and
 * (2) provided with { defineConfig } when evaluating the bundled config,
 * so config can use defineConfig without pulling in full core/cli.
 */
export const CONFIG_EXTERNALS = [
  '@reference-ui/core',
  '@reference-ui/core/config',
  '@reference-ui/cli',
  '@reference-ui/cli/config',
] as const
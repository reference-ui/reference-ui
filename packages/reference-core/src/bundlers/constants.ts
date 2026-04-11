/** Shared constants for bundler integrations that consume Reference UI outputs. */

/**
 * Generated output directories under `.reference-ui/` whose raw file writes
 * should not trigger immediate bundler refresh handling.
 */
export const GENERATED_OUTPUT_ROOTS = [
  'react',
  'system',
  'styled',
  'types',
  'mcp',
  'virtual',
] as const

export const DEFAULT_OUT_DIR = '.reference-ui'
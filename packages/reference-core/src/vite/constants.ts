/** Shared constants for the Reference UI Vite integration. */

export { DEFAULT_OUT_DIR, GENERATED_OUTPUT_ROOTS } from '../constants'

/**
 * Package ids that should stay out of Vite's dependency optimizer.
 *
 * These are real import specifiers used by app code, and they resolve through
 * the generated/symlinked package surface under node_modules/@reference-ui/*.
 */
export const MANAGED_PACKAGES = [
  '@reference-ui/react',
  '@reference-ui/system',
  '@reference-ui/styled',
  '@reference-ui/types',
] as const

/**
 * Generated output directories under `.reference-ui/` whose raw file writes
 * should not trigger immediate HMR handling.
 *
 * There is intentional overlap with `MANAGED_PACKAGES` for the generated
 * package directories (`react`, `system`, `styled`, `types`), but this list is
 * broader: it also includes generated non-package outputs like `mcp` and
 * `virtual` so Vite ignores churn there until ref sync reports a logical ready
 * state.
 */
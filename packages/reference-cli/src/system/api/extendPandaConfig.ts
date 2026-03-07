/**
 * No-op stub for panda/api helpers (keyframes, globalCss, etc.).
 * Config generation uses only the tokens collector; these slices are not merged.
 * Kept so keyframes/globalCss/utilities/staticCss/globalFontface can be called without error.
 */

// No-op: generated panda.config only merges tokens from the tokens collector.
export function extendPandaConfig(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentional no-op
  _config: Record<string, unknown>
): void {}

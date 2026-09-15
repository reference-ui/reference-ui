/**
 * Reference-only custom macro properties for compiler passes.
 * Defines style props recognized by Reference UI that do not map directly to CSS properties.
 * Includes component variant discriminators, token scale keys, and theme mode overrides.
 */

export const REFERENCE_ONLY_PROPS = [
  'colorMode',
  'r',
  'size',
  'variant',
  'weight',
] as const;

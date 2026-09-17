// Default external modules for Neo microbundle builds.
// It takes nothing and emits the heavy deps bundling leaves alone.
// This module is a Neo-owned copy of the core externals list.

/** Default externals: heavy build-tool deps we typically don't want to inline. */
export const DEFAULT_EXTERNALS: string[] = [
  'esbuild',
  'fast-glob',
  'react',
  'react-dom',
]

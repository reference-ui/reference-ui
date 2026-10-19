// Default external modules for Core microbundle builds.
// It takes nothing and emits the heavy deps bundling leaves alone.

/** Default externals: heavy build-tool deps we typically don't want to inline. */
export const DEFAULT_EXTERNALS: string[] = [
  'esbuild',
  'fast-glob',
  'react',
  'react-dom',
]

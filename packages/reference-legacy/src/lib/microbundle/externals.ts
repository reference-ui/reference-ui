/** Default externals: heavy build-tool / CLI deps we typically don't want to inline. */
export const DEFAULT_EXTERNALS: string[] = [
  '@pandacss/dev',
  'esbuild',
  'fast-glob',
  'tsup',
  'unconfig',
  'unrun',
  'birpc',
]

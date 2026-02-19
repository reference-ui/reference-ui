export default {
  entry: ['src/entry/index.ts', 'src/cli/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  // Don't clean during builds to avoid deleting the running CLI during sync
  clean: false,
  // External deps: avoid bundling so CJS deps (e.g. fast-glob) don't bring __filename into ESM bundle
  external: ['esbuild', 'fast-glob', 'chokidar', 'typescript'],
  inlineOnly: false,
}

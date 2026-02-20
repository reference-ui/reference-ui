export default {
  entry: ['src/cli/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  // Don't clean during builds to avoid deleting the running CLI during sync
  clean: false,
  // External deps: avoid bundling so CJS deps don't get mangled in ESM bundle
  external: ['esbuild', 'fast-glob', 'chokidar', 'typescript', 'commander', 'picocolors'],
  inlineOnly: false,
}

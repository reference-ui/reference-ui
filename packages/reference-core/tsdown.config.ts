export default {
  entry: ['src/entry/index.ts', 'src/cli/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  // Don't clean during builds to avoid deleting the running CLI during sync
  clean: false,
  // External dependencies that shouldn't be bundled
  external: ['esbuild'],
  inlineOnly: false,
}

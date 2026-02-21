export default {
  entry: ['src/cli/index.ts', 'src/cli/virtual/worker.mjs', 'src/cli/virtual/init.ts'],
  outDir: 'dist/cli',
  format: ['esm', 'cjs'],
  dts: true,
  // Don't clean during builds to avoid deleting the running CLI during sync
  clean: false,
  // External deps: avoid bundling so CJS deps don't get mangled in ESM bundle
  external: [
    'esbuild',
    'fast-glob',
    'chokidar',
    'typescript',
    'commander',
    'picocolors',
    'piscina',
    'bundle-n-require',
  ],
  inlineOnly: false,
}

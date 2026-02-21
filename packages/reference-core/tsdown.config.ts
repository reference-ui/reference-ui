export default {
  entry: ['src/cli/index.ts', 'src/cli/virtual/worker.mjs'],
  outDir: 'dist/cli',
  format: ['esm', 'cjs'],
  dts: true,
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

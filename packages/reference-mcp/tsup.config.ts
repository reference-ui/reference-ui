import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli/index.ts',
    'mcp-child': 'src/child-process/entry.ts',
  },
  format: 'esm',
  outDir: 'dist',
  platform: 'node',
  target: 'node18',
  splitting: false,
  sourcemap: true,
  outExtension() {
    return { js: '.mjs' }
  },
  dts: false,
})

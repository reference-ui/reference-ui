import { readFile } from 'node:fs/promises'
import { defineConfig } from 'tsup'

// Bundle the 5.27MB MiniSearch dump as raw text (single JSON.parse at load)
// instead of an inlined object literal + load-time stringify/reparse. Scoped
// to this one file: every other .json import in the graph keeps its loader.
const iconsIndexText = {
  name: 'icons-index-text',
  setup(build: any) {
    build.onLoad({ filter: /icons-index\.json$/ }, async args => ({
      contents: await readFile(args.path, 'utf8'),
      loader: 'text',
    }))
  },
}

export default defineConfig({
  esbuildPlugins: [iconsIndexText],
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

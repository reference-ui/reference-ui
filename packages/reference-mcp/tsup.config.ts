import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsup'

const here = dirname(fileURLToPath(import.meta.url))
const neo = (p: string) => resolve(here, '../reference-neo/src', p)

// F1 specifier wiring: the virtual `@reference-ui/neo/*` ids resolve to Neo
// source files at build time (mirrors tsconfig paths). Aliased modules bundle
// into dist (F4: shipped installs carry no neo dependency); bare externals
// (esbuild, fast-glob, @reference-ui/rust/*, node builtins) stay external.
const NEO_ALIAS: Record<string, string> = {
  '@reference-ui/neo/config/store': neo('config/store.ts'),
  '@reference-ui/neo/config/errors': neo('config/errors.ts'),
  '@reference-ui/neo/config/evaluate': neo('config/evaluate.ts'),
  '@reference-ui/neo/config/validate': neo('config/validate.ts'),
  '@reference-ui/neo/config/constants': neo('config/constants.ts'),
  '@reference-ui/neo/config/types': neo('config/types.ts'),
  '@reference-ui/neo/reference': neo('reference/api.ts'),
  '@reference-ui/neo/fragments/runner': neo('fragments/lib/runner.ts'),
  '@reference-ui/neo/fragments/scanner': neo('fragments/lib/scanner.ts'),
  '@reference-ui/neo/fragments/tokens': neo('fragments/api/tokens.ts'),
  '@reference-ui/neo/microbundle': neo('lib/microbundle/index.ts'),
}

const neoAlias = {
  name: 'neo-alias',
  setup(build: any) {
    for (const [id, path] of Object.entries(NEO_ALIAS)) {
      const filter = new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
      build.onResolve({ filter }, () => ({ path }))
    }
  },
}

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
  esbuildPlugins: [neoAlias, iconsIndexText],
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli/index.ts',
    'mcp-child': 'src/child-process/entry.ts',
    // Neo author entry as a real file: mcp-side esbuild alias maps (ui.config
    // bundling, token-fragment bundling) point at this artifact at runtime.
    'neo-author': '../reference-neo/src/author/index.ts',
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

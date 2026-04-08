import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))
const coreDir = resolve(__dirname, '../reference-core')
const reactRoot = resolve(__dirname, '.reference-ui/react')
const styledRoot = resolve(__dirname, '.reference-ui/styled')
const styledStylesCss = resolve(styledRoot, 'styles.css')
const typesRoot = resolve(__dirname, '.reference-ui/types')

/**
 * In dev (Cosmos), resolve the generated React runtime and Panda CSS directly from
 * .reference-ui instead of repackaged bundles under node_modules.
 *
 * `@reference-ui/types` must point at the built `types.mjs`, not `src/entry/types.ts` — aliasing
 * the TS entry pulls `reference/browser` in as many separate `@fs` modules; after HMR those can
 * duplicate `React.createContext` and break ReferenceRuntimeProvider until a full reload.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: '@reference-ui/react/styles.css', replacement: styledStylesCss },
      // Subpaths first: `@reference-ui/styled/css` etc. (required when react entry is aliased to core source)
      { find: '@reference-ui/styled/', replacement: `${styledRoot}/` },
      { find: '@reference-ui/styled', replacement: styledRoot },
      { find: '@reference-ui/types/', replacement: `${typesRoot}/` },
      { find: '@reference-ui/types', replacement: resolve(typesRoot, 'types.mjs') },
      { find: '@reference-ui/system', replacement: resolve(coreDir, 'src/entry/system.ts') },
      { find: '@reference-ui/react', replacement: resolve(reactRoot, 'react.mjs') },
    ],
  },
  optimizeDeps: {
    exclude: ['@reference-ui/react', '@reference-ui/system', '@reference-ui/types', '@reference-ui/styled'],
  },
})

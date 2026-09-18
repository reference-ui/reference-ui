import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { referenceVite } from '@reference-ui/core'
import { bookPerfPlugin } from './perf/plugin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgDir = resolve(__dirname, '..')
const reactRoot = resolve(pkgDir, '.reference-ui/react')
const reactStylesCss = resolve(reactRoot, 'styles.css')
const styledRoot = resolve(pkgDir, '.reference-ui/styled')
const systemRoot = resolve(pkgDir, '.reference-ui/system')
const typesRoot = resolve(pkgDir, '.reference-ui/types')

const workspaceIconsDir = resolve(pkgDir, '../reference-icons')
const iconsEntry = existsSync(resolve(workspaceIconsDir, 'src/index.ts'))
  ? resolve(workspaceIconsDir, 'src/index.ts')
  : undefined

export default defineConfig({
  root: __dirname,
  server: {
    port: 5000,
    strictPort: true,
    host: true,
  },
  plugins: [referenceVite(), bookPerfPlugin(), react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      ...(iconsEntry ? [{ find: '@reference-ui/icons', replacement: iconsEntry }] : []),
      { find: '@reference-ui/react/styles.css', replacement: reactStylesCss },
      { find: '@reference-ui/styled/', replacement: `${styledRoot}/` },
      { find: '@reference-ui/styled', replacement: styledRoot },
      { find: '@reference-ui/types/', replacement: `${typesRoot}/` },
      { find: '@reference-ui/types', replacement: resolve(typesRoot, 'types.mjs') },
      // Landing Phase C (B5): system resolves to the generated entry (Neo
      // layout), never core src — the F6/F7 trap bypassed the generated folder.
      {
        find: '@reference-ui/system',
        replacement: resolve(systemRoot, 'system.mjs'),
      },
      { find: '@reference-ui/react', replacement: resolve(reactRoot, 'react.mjs') },
    ],
  },
})

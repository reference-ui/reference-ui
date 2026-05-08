import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { referenceVite } from '@reference-ui/core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const coreDir = resolve(__dirname, '../reference-core')
const reactRoot = resolve(__dirname, '.reference-ui/react')
const reactStylesCss = resolve(reactRoot, 'styles.css')
const styledRoot = resolve(__dirname, '.reference-ui/styled')
const typesRoot = resolve(__dirname, '.reference-ui/types')

export default defineConfig({
  plugins: [referenceVite(), react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      { find: '@reference-ui/react/styles.css', replacement: reactStylesCss },
      { find: '@reference-ui/styled/', replacement: `${styledRoot}/` },
      { find: '@reference-ui/styled', replacement: styledRoot },
      { find: '@reference-ui/types/', replacement: `${typesRoot}/` },
      { find: '@reference-ui/types', replacement: resolve(typesRoot, 'types.mjs') },
      // reference-lib is a workspace-internal dev target: point system/react at the live
      // generated/runtime surface instead of treating this as a normal installed consumer.
      {
        find: '@reference-ui/system',
        replacement: resolve(coreDir, 'src/entry/system.ts'),
      },
      { find: '@reference-ui/react', replacement: resolve(reactRoot, 'react.mjs') },
    ],
  },
})

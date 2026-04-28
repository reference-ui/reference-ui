import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createManagedBundlerFiles, getManagedBundlerDevDependencies } from './index.js'

describe('managed bundlers', () => {
  it('describes bundler-owned dependencies', () => {
    assert.deepEqual(getManagedBundlerDevDependencies(['vite7']), {
      '@vitejs/plugin-react': '^4.7.0',
      vite: '^7.3.1',
    })
  })

  it('creates the managed Vite surface', () => {
    assert.deepEqual(createManagedBundlerFiles({ bundlers: ['vite7'], react: 'react19', title: 'Reference UI matrix' }), {
      'index.html': [
        '<!doctype html>',
        '<html lang="en">',
        '  <head>',
        '    <meta charset="UTF-8" />',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '    <title>Reference UI matrix</title>',
        '  </head>',
        '  <body>',
        '    <div id="root"></div>',
        '    <script type="module" src="/src/main.tsx"></script>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
      'vite.config.ts': [
        "import { referenceVite } from '@reference-ui/core'",
        "import react from '@vitejs/plugin-react'",
        "import { defineConfig } from 'vite'",
        '',
        'export default defineConfig({',
        '  plugins: [react(), referenceVite()],',
        '})',
        '',
      ].join('\n'),
    })
  })
})
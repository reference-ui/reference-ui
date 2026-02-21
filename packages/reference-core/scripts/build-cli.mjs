#!/usr/bin/env node

import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const distDir = path.resolve(packageRoot, 'dist', 'cli')

const external = [
  'esbuild',
  'fast-glob',
  'chokidar',
  'typescript',
  'commander',
  'picocolors',
  'piscina',
  'bundle-n-require',
]

async function build() {
  console.log('Building CLI with esbuild...')
  try {
    await esbuild.build({
      entryPoints: {
        index: path.resolve(packageRoot, 'src/cli/index.ts'),
        'virtual/worker': path.resolve(packageRoot, 'src/cli/virtual/worker.ts'),
      },
      outdir: distDir,
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      external,
      outExtension: { '.js': '.mjs' },
    })

    // Add shebang to the main CLI entry after bundling
    const indexPath = path.resolve(distDir, 'index.mjs')
    const content = fs.readFileSync(indexPath, 'utf-8')
    if (!content.startsWith('#!/usr/bin/env node')) {
      fs.writeFileSync(indexPath, '#!/usr/bin/env node\n' + content)
    }

    // Make it executable
    fs.chmodSync(indexPath, 0o755)

    console.log('✓ CLI bundle created at', distDir)
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

build()

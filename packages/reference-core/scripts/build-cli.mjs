#!/usr/bin/env node

import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')
const distDir = path.resolve(packageRoot, 'dist', 'cli')
const workerManifestPath = path.resolve(packageRoot, 'src/cli/thread-pool/manifest.json')

const external = [
  'esbuild',
  'fast-glob',
  'chokidar',
  'typescript',
  'commander',
  'picocolors',
  'piscina',
]

const watchMode = process.argv.includes('--watch')

function addShebangAndPermissions() {
  const indexPath = path.resolve(distDir, 'index.mjs')
  const content = fs.readFileSync(indexPath, 'utf-8')
  if (!content.startsWith('#!/usr/bin/env node')) {
    fs.writeFileSync(indexPath, '#!/usr/bin/env node\n' + content)
  }
  fs.chmodSync(indexPath, 0o755)
}

async function build() {
  console.log(`Building CLI with esbuild${watchMode ? ' (watch mode)' : ''}...`)
  try {
    const workerManifest = JSON.parse(fs.readFileSync(workerManifestPath, 'utf-8'))
    const workerEntries = Object.fromEntries(
      Object.entries(workerManifest).map(([name, entry]) => [
        name,
        path.resolve(packageRoot, entry),
      ])
    )

    const buildOptions = {
      entryPoints: {
        index: path.resolve(packageRoot, 'src/cli/index.ts'),
        ...Object.fromEntries(
          Object.entries(workerEntries).map(([name, entry]) => [`${name}/worker`, entry])
        ),
      },
      outdir: distDir,
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      external,
      outExtension: { '.js': '.mjs' },
    }

    if (watchMode) {
      const ctx = await esbuild.context(buildOptions)
      await ctx.watch()

      // Add shebang and permissions after initial build
      addShebangAndPermissions()

      console.log('✓ CLI bundle created at', distDir)
      console.log('👀 Watching for changes...')

      // Keep the process alive
      await new Promise(() => {})
    } else {
      await esbuild.build(buildOptions)

      // Add shebang to the main CLI entry after bundling
      addShebangAndPermissions()

      console.log('✓ CLI bundle created at', distDir)
    }
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

build()

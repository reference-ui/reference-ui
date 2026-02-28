import { defineConfig } from 'tsup'
import { cpSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

const copyNative = async () => {
  const src = join(root, 'src/cli/virtual/native')
  const dest = join(root, 'dist/cli/virtual/native')
  try {
    const files = readdirSync(src).filter((f) => f.endsWith('.node'))
    if (files.length) {
      mkdirSync(dest, { recursive: true })
      for (const f of files) cpSync(join(src, f), join(dest, f))
    }
  } catch (_) {}
}

export default defineConfig({
  onSuccess: copyNative,
  entry: {
    index: 'src/cli/index.ts',
    'watch/worker': 'src/cli/watch/worker.ts',
    'virtual/worker': 'src/cli/virtual/worker.ts',
    'system/worker': 'src/cli/system/worker.ts',
    'packager/worker': 'src/cli/packager/worker.ts',
    'packager-ts/worker': 'src/cli/packager-ts/worker.ts',
  },
  format: 'esm',
  outDir: 'dist/cli',
  platform: 'node',
  target: 'node18',
  splitting: false,
  sourcemap: true,
  clean: false, // avoid ENOENT when unlinking non-existent files (watch/race with clean)
  outExtension() {
    return { js: '.mjs' }
  },
  external: [
    'esbuild',
    'fast-glob',
    '@parcel/watcher',
    '@pandacss/node',
    'typescript',
    'commander',
    'picocolors',
    'picomatch',
    'piscina',
  ],
})

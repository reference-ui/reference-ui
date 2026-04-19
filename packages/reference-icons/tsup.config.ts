import { existsSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'tsup'

const pkgRoot = dirname(fileURLToPath(import.meta.url))
const genDir = join(pkgRoot, 'src/generated')

function iconGeneratedTsxEntries(): Record<string, string> {
  if (!existsSync(genDir)) return {}
  const entries: Record<string, string> = {}
  for (const f of readdirSync(genDir)) {
    if (!f.endsWith('.tsx')) continue
    const base = f.replace(/\.tsx$/, '')
    entries[`generated/${base}`] = join('src/generated', f)
  }
  return entries
}

const external = [
  '@material-symbols-svg/react',
  'react',
  'react-dom',
]

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    createIcon: 'src/createIcon.tsx',
    constants: 'src/constants.ts',
    'generated/index': 'src/generated/index.ts',
    ...iconGeneratedTsxEntries(),
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  bundle: false,
  target: 'node18',
  outDir: 'dist',
  outExtension() {
    return { js: '.mjs' }
  },
  external,
})

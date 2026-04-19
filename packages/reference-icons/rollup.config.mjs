import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import resolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'

const pkgRoot = dirname(fileURLToPath(import.meta.url))
const generatedDir = join(pkgRoot, 'src', 'generated')

function generatedEntries() {
  if (!existsSync(generatedDir)) return {}

  const entries = {}
  for (const fileName of readdirSync(generatedDir)) {
    if (!fileName.endsWith('.tsx') && fileName !== 'index.ts') continue
    const baseName = fileName.replace(/\.(ts|tsx)$/, '')
    entries[`generated/${baseName}`] = join('src', 'generated', fileName)
  }
  return entries
}

const input = {
  index: 'src/index.ts',
  createIcon: 'src/createIcon.tsx',
  constants: 'src/constants.ts',
  ...generatedEntries(),
}

const external = id =>
  id === 'react' ||
  id.startsWith('react/') ||
  id === 'react-dom' ||
  id.startsWith('react-dom/') ||
  id === '@material-symbols-svg/react' ||
  id.startsWith('@material-symbols-svg/react/') ||
  id === '@reference-ui/react' ||
  id.startsWith('@reference-ui/react/')

export default {
  input,
  external,
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].mjs',
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
  plugins: [
    resolve({ extensions: ['.mjs', '.js', '.ts', '.tsx'] }),
    esbuild({
      include: /\.[jt]sx?$/,
      target: 'es2020',
      jsx: 'automatic',
      tsconfig: 'tsconfig.json',
    }),
  ],
}
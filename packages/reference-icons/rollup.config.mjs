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

const externalPackageRoots = [
  'react',
  'react-dom',
  '@material-symbols-svg/react',
  '@reference-ui/react',
  '@reference-ui/system',
]

const isPackageRootOrSubpath = (id, packageRoot) =>
  id === packageRoot || id.startsWith(`${packageRoot}/`)

function toPosixPath(value) {
  return value.replaceAll('\\', '/')
}

function materialSymbolsSpecifierFromResolvedId(id) {
  const normalizedId = toPosixPath(id)
  const match = normalizedId.match(
    /\/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?@material-symbols-svg\/react\/dist\/icons\/(.+)\.mjs$/,
  )

  if (!match) {
    return null
  }

  return `@material-symbols-svg/react/icons/${match[1]}`
}

const external = id =>
  externalPackageRoots.some(packageRoot => isPackageRootOrSubpath(id, packageRoot))
  || materialSymbolsSpecifierFromResolvedId(id) !== null

function forceExternalPackage(packageRoot) {
  return {
    name: `force-external:${packageRoot}`,
    resolveId(source) {
      if (isPackageRootOrSubpath(source, packageRoot)) {
        return { id: source, external: true }
      }

      return null
    },
  }
}

export default {
  input,
  external,
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].mjs',
    preserveModules: true,
    preserveModulesRoot: 'src',
    paths(id) {
      return materialSymbolsSpecifierFromResolvedId(id) ?? id
    },
  },
  plugins: [
    forceExternalPackage('@material-symbols-svg/react'),
    resolve({ extensions: ['.mjs', '.js', '.ts', '.tsx'] }),
    esbuild({
      include: /\.[jt]sx?$/,
      target: 'es2020',
      jsx: 'automatic',
      tsconfig: 'tsconfig.json',
    }),
  ],
}
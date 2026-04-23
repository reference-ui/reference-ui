// Package the generated runtime into dist so published reference-lib resolves
// stable relative files instead of relying on nested node_modules paths.
import { constants } from 'node:fs'
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')
const generatedRoot = resolve(packageRoot, '.reference-ui')
const packagedRuntimeDir = resolve(distDir, 'runtime/reference-ui')

const runtimePackages = ['react', 'styled']

const runtimeRewrites = [
  ['@reference-ui/styled/css/cva', '../styled/css/cva.js'],
  ['@reference-ui/styled/types/prop-type', '../styled/types/prop-type.d.ts'],
  ['@reference-ui/styled/types/style-props', '../styled/types/style-props.d.ts'],
  ['@reference-ui/styled/types/conditions', '../styled/types/conditions.d.ts'],
  ['@reference-ui/styled/types/recipe', '../styled/types/recipe.d.ts'],
  ['@reference-ui/styled/types', '../styled/types/index.d.ts'],
  ['@reference-ui/styled/css', '../styled/css/index.js'],
  ['@reference-ui/styled/jsx', '../styled/jsx/index.js'],
  ['@reference-ui/styled/patterns/box', '../styled/patterns/box.js'],
]

const bundleRewrites = [
  ['@reference-ui/styled/css/cva', './runtime/reference-ui/styled/css/cva.js'],
  ['@reference-ui/react', './runtime/reference-ui/react/react.mjs'],
  ['@reference-ui/styled/css', './runtime/reference-ui/styled/css/index.js'],
  ['@reference-ui/styled/jsx', './runtime/reference-ui/styled/jsx/index.js'],
  ['@reference-ui/styled/patterns/box', './runtime/reference-ui/styled/patterns/box.js'],
]

async function rewriteSpecifiers(filePath, replacements) {
  let content = await readFile(filePath, 'utf8')
  for (const [from, to] of replacements) {
    content = content.replaceAll(from, to)
  }
  await writeFile(filePath, content)
}

for (const packageName of runtimePackages) {
  const sourceDir = resolve(generatedRoot, packageName)
  await access(sourceDir, constants.F_OK)
}

await mkdir(packagedRuntimeDir, { recursive: true })

for (const packageName of runtimePackages) {
  const sourceDir = resolve(generatedRoot, packageName)
  const targetDir = resolve(packagedRuntimeDir, packageName)

  await rm(targetDir, { recursive: true, force: true })
  await cp(sourceDir, targetDir, { recursive: true })
}

await rewriteSpecifiers(resolve(packagedRuntimeDir, 'react/react.mjs'), runtimeRewrites)
await rewriteSpecifiers(resolve(packagedRuntimeDir, 'react/react.d.mts'), runtimeRewrites)
await rewriteSpecifiers(resolve(distDir, 'index.mjs'), bundleRewrites)
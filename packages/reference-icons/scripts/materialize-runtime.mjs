// Package the generated runtime into dist so published reference-icons resolves
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

// Neo's styled leg is data-only: no css/jsx/patterns modules exist.
// The packaged react entry is self-contained JS; its .d.mts references
// the bare styled id twice (import + export type *), both rewired here.
const runtimeRewrites = [
  ['@reference-ui/styled', '../styled/index.d.ts'],
]

const bundleRewrites = [
  ['@reference-ui/react', './runtime/reference-ui/react/react.mjs'],
]

const typeRewrites = [
  ['@reference-ui/react', './runtime/reference-ui/react/react.d.mts'],
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
await rewriteSpecifiers(resolve(distDir, 'createIcon.mjs'), bundleRewrites)
await rewriteSpecifiers(resolve(distDir, 'types.d.ts'), typeRewrites)
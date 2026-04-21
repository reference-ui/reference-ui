// Package the generated runtime into dist so published reference-icons resolves
// its own @reference-ui/react and @reference-ui/styled dependencies instead of
// relying on a consumer's local generated .reference-ui packages.
import { constants } from 'node:fs'
import { access, cp, mkdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')
const generatedRoot = resolve(packageRoot, '.reference-ui')
const packagedNodeModulesDir = resolve(distDir, 'node_modules/@reference-ui')

const runtimePackages = ['react', 'styled']

for (const packageName of runtimePackages) {
  const sourceDir = resolve(generatedRoot, packageName)
  await access(sourceDir, constants.F_OK)
}

await mkdir(packagedNodeModulesDir, { recursive: true })

for (const packageName of runtimePackages) {
  const sourceDir = resolve(generatedRoot, packageName)
  const targetDir = resolve(packagedNodeModulesDir, packageName)

  await rm(targetDir, { recursive: true, force: true })
  await cp(sourceDir, targetDir, { recursive: true })
}
import { access, mkdir, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')

const requiredFiles = [
  resolve(packageRoot, '.reference-ui/system/baseSystem.mjs'),
  resolve(packageRoot, '.reference-ui/system/baseSystem.d.mts'),
  resolve(distDir, 'index.mjs'),
  resolve(distDir, 'index.d.ts'),
  resolve(distDir, 'icons/index.mjs'),
  resolve(distDir, 'icons/index.d.ts'),
]

for (const filePath of requiredFiles) {
  await access(filePath, constants.F_OK)
}

await mkdir(distDir, { recursive: true })

import { access, mkdir, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')

const requiredFiles = [
  resolve(packageRoot, '.reference-ui/system/baseSystem.mjs'),
  resolve(packageRoot, '.reference-ui/system/baseSystem.d.mts'),
]

for (const filePath of requiredFiles) {
  await access(filePath, constants.F_OK)
}

await mkdir(distDir, { recursive: true })

await writeFile(
  resolve(distDir, 'index.mjs'),
  "export { baseSystem } from '../.reference-ui/system/baseSystem.mjs'\n",
  'utf8'
)

await writeFile(
  resolve(distDir, 'index.d.ts'),
  "export { baseSystem } from '../.reference-ui/system/baseSystem.mjs'\n",
  'utf8'
)

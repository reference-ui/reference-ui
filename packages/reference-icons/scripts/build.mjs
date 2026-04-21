import { execSync } from 'node:child_process'
import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')

const requiredFiles = [
  resolve(packageRoot, '.reference-ui/system/baseSystem.mjs'),
  resolve(packageRoot, '.reference-ui/system/baseSystem.d.mts'),
  resolve(distDir, 'index.mjs'),
  resolve(distDir, 'index.d.ts'),
]

function run(command) {
  execSync(command, { cwd: packageRoot, stdio: 'inherit', env: process.env })
}

try {
  await access(distDir, constants.F_OK)
  process.exit(0)
} catch {
  run('pnpm run sync')
  run('pnpm run build:lib')
  run('pnpm run build:types')
}

for (const filePath of requiredFiles) {
  await access(filePath, constants.F_OK)
}
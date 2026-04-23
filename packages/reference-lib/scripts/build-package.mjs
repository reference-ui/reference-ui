import { access, mkdir, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')

const requiredFiles = [
  resolve(packageRoot, '.reference-ui/system/baseSystem.mjs'),
  resolve(packageRoot, '.reference-ui/system/baseSystem.d.mts'),
  resolve(distDir, 'index.mjs'),
  resolve(distDir, 'index.d.ts'),
]

const packagedRuntimeFiles = [
  resolve(distDir, 'runtime/reference-ui/react/react.mjs'),
  resolve(distDir, 'runtime/reference-ui/styled/css/index.js'),
]

function run(command, args) {
  execFileSync(command, args, { cwd: packageRoot, stdio: 'inherit', env: process.env })
}

for (const filePath of requiredFiles) {
  await access(filePath, constants.F_OK)
}

await mkdir(distDir, { recursive: true })
run(process.execPath, ['scripts/materialize-runtime.mjs'])

for (const filePath of packagedRuntimeFiles) {
  await access(filePath, constants.F_OK)
}

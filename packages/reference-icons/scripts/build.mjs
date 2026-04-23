import { execFileSync } from 'node:child_process'
import { constants } from 'node:fs'
import { access, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')

const requiredFiles = [
  resolve(packageRoot, '.reference-ui/system/baseSystem.mjs'),
  resolve(packageRoot, '.reference-ui/system/baseSystem.d.mts'),
  resolve(distDir, 'index.mjs'),
  resolve(distDir, 'index.d.ts'),
  resolve(distDir, 'runtime/reference-ui/react/react.mjs'),
  resolve(distDir, 'runtime/reference-ui/styled/css/index.js'),
]

function run(command, args) {
  execFileSync(command, args, { cwd: packageRoot, stdio: 'inherit', env: process.env })
}

await rm(distDir, { recursive: true, force: true })

run(process.execPath, ['scripts/ensure-core-cli.mjs'])
run(process.execPath, ['scripts/generate.mjs'])
run('pnpm', ['exec', 'ref', 'build'])
run('pnpm', ['exec', 'rollup', '-c'])
run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.build.json'])
run(process.execPath, ['scripts/materialize-runtime.mjs'])

for (const filePath of requiredFiles) {
  await access(filePath, constants.F_OK)
}
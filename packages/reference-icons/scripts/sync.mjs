import { execFileSync } from 'node:child_process'
import { constants } from 'node:fs'
import { access, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const generatedDir = join(packageRoot, 'src/generated')

const requiredFiles = [
  join(generatedDir, 'index.ts'),
  join(packageRoot, 'src', 'jsx-names.ts'),
  join(packageRoot, '.reference-ui/system/baseSystem.mjs'),
  join(packageRoot, '.reference-ui/system/baseSystem.d.mts'),
]

function run(command, args) {
  execFileSync(command, args, { cwd: packageRoot, stdio: 'inherit', env: process.env })
}

async function hasSyncOutputs() {
  try {
    for (const filePath of requiredFiles) {
      await access(filePath, constants.F_OK)
    }

    const generatedFiles = await readdir(generatedDir)
    return generatedFiles.length > 1
  } catch {
    return false
  }
}

if (!(await hasSyncOutputs())) {
  run(process.execPath, ['scripts/ensure-core-cli.mjs'])
  run(process.execPath, ['scripts/generate.mjs'])
  run('ref', ['sync'])
}

for (const filePath of requiredFiles) {
  await access(filePath, constants.F_OK)
}
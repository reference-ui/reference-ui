import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const coreCliEntry = resolve(packageRoot, '..', 'reference-core', 'dist', 'cli', 'index.mjs')

async function ensureCoreCli() {
  try {
    await access(coreCliEntry, constants.F_OK)
    return
  } catch {
    execFileSync('pnpm', ['--filter', '@reference-ui/core', 'run', 'build'], {
      cwd: packageRoot,
      stdio: 'inherit',
      env: process.env,
    })
  }
}

await ensureCoreCli()

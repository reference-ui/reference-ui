/**
 * Copies lib into the sandbox, then starts the dev server.
 * Ensures the test config (tokens, etc.) is always fresh before each run.
 */

import { cp, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { loadConfig } from '../config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = join(__dirname, '..', '..')
const LIB_DIR = join(PACKAGE_ROOT, 'src', 'lib')

const { defaultProject: project } = loadConfig()
if (!project) {
  console.error('defaultProject required in ref-test.config.json (or set REF_TEST_PROJECT)')
  process.exit(1)
}

const sandboxDir = join(PACKAGE_ROOT, '.sandbox', project)
const sandboxLib = join(sandboxDir, 'lib')

async function main() {
  // Copy lib into sandbox – ensures config is fresh every test run
  await rm(sandboxLib, { recursive: true, force: true })
  await cp(LIB_DIR, sandboxLib, { recursive: true })

  // Start dev server in sandbox
  const proc = spawn('pnpm', ['run', 'dev'], {
    cwd: sandboxDir,
    stdio: 'inherit',
    env: process.env,
  })
  proc.on('exit', (code) => process.exit(code ?? 0))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

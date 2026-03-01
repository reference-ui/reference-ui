/**
 * Copies lib into the sandbox, then starts the dev server.
 * Ensures the test config (tokens, etc.) is always fresh before each run.
 */

import { spawn } from 'node:child_process'
import {
  getDefaultProject,
  getSandboxDir,
  refreshSandboxLib,
} from '../runner/index.js'

async function main() {
  const project = getDefaultProject()
  await refreshSandboxLib(project)

  const proc = spawn('pnpm', ['run', 'dev'], {
    cwd: getSandboxDir(project),
    stdio: 'inherit',
    env: process.env,
  })
  proc.on('exit', (code) => process.exit(code ?? 0))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

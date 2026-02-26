#!/usr/bin/env node
/**
 * Run tests with a hard timeout. Prevents indefinite hangs from open handles.
 * Kills the test process after 2 min if it doesn't exit.
 */
import { spawn } from 'node:child_process'

const TIMEOUT_MS = 120_000
const child = spawn('pnpm', ['exec', 'vitest', 'run'], {
  stdio: 'inherit',
  shell: true,
})

const t = setTimeout(() => {
  child.kill('SIGKILL')
  console.error('\n[timeout] Tests exceeded 2 min, killed')
  process.exit(124)
}, TIMEOUT_MS)

child.on('exit', (code) => {
  clearTimeout(t)
  process.exit(code ?? 0)
})

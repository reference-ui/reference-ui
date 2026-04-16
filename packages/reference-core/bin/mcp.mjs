#!/usr/bin/env node
/**
 * Shims `npx @reference-ui/core mcp` → `ref mcp` (npm runs a bin whose name matches the
 * second token; our primary CLI is `ref`, not `mcp`).
 */
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const refBin = join(here, 'ref.mjs')

const child = spawn(
  process.execPath,
  [refBin, 'mcp', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env }
)

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})

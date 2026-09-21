#!/usr/bin/env node
/**
 * Reclaim Book's Vite port before `pnpm dev:lib` / `pnpm book` listen.
 * Only terminates this workspace's Book Vite listener. AirPlay Receiver and
 * other occupants stay up, with a clear error so Vite's strictPort bind is
 * not a mystery EADDRINUSE.
 */
import { execFileSync } from 'node:child_process'

const PORT = Number.parseInt(process.argv[2] ?? process.env.BOOK_PORT ?? '5000', 10)
const WAIT_MS = 2000

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function listenerPids(port) {
  try {
    const out = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
    }).trim()
    if (!out) return []
    return out
      .split(/\s+/)
      .map((value) => Number.parseInt(value, 10))
      .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid)
  } catch {
    return []
  }
}

function processCommand(pid) {
  try {
    return execFileSync('ps', ['-p', String(pid), '-o', 'command='], {
      encoding: 'utf8',
    }).trim()
  } catch {
    return ''
  }
}

function isBookVite(command) {
  if (!command) return false
  if (/ControlCenter|rapportd|AirPlay/i.test(command)) return false
  const isVite = command.includes('vite')
  const isBook =
    command.includes('book/vite.config') || command.includes('packages/reference-lib')
  return isVite && isBook
}

function commandLabel(command) {
  return command.replace(/\s+/g, ' ').slice(0, 160) || 'unknown process'
}

function terminate(pid, signal) {
  try {
    process.kill(pid, signal)
  } catch {
    // Already gone.
  }
}

function reclaim(port) {
  const occupants = listenerPids(port).map((pid) => ({ pid, command: processCommand(pid) }))
  if (occupants.length === 0) return

  const foreign = occupants.filter((occupant) => !isBookVite(occupant.command))
  if (foreign.length > 0) {
    for (const occupant of foreign) {
      console.error(
        `[book] Port ${port} is held by PID ${occupant.pid} (${commandLabel(occupant.command)}).`,
      )
    }
    console.error(
      '[book] That listener is not Book Vite, so it was left running. Stop it or disable AirPlay Receiver (macOS uses :5000).',
    )
    process.exit(1)
  }

  const pids = occupants.map((occupant) => occupant.pid)
  for (const pid of pids) terminate(pid, 'SIGTERM')
  sleep(150)
  for (const pid of listenerPids(port)) terminate(pid, 'SIGKILL')

  const deadline = Date.now() + WAIT_MS
  while (Date.now() < deadline && listenerPids(port).length > 0) sleep(50)

  const remaining = listenerPids(port)
  if (remaining.length > 0) {
    console.error(`[book] Port ${port} is still in use after terminating PID ${pids.join(', ')}.`)
    process.exit(1)
  }

  console.log(`[book] Cleared stale Book listener on port ${port} (terminated PID ${pids.join(', ')})`)
}

if (!Number.isInteger(PORT) || PORT <= 0) {
  console.error(`[book] Invalid port: ${process.argv[2] ?? process.env.BOOK_PORT}`)
  process.exit(1)
}

reclaim(PORT)

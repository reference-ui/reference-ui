/**
 * Runtime helper staged into generated matrix consumers.
 *
 * This script owns exactly one `ref sync --watch` process while the matrix
 * runner executes all watch-compatible test phases. It emits compact timing
 * markers on stdout so the parent runner can attribute runtime-ready setup time
 * and per-phase execution time without parsing Vitest or Playwright output.
 */

import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const matrixRefSyncPhasesEnvVar = 'REFERENCE_UI_MATRIX_REF_SYNC_PHASES_JSON'
const waitReadyScriptPath = resolve(process.cwd(), '.matrix-support/ref-sync/wait-ready.mjs')
const watchLogPath = resolve(process.cwd(), '.matrix-support/ref-sync/watch.log')
const watchCommand = ['pnpm', 'exec', 'ref', 'sync', '--watch']

function isRunning(processHandle) {
  return processHandle.exitCode === null && processHandle.signalCode === null
}

function parsePhases() {
  const rawValue = process.env[matrixRefSyncPhasesEnvVar]

  if (!rawValue) {
    return []
  }

  const parsedValue = JSON.parse(rawValue)

  if (!Array.isArray(parsedValue)) {
    throw new Error(`${matrixRefSyncPhasesEnvVar} must be a JSON array.`)
  }

  return parsedValue.map((phase, index) => {
    if (!phase || typeof phase !== 'object') {
      throw new Error(`${matrixRefSyncPhasesEnvVar}[${index}] must be an object.`)
    }

    const phaseName = phase.phase
    const command = phase.command

    if (phaseName !== 'test:vitest' && phaseName !== 'test:playwright') {
      throw new Error(`${matrixRefSyncPhasesEnvVar}[${index}].phase must be a known watch phase.`)
    }

    if (!Array.isArray(command) || command.length === 0 || command.some(part => typeof part !== 'string')) {
      throw new Error(`${matrixRefSyncPhasesEnvVar}[${index}].command must be a non-empty string array.`)
    }

    return {
      command,
      phase: phaseName,
    }
  })
}

function spawnCommand(command, options = {}) {
  return spawn(command[0], command.slice(1), {
    cwd: process.cwd(),
    env: process.env,
    stdio: options.inheritStdio ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  })
}

function waitForExit(processHandle) {
  return new Promise((resolvePromise, rejectPromise) => {
    processHandle.once('error', rejectPromise)
    processHandle.once('exit', (code, signal) => {
      resolvePromise({ code, signal })
    })
  })
}

async function dumpWatchLog() {
  try {
    const output = await readFile(watchLogPath, 'utf8')

    if (output.trim().length === 0) {
      return
    }

    process.stderr.write('\n[ref sync watch log]\n')
    process.stderr.write(output)
    if (!output.endsWith('\n')) {
      process.stderr.write('\n')
    }
  } catch {
    // Ignore log-read failures; the main failure is already surfaced.
  }
}

function formatExitResult(context, result) {
  return `${context} (code=${result.code}, signal=${result.signal})`
}

async function stopWatchProcess(watchProcess) {
  if (!isRunning(watchProcess)) {
    return
  }

  await new Promise((resolvePromise) => {
    const timeout = setTimeout(() => {
      if (isRunning(watchProcess)) {
        watchProcess.kill('SIGKILL')
      }
    }, 500)

    watchProcess.once('exit', () => {
      clearTimeout(timeout)
      resolvePromise()
    })

    watchProcess.kill('SIGTERM')
  })
}

async function waitForReady(watchProcess) {
  const readyStartedAt = Date.now()
  const readyProcess = spawn(process.execPath, [waitReadyScriptPath], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  })
  const firstFinished = await Promise.race([
    waitForExit(readyProcess).then(result => ({ result, source: 'ready' })),
    waitForExit(watchProcess).then(result => ({ result, source: 'watch' })),
  ])

  if (firstFinished.source === 'watch') {
    if (isRunning(readyProcess)) {
      readyProcess.kill('SIGTERM')
    }

    await dumpWatchLog()
    throw new Error(`ref sync watch exited before reaching runtime-ready output ${formatExitResult('', firstFinished.result).trim()}`)
  }

  if (firstFinished.result.code !== 0 || firstFinished.result.signal !== null) {
    await dumpWatchLog()
    throw new Error(`ref sync wait-ready helper failed ${formatExitResult('', firstFinished.result).trim()}`)
  }

  console.log(`[matrix ref sync] ready-duration-ms=${Date.now() - readyStartedAt}`)
}

async function runPhaseWhileWatchAlive(phase, watchProcess) {
  const phaseStartedAt = Date.now()
  const phaseProcess = spawnCommand(phase.command, { inheritStdio: true })
  const firstFinished = await Promise.race([
    waitForExit(phaseProcess).then(result => ({ result, source: 'phase' })),
    waitForExit(watchProcess).then(result => ({ result, source: 'watch' })),
  ])

  if (firstFinished.source === 'watch') {
    if (isRunning(phaseProcess)) {
      phaseProcess.kill('SIGTERM')
    }

    await dumpWatchLog()
    throw new Error(`ref sync watch exited while running ${phase.phase} ${formatExitResult('', firstFinished.result).trim()}`)
  }

  if (firstFinished.result.code !== 0 || firstFinished.result.signal !== null) {
    await dumpWatchLog()
    throw new Error(`${phase.phase} failed ${formatExitResult('', firstFinished.result).trim()}`)
  }

  console.log(`[matrix ref sync] phase=${phase.phase} duration-ms=${Date.now() - phaseStartedAt}`)
}

const phases = parsePhases()
await mkdir(dirname(watchLogPath), { recursive: true })
const watchLogStream = createWriteStream(watchLogPath, { flags: 'w' })
const watchProcess = spawnCommand(watchCommand)
watchProcess.stdout?.pipe(watchLogStream)
watchProcess.stderr?.pipe(watchLogStream)

try {
  await waitForReady(watchProcess)

  for (const phase of phases) {
    await runPhaseWhileWatchAlive(phase, watchProcess)
  }
} catch (error) {
  process.exitCode = 1

  if (error instanceof Error) {
    process.stderr.write(`${error.message}\n`)
  } else {
    throw error
  }
} finally {
  await stopWatchProcess(watchProcess)
  await new Promise(resolvePromise => watchLogStream.end(resolvePromise))
}
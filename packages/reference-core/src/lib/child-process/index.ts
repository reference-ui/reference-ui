import { spawn } from 'node:child_process'
import { threadId } from 'node:worker_threads'
import { emit } from '../event-bus'
import { log } from '../log'

const PROCESS_SPAWNED_EVENT = 'process:spawned'
const PROCESS_EXIT_EVENT = 'process:exit'

export type SpawnMonitoredResult = {
  code: number | null
  /** Set when `code` is null — e.g. SIGINT/SIGTERM if the user stops sync or the parent shuts down. */
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
}

/**
 * Spawn a child process and wait for it to complete.
 * Used by packager-ts to run tsup for .d.mts generation.
 */
export async function spawnMonitoredAsync(
  command: string,
  args: string[],
  options: {
    cwd: string
    processName: string
    logCategory?: string
  }
): Promise<SpawnMonitoredResult> {
  const { cwd, processName, logCategory = 'process' } = options
  const output = { stdout: '', stderr: '' }
  const parentThreadId = threadId

  const child = spawn(command, args, {
    cwd,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  log.debug(logCategory, `[${processName}] spawned PID ${child.pid}`)
  if (typeof child.pid === 'number') {
    emit(PROCESS_SPAWNED_EVENT, { pid: child.pid, processName, threadId: parentThreadId })
  }

  child.stdout?.on('data', (chunk) => {
    output.stdout += chunk.toString()
  })
  child.stderr?.on('data', (chunk) => {
    output.stderr += chunk.toString()
  })

  const { code, signal } = await new Promise<{
    code: number | null
    signal: NodeJS.Signals | null
  }>((resolve, reject) => {
    child.on('exit', (exitCode, signalCode) => {
      if (typeof child.pid === 'number') {
        emit(PROCESS_EXIT_EVENT, {
          pid: child.pid,
          processName,
          threadId: parentThreadId,
          code: exitCode,
          signal: signalCode,
        })
      }
      resolve({ code: exitCode, signal: signalCode })
    })
    child.on('error', (err) =>
      reject(new Error(`Failed to spawn ${processName}: ${err.message}`))
    )
  })

  return { code, signal, stdout: output.stdout, stderr: output.stderr }
}

/** User-facing message when a monitored child did not exit normally (incl. signal kills). */
export function formatSpawnMonitoredFailure(
  processName: string,
  result: Pick<SpawnMonitoredResult, 'code' | 'signal' | 'stderr' | 'stdout'>
): string {
  const hint = result.stderr.trim() || result.stdout.trim()
  if (result.code === null) {
    if (hint) return `${processName} failed: ${hint}`
    return result.signal
      ? `${processName} terminated by ${result.signal} (interrupted or sync shut down)`
      : `${processName} exited without a status (interrupted or killed)`
  }
  if (hint) return `${processName} failed: ${hint}`
  return `${processName} exited with code ${result.code}`
}

import { spawn } from 'node:child_process'
import { emit } from '../event-bus'
import { log } from '../log'

const PROCESS_SPAWNED_EVENT = 'process:spawned'
const PROCESS_EXIT_EVENT = 'process:exit'

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
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const { cwd, processName, logCategory = 'process' } = options
  const output = { stdout: '', stderr: '' }

  const child = spawn(command, args, {
    cwd,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  log.debug(logCategory, `[${processName}] spawned PID ${child.pid}`)
  if (typeof child.pid === 'number') {
    emit(PROCESS_SPAWNED_EVENT, { pid: child.pid, processName })
  }

  child.stdout?.on('data', (chunk) => {
    output.stdout += chunk.toString()
  })
  child.stderr?.on('data', (chunk) => {
    output.stderr += chunk.toString()
  })

  const code = await new Promise<number | null>((resolve, reject) => {
    child.on('exit', (exitCode, signalCode) => {
      if (typeof child.pid === 'number') {
        emit(PROCESS_EXIT_EVENT, {
          pid: child.pid,
          processName,
          code: exitCode,
          signal: signalCode,
        })
      }
      resolve(exitCode)
    })
    child.on('error', (err) =>
      reject(new Error(`Failed to spawn ${processName}: ${err.message}`))
    )
  })

  return { code, stdout: output.stdout, stderr: output.stderr }
}

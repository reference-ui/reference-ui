import { spawn } from 'node:child_process'
import { log } from './log'

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

  child.stdout?.on('data', (chunk) => {
    output.stdout += chunk.toString()
  })
  child.stderr?.on('data', (chunk) => {
    output.stderr += chunk.toString()
  })

  const code = await new Promise<number | null>((resolve, reject) => {
    child.on('exit', resolve)
    child.on('error', (err) =>
      reject(new Error(`Failed to spawn ${processName}: ${err.message}`))
    )
  })

  return { code, stdout: output.stdout, stderr: output.stderr }
}

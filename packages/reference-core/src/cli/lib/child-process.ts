import { spawn, execSync, type SpawnOptions } from 'node:child_process'
import { log } from './log'

/**
 * Get RSS of a child process by PID (macOS/Linux)
 */
function getProcessRssMb(pid: number | undefined): number | null {
  if (!pid) return null
  try {
    const rss = parseInt(execSync(`ps -o rss= -p ${pid}`).toString(), 10)
    return rss / 1024
  } catch {
    return null
  }
}

/**
 * ANSI color codes
 */
const ORANGE = '\x1b[38;5;208m'
const RESET = '\x1b[0m'

/**
 * Setup memory monitoring for a child process. Returns cleanup function and peak RSS getter.
 */
function setupProcessMonitoring(opts: {
  getPid: () => number | undefined
  peakSampleInterval: number
  logInterval: number | null
  logCategory: string
  coloredName: string
}): { stopMonitoring: () => void; getPeakRss: () => number } {
  let peakRss = 0
  let peakInterval: NodeJS.Timeout | null = setInterval(() => {
    const rss = getProcessRssMb(opts.getPid())
    if (rss !== null && rss > peakRss) peakRss = rss
  }, opts.peakSampleInterval)

  let logInterval: NodeJS.Timeout | null = null
  if (opts.logInterval !== null) {
    logInterval = setInterval(() => {
      const rss = getProcessRssMb(opts.getPid())
      if (rss !== null) {
        log.debug(opts.logCategory, `[${opts.coloredName}] RAM: ${ORANGE}${rss.toFixed(1)}MB${RESET}`)
      }
    }, opts.logInterval)
  }

  const stopMonitoring = () => {
    if (peakInterval) {
      clearInterval(peakInterval)
      peakInterval = null
    }
    if (logInterval) {
      clearInterval(logInterval)
      logInterval = null
    }
  }

  return { stopMonitoring, getPeakRss: () => peakRss }
}

/**
 * Capture stdout and stderr from a child process. Mutates output object as data arrives.
 */
function captureProcessOutput(
  child: ReturnType<typeof spawn>,
  output: { stdout: string; stderr: string }
): void {
  child.stdout?.on('data', chunk => {
    output.stdout += chunk.toString()
  })
  child.stderr?.on('data', chunk => {
    output.stderr += chunk.toString()
  })
}

/**
 * Build result object from process exit.
 */
function handleProcessExit(
  code: number | null,
  output: { stdout: string; stderr: string },
  peakChildRssMb: number,
  memBeforeMb: number
): { code: number | null; stdout: string; stderr: string; peakChildRssMb: number; parentRssDeltaMb: number } {
  const memAfterMb = process.memoryUsage().rss / 1024 / 1024
  return {
    code,
    stdout: output.stdout,
    stderr: output.stderr,
    peakChildRssMb,
    parentRssDeltaMb: memAfterMb - memBeforeMb,
  }
}

export interface MonitoredSpawnOptions extends SpawnOptions {
  /**
   * Friendly name for the process (will be colored orange in logs)
   */
  processName: string
  /**
   * Memory monitoring interval in ms (default: 5000)
   */
  memoryMonitorInterval?: number
  /**
   * Whether to log memory usage periodically (default: true)
   */
  logMemory?: boolean
  /**
   * Log category (default: 'process')
   */
  logCategory?: string
}

export interface MonitoredChildProcess {
  /**
   * The underlying child process
   */
  process: ReturnType<typeof spawn>
  /**
   * Stop memory monitoring
   */
  stopMonitoring: () => void
  /**
   * Get current child process RSS in MB
   */
  getRssMb: () => number | null
  /**
   * Get peak RSS recorded so far
   */
  getPeakRssMb: () => number
}

/**
 * Spawn a child process with automatic memory monitoring and colored logging.
 *
 * @example
 * const child = spawnMonitored('npx', ['panda', '--watch'], {
 *   processName: 'panda-css',
 *   cwd: '/path/to/project',
 *   stdio: 'inherit',
 * })
 *
 * // Later cleanup
 * child.stopMonitoring()
 * child.process.kill()
 */
export function spawnMonitored(
  command: string,
  args: string[],
  options: MonitoredSpawnOptions
): MonitoredChildProcess {
  const {
    processName,
    memoryMonitorInterval = 5000,
    logMemory = true,
    logCategory = 'process',
    ...spawnOptions
  } = options

  const coloredName = `${ORANGE}${processName}${RESET}`
  const child = spawn(command, args, spawnOptions)

  log.debug(logCategory, `[${coloredName}] spawned PID ${child.pid}`)

  const { stopMonitoring, getPeakRss } = setupProcessMonitoring({
    getPid: () => child.pid,
    peakSampleInterval: memoryMonitorInterval,
    logInterval: logMemory ? memoryMonitorInterval : null,
    logCategory,
    coloredName,
  })

  child.on('exit', stopMonitoring)

  return {
    process: child,
    stopMonitoring,
    getRssMb: () => getProcessRssMb(child.pid),
    getPeakRssMb: getPeakRss,
  }
}

/**
 * Spawn a child process and wait for it to complete, tracking memory usage.
 * Returns peak RSS and parent RSS delta.
 *
 * @example
 * const result = await spawnMonitoredAsync('npx', ['tsdown', 'entry.ts'], {
 *   processName: 'tsdown',
 *   cwd: '/path/to/project',
 *   logCategory: 'packager:ts',
 * })
 *
 * console.log(`Peak child RSS: ${result.peakChildRssMb}MB`)
 * console.log(`Parent RSS delta: ${result.parentRssDeltaMb}MB`)
 */
export async function spawnMonitoredAsync(
  command: string,
  args: string[],
  options: MonitoredSpawnOptions & {
    /**
     * Timeout in ms (0 = no timeout)
     */
    timeout?: number
  }
): Promise<{
  code: number | null
  stdout: string
  stderr: string
  peakChildRssMb: number
  parentRssDeltaMb: number
}> {
  const {
    processName,
    memoryMonitorInterval = 100,
    logCategory = 'process',
    timeout = 0,
    ...spawnOptions
  } = options

  const coloredName = `${ORANGE}${processName}${RESET}`
  const memBeforeMb = process.memoryUsage().rss / 1024 / 1024
  const output = { stdout: '', stderr: '' }

  const child = spawn(command, args, {
    ...spawnOptions,
    stdio: spawnOptions.stdio || ['ignore', 'pipe', 'pipe'],
  })

  log.debug(logCategory, `[${coloredName}] spawned PID ${child.pid}`)

  const monitoring = setupProcessMonitoring({
    getPid: () => child.pid,
    peakSampleInterval: memoryMonitorInterval,
    logInterval: options.logMemory !== false ? 2000 : null,
    logCategory,
    coloredName,
  })

  captureProcessOutput(child, output)

  const exitPromise = new Promise<number | null>((resolve, reject) => {
    child.on('exit', code => resolve(code))
    child.on('error', err =>
      reject(new Error(`Failed to spawn ${processName}: ${(err as Error).message}`))
    )
  })

  let code: number | null
  try {
    if (timeout > 0) {
      code = await Promise.race([
        exitPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            monitoring.stopMonitoring()
            child.kill('SIGTERM')
            reject(new Error(`Process ${processName} timed out after ${timeout}ms`))
          }, timeout)
        ),
      ])
    } else {
      code = await exitPromise
    }
  } catch (err) {
    monitoring.stopMonitoring()
    throw err
  }

  monitoring.stopMonitoring()
  log.debug(logCategory, `[${coloredName}] RAM: ${ORANGE}${monitoring.getPeakRss().toFixed(1)}MB${RESET}`)
  return handleProcessExit(code, output, monitoring.getPeakRss(), memBeforeMb)
}

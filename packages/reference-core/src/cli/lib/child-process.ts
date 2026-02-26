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

  let peakRss = 0
  let monitorInterval: NodeJS.Timeout | null = null

  const getRssMb = () => getProcessRssMb(child.pid)

  const updatePeakRss = () => {
    const rss = getRssMb()
    if (rss !== null && rss > peakRss) {
      peakRss = rss
    }
    return rss
  }

  if (logMemory) {
    monitorInterval = setInterval(() => {
      const rss = updatePeakRss()
      if (rss !== null) {
        log.debug(
          logCategory,
          `[${coloredName}] RAM: ${ORANGE}${rss.toFixed(1)}MB${RESET}`
        )
      }
    }, memoryMonitorInterval)
  }

  const stopMonitoring = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval)
      monitorInterval = null
    }
  }

  // Auto-cleanup on exit
  child.on('exit', () => {
    stopMonitoring()
  })

  return {
    process: child,
    stopMonitoring,
    getRssMb,
    getPeakRssMb: () => peakRss,
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
  const memBefore = process.memoryUsage().rss / 1024 / 1024

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...spawnOptions,
      stdio: spawnOptions.stdio || ['ignore', 'pipe', 'pipe'],
    })

    log.debug(logCategory, `[${coloredName}] spawned PID ${child.pid}`)

    let stdout = ''
    let stderr = ''
    let peakChildRss = 0
    let timeoutHandle: NodeJS.Timeout | null = null

    // Monitor child memory frequently
    const memMonitor = setInterval(() => {
      const childRss = getProcessRssMb(child.pid)
      if (childRss !== null && childRss > peakChildRss) {
        peakChildRss = childRss
      }
    }, memoryMonitorInterval)

    // Log child RSS periodically (every 2s) so we see progress during long runs
    const logMemory = options.logMemory !== false
    const logInterval =
      logMemory &&
      setInterval(() => {
        const childRss = getProcessRssMb(child.pid)
        if (childRss !== null) {
          log.debug(
            logCategory,
            `[${coloredName}] RAM: ${ORANGE}${childRss.toFixed(1)}MB${RESET}`
          )
        }
      }, 2000)

    if (timeout > 0) {
      timeoutHandle = setTimeout(() => {
        child.kill('SIGTERM')
        clearInterval(memMonitor)
        if (logInterval) clearInterval(logInterval)
        reject(new Error(`Process ${processName} timed out after ${timeout}ms`))
      }, timeout)
    }

    child.stdout?.on('data', chunk => {
      stdout += chunk.toString()
    })

    child.stderr?.on('data', chunk => {
      stderr += chunk.toString()
    })

    child.on('error', error => {
      if (timeoutHandle) clearTimeout(timeoutHandle)
      clearInterval(memMonitor)
      if (logInterval) clearInterval(logInterval)
      reject(new Error(`Failed to spawn ${processName}: ${error.message}`))
    })

    child.on('exit', code => {
      if (timeoutHandle) clearTimeout(timeoutHandle)
      clearInterval(memMonitor)
      if (logInterval) clearInterval(logInterval)

      const memAfter = process.memoryUsage().rss / 1024 / 1024
      const parentDelta = memAfter - memBefore

      log.debug(
        logCategory,
        `[${coloredName}] RAM: ${ORANGE}${peakChildRss.toFixed(1)}MB${RESET}`
      )

      resolve({
        code,
        stdout,
        stderr,
        peakChildRssMb: peakChildRss,
        parentRssDeltaMb: parentDelta,
      })
    })
  })
}

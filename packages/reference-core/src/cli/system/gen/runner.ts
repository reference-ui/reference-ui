import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { log } from '../../lib/log'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
 * Start monitoring child process RSS and log periodically
 */
function startMemoryMonitoring(
  processName: string,
  pid: number | undefined,
  interval: number = 5000
): NodeJS.Timeout | null {
  if (!pid) return null

  return setInterval(() => {
    const rss = getProcessRssMb(pid)
    if (rss !== null) {
      log.debug('system:gen', `[${processName}] PID ${pid} RSS: ${rss.toFixed(1)}MB`)
    }
  }, interval)
}

function resolvePandaBin(): string {
  // When bundled, __dirname is dist/; CLI root is two levels up from panda/gen/
  const cliRoot = resolve(__dirname, '../..')
  const candidates = [
    resolve(cliRoot, 'node_modules/.bin/panda'),
    resolve(cliRoot, '../node_modules/.bin/panda'),
    resolve(cliRoot, '../../node_modules/.bin/panda'),
  ]

  for (const bin of candidates) {
    if (existsSync(bin)) {
      return bin
    }
  }

  throw new Error(
    `@reference-ui/core: panda not found. Ensure @pandacss/dev is installed. Searched: ${candidates.join(', ')}`
  )
}

export interface PandaOptions {
  watch?: boolean
}

export function runPandaCodegen(cwd: string, options: PandaOptions = {}): void {
  log.debug('system:gen', 'Starting codegen...')
  const pandaBin = resolvePandaBin()

  if (options.watch) {
    // Spawn Panda watchers as child processes
    // stdio: 'inherit' forwards all output to parent terminal
    // These processes keep the event loop alive - parent never exits
    const memBefore = process.memoryUsage().rss / 1024 / 1024
    
    const codegenProcess = spawn(pandaBin, ['codegen', '--watch', '--poll'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    })
    log.debug('system:gen', `[codegen] spawned PID ${codegenProcess.pid}`)

    const cssProcess = spawn(pandaBin, ['--watch', '--poll'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    })
    log.debug('system:gen', `[css] spawned PID ${cssProcess.pid}`)
    
    const memAfter = process.memoryUsage().rss / 1024 / 1024
    log.debug('system:gen', `Parent RSS: ${memBefore.toFixed(1)}MB → ${memAfter.toFixed(1)}MB (+${(memAfter - memBefore).toFixed(1)}MB)`)

    // Start monitoring child process memory
    const codegenMonitor = startMemoryMonitoring('codegen', codegenProcess.pid)
    const cssMonitor = startMemoryMonitoring('css', cssProcess.pid)

    // Forward SIGINT/SIGTERM to children, then exit cleanly
    process.on('SIGINT', () => {
      if (codegenMonitor) clearInterval(codegenMonitor)
      if (cssMonitor) clearInterval(cssMonitor)
      codegenProcess.kill()
      cssProcess.kill()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      if (codegenMonitor) clearInterval(codegenMonitor)
      if (cssMonitor) clearInterval(cssMonitor)
      codegenProcess.kill()
      cssProcess.kill()
      process.exit(0)
    })

    // Function returns but process stays alive (event loop has active children)
    // This blocks the shell - exactly what we want
    return
  }

  execSync(`"${pandaBin}" codegen`, {
    cwd,
    stdio: 'inherit',
  })
}

/** Emit styles.css (preflight + tokens + static CSS) */
export function runPandaCss(cwd: string): void {
  log.debug('system:gen', 'Generating CSS...')
  const pandaBin = resolvePandaBin()
  execSync(`"${pandaBin}"`, {
    cwd,
    stdio: 'inherit',
  })
}

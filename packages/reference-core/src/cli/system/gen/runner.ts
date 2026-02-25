import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { log } from '../../lib/log'
import { spawnMonitored } from '../../lib/child-process'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

/**
 * Run Panda: codegen (TS utilities) + CSS extraction.
 * In watch mode, `panda --watch` does BOTH – no need for separate codegen and css watchers.
 * Panda's default command runs codegen then writes styles.css in one process.
 */
export function runPandaCodegen(cwd: string, options: PandaOptions = {}): void {
  log.debug('system:gen', 'Starting Panda...')
  const pandaBin = resolvePandaBin()

  if (options.watch) {
    const child = spawnMonitored(pandaBin, ['--watch', '--poll'], {
      processName: 'panda',
      cwd,
      stdio: 'inherit',
      shell: true,
      logCategory: 'system:gen',
    })

    process.on('SIGINT', () => {
      child.stopMonitoring()
      child.process.kill()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      child.stopMonitoring()
      child.process.kill()
      process.exit(0)
    })

    return
  }

  // One-shot: `panda` runs codegen + CSS extraction (generate() does both)
  execSync(`"${pandaBin}"`, {
    cwd,
    stdio: 'inherit',
  })
}

/** Emit styles.css (preflight + tokens + static CSS). Use runPandaCodegen for full build. */
export function runPandaCss(cwd: string): void {
  log.debug('system:gen', 'Generating CSS...')
  const pandaBin = resolvePandaBin()
  execSync(`"${pandaBin}"`, {
    cwd,
    stdio: 'inherit',
  })
}

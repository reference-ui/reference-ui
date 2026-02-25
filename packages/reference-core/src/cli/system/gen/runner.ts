import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { log } from '../../lib/log'

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

export function runPandaCodegen(cwd: string, options: PandaOptions = {}): void {
  log.debug('panda', 'Starting codegen...')
  const pandaBin = resolvePandaBin()

  if (options.watch) {
    // Spawn Panda watchers as child processes
    // stdio: 'inherit' forwards all output to parent terminal
    // These processes keep the event loop alive - parent never exits
    const codegenProcess = spawn(pandaBin, ['codegen', '--watch', '--poll'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    })

    const cssProcess = spawn(pandaBin, ['--watch', '--poll'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    })

    // Forward SIGINT/SIGTERM to children, then exit cleanly
    process.on('SIGINT', () => {
      codegenProcess.kill()
      cssProcess.kill()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
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
  log.debug('panda', 'Generating CSS...')
  const pandaBin = resolvePandaBin()
  execSync(`"${pandaBin}"`, {
    cwd,
    stdio: 'inherit',
  })
}

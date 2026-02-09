import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function resolvePandaBin(): string {
  // When bundled, __dirname is dist/; CLI root is one level up.
  const cliRoot = resolve(__dirname, '..')
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
  const pandaBin = resolvePandaBin()
  
  if (options.watch) {
    // Run both codegen --watch and css --watch concurrently using spawn
    const codegenProcess = spawn(pandaBin, ['codegen', '--watch'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    })
    
    const cssProcess = spawn(pandaBin, ['--watch'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    })
    
    // Handle termination
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
    
    return
  }
  
  execSync(`"${pandaBin}" codegen`, {
    cwd,
    stdio: 'inherit',
  })
}

/** Emit styles.css (preflight + tokens + static CSS) */
export function runPandaCss(cwd: string): void {
  const pandaBin = resolvePandaBin()
  execSync(`"${pandaBin}"`, {
    cwd,
    stdio: 'inherit',
  })
}

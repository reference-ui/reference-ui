import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { log } from '../lib/log'

/**
 * Run TypeScript compiler (tsc) via child process.
 * More reliable than programmatic API for declaration generation.
 */
export async function runTsc(cwd: string, args: string[]): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    // Find tsc binary
    const tscPath = findTscBinary(cwd)

    if (!tscPath) {
      rejectPromise(
        new Error(
          'TypeScript compiler not found. Install typescript:\n' +
            '  pnpm add -D typescript\n' +
            '  npm install --save-dev typescript'
        )
      )
      return
    }

    log(`[packager-ts] Running: tsc ${args.join(' ')}`)

    const child = spawn('node', [tscPath, ...args], {
      cwd,
      stdio: ['ignore', 'inherit', 'inherit'], // Stream output in real-time
      env: { ...process.env, FORCE_COLOR: '1' },
    })

    child.on('close', code => {
      if (code === 0) {
        resolvePromise()
      } else {
        rejectPromise(new Error(`tsc exited with code ${code}`))
      }
    })

    child.on('error', error => {
      rejectPromise(new Error(`Failed to spawn tsc: ${error.message}`))
    })
  })
}

/**
 * Find the TypeScript compiler binary.
 * Checks multiple locations in order of preference.
 *
 * Note: We skip node_modules/.bin/tsc because it's a shell script wrapper,
 * not a JavaScript file. We need the actual tsc JS file to run with node.
 */
function findTscBinary(cwd: string): string | null {
  const candidates = [
    // Local node_modules (monorepo or project)
    resolve(cwd, 'node_modules/typescript/bin/tsc'),

    // reference-core's node_modules
    resolve(cwd, 'node_modules/@reference-ui/core/node_modules/typescript/bin/tsc'),

    // Parent node_modules (monorepo root)
    resolve(cwd, '../../node_modules/typescript/bin/tsc'),
    resolve(cwd, '../node_modules/typescript/bin/tsc'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

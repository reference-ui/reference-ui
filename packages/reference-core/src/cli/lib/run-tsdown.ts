import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function resolveTsdownBin(): string {
  // When bundled, __dirname is dist/; CLI root is one level up.
  const cliRoot = resolve(__dirname, '..')
  const candidates = [
    resolve(cliRoot, 'node_modules/.bin/tsdown'),
    resolve(cliRoot, '../node_modules/.bin/tsdown'),
    resolve(cliRoot, '../../node_modules/.bin/tsdown'),
  ]
  
  for (const bin of candidates) {
    if (existsSync(bin)) {
      return bin
    }
  }
  
  throw new Error(
    `@reference-ui/core: tsdown not found. Searched: ${candidates.join(', ')}`
  )
}

export function runTsdown(cwd: string): void {
  const tsdownBin = resolveTsdownBin()
  execSync(`"${tsdownBin}"`, {
    cwd,
    stdio: 'inherit',
  })
}

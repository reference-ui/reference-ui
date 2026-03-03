import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')

export default async function globalSetup() {
  // Clean first for a fresh state, then sync to build the design system
  execSync('pnpm exec ref clean', { cwd: pkgRoot, stdio: 'pipe', timeout: 15_000 })
  execSync('pnpm exec ref sync', {
    cwd: pkgRoot,
    stdio: 'pipe',
    timeout: 45_000,
  })

  // TODO: Add ref sync --watch when design system produces files that need to stay current during tests
}

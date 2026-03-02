import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')

export default async function globalSetup() {
  // Run ref sync once to build the design system (pnpm exec ensures workspace ref is used)
  execSync('pnpm exec ref sync', {
    cwd: pkgRoot,
    stdio: 'pipe',
    timeout: 45_000,
  })

  // TODO: Add ref sync --watch when design system produces files that need to stay current during tests
}

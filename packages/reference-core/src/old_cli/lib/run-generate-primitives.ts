import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

/** Run the generate-primitives script in the core package */
export function runGeneratePrimitives(coreDir: string): void {
  const scriptPath = resolve(coreDir, 'scripts/generate-primitives.cjs')
  execSync(`node "${scriptPath}"`, {
    cwd: coreDir,
    stdio: 'inherit',
  })
}

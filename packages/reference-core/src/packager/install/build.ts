import { cpSync, rmSync } from 'node:fs'

/** Publish a self-contained directory copy into node_modules for build/test flows. */
export function installBuildPackage(targetDir: string, installPath: string): void {
  rmSync(installPath, { recursive: true, force: true })
  cpSync(targetDir, installPath, { recursive: true })
}
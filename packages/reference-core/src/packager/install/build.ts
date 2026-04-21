import { cpSync } from 'node:fs'

/** Publish a self-contained directory copy into node_modules for build/test flows. */
export function installBuildPackage(targetDir: string, installPath: string): void {
  cpSync(targetDir, installPath, { recursive: true })
}
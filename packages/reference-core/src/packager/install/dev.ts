import { createSymlink } from '../../lib/symlink'

/** Publish a live symlink into node_modules for dev/watch flows. */
export function installDevPackage(targetDir: string, installPath: string): void {
  createSymlink(targetDir, installPath)
}
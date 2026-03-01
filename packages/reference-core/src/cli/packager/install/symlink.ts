import { existsSync, lstatSync, rmSync, statSync, unlinkSync } from 'node:fs'
import symlinkDir from 'symlink-dir'

/** Remove symlink or directory at path. Ignores ENOENT. */
export function removeSymlinkOrDir(path: string): void {
  try {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) unlinkSync(path)
    else rmSync(path, { recursive: true, force: true })
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException)?.code !== 'ENOENT') throw e
  }
}

export function createSymlink(targetDir: string, linkPath: string): void {
  if (existsSync(linkPath)) rmSync(linkPath, { recursive: true, force: true })
  if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
    throw new Error(
      `Packager target ${targetDir} must be a directory (symlink-dir requires it on Windows)`
    )
  }
  symlinkDir.sync(targetDir, linkPath)
}

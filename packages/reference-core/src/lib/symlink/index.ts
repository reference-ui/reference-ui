import { existsSync, lstatSync, rmSync, statSync, unlinkSync } from 'node:fs'
import symlinkDir from 'symlink-dir'

/** Remove a symlink or directory at path. Ignores ENOENT. */
export function removeSymlinkOrDir(path: string): void {
  try {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) unlinkSync(path)
    else rmSync(path, { recursive: true, force: true })
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error
  }
}

/**
 * Create a directory symlink, replacing any existing entry first.
 *
 * `symlink-dir` expects the target to already exist as a directory on Windows,
 * so we enforce that precondition here instead of duplicating it at each call
 * site.
 */
export function createSymlink(targetDir: string, linkPath: string): void {
  if (existsSync(linkPath)) rmSync(linkPath, { recursive: true, force: true })
  if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
    throw new Error(
      `Packager target ${targetDir} must be a directory (symlink-dir requires it on Windows)`
    )
  }

  symlinkDir.sync(targetDir, linkPath)
}

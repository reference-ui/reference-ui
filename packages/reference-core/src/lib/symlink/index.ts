import {
  existsSync,
  lstatSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
  unlinkSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import symlinkDir from 'symlink-dir'
import { prepareLinkPathForSymlink } from './prepare-link-path-for-symlink'

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
  if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
    throw new Error(
      `Packager target ${targetDir} must be a directory (symlink-dir requires it on Windows)`
    )
  }

  if (!prepareLinkPathForSymlink(linkPath, targetDir)) return

  symlinkDir.sync(targetDir, linkPath)
}

/**
 * Remove symbolic links whose target path does not exist (e.g. stale
 * `node_modules/@reference-ui/*` links left after a generated package was
 * renamed or removed). Safe for mixed dirs: non-symlinks are left untouched.
 */
export function pruneBrokenSymlinksInDir(dir: string): void {
  if (!existsSync(dir)) return

  for (const name of readdirSync(dir)) {
    const linkPath = join(dir, name)
    let stat
    try {
      stat = lstatSync(linkPath)
    } catch {
      continue
    }
    if (!stat.isSymbolicLink()) continue

    const target = readlinkSync(linkPath)
    const absoluteTarget = resolve(dirname(linkPath), target)
    if (!existsSync(absoluteTarget)) {
      try {
        unlinkSync(linkPath)
      } catch {
        // ignore races
      }
    }
  }
}

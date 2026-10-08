// Directory-symlink helpers for generated package links.
// They take target dirs plus link paths and emit working junctions on
// Windows and POSIX alike, replacing whatever sat there before. All
// platform sharp edges (Windows' target-must-exist rule, stale-link
// pruning, generated-link cleanup) live here so publishers and clean
// never hand-roll fs calls.
import {
  existsSync,
  lstatSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
  unlinkSync,
  type Stats,
} from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { symlinkDirSync } from 'symlink-dir'
import { prepareLinkPathForSymlink } from './prepare.ts'

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

  symlinkDirSync(targetDir, linkPath)
}

/**
 * Remove a generated scope link: only when `linkPath` is a symlink pointing
 * at or inside `outDir`, so a hand-placed file or directory under the scope
 * is never touched. Missing paths, real files, real dirs, and links
 * pointing outside stay put. Returns true when a link was removed.
 *
 * The target check is lexical (no existence probe): clean removes the
 * output folder first, so generated links dangle by the time this runs.
 */
export function removeGeneratedLink(linkPath: string, outDir: string): boolean {
  let stat: Stats | undefined
  try {
    stat = lstatSync(linkPath)
  } catch {
    return false
  }
  if (!stat.isSymbolicLink()) return false
  const target = resolve(dirname(linkPath), readlinkSync(linkPath))
  if (target !== outDir && !target.startsWith(outDir + sep)) return false
  unlinkSync(linkPath)
  return true
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
    let stat: Stats | undefined
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

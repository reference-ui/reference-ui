import { existsSync, lstatSync, readlinkSync, rmSync, unlinkSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Make sure `linkPath` is ready for a directory symlink to `targetDir`.
 *
 * If `linkPath` already points at `targetDir`, this leaves it alone and tells
 * the caller there is nothing left to do. If `linkPath` points somewhere else,
 * or is a real file or directory, it removes that entry so a fresh symlink can
 * be created in its place.
 */
export function prepareLinkPathForSymlink(linkPath: string, targetDir: string): boolean {
  if (!existsSync(linkPath)) return true

  const stat = lstatSync(linkPath)
  if (stat.isSymbolicLink()) {
    const absoluteTarget = resolve(dirname(linkPath), readlinkSync(linkPath))
    if (absoluteTarget === resolve(targetDir)) {
      return false
    }
    unlinkSync(linkPath)
    return true
  }

  rmSync(linkPath, { recursive: true, force: true })
  return true
}
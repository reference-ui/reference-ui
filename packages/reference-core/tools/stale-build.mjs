// Decides whether a `.dist-new-<pid>` build folder is left over from a build that is gone.
// It is a pure function of the folder name, whether that pid is alive, the folder's mtime and the
// current time, and it touches no files. A folder is stale when its pid is not running, or when it
// is older than ten minutes (no build runs that long, so a live pid there was reused by another
// process). The folder of the calling process is never stale. build-bin.mjs reads the facts and
// removes the folders this reports.

export const STALE_BUILD_NAME = /^\.dist-new-(\d+)$/
export const STALE_BUILD_AGE_MS = 10 * 60 * 1000

/**
 * @param {{ name: string, pidAlive: boolean, mtimeMs: number, nowMs: number, ownPid: number }} folder
 * @returns {boolean} true when the folder should be removed
 */
export function isStaleBuildFolder({ name, pidAlive, mtimeMs, nowMs, ownPid }) {
  const match = STALE_BUILD_NAME.exec(name)
  if (match === null || Number(match[1]) === ownPid) return false
  return !pidAlive || nowMs - mtimeMs > STALE_BUILD_AGE_MS
}

/**
 * Tsup plugin: copy files (e.g. prebuild artifacts) to dist.
 * Skips silently when source doesn't exist (e.g. prebuild hasn't run yet).
 */

import { mkdirSync } from 'node:fs'
import { cp } from 'node:fs/promises'
import { dirname } from 'node:path'

export interface CopyFileOptions {
  src: string
  dest: string
  /** Ensure dest directory exists. Default: true */
  mkdir?: boolean
}

export async function copyFile(options: CopyFileOptions): Promise<void> {
  const { src, dest, mkdir: shouldMkdir = true } = options

  try {
    if (shouldMkdir) {
      mkdirSync(dirname(dest), { recursive: true })
    }
    await cp(src, dest)
  } catch {
    // Source may not exist yet (e.g. prebuild hasn't run)
  }
}

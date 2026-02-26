/**
 * File system utilities.
 * Wraps fs-extra with convenient operations for project generation and runner.
 */

import fse from 'fs-extra'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'

/**
 * Create a temporary directory with an optional prefix.
 * Uses system tmp by default.
 * @param prefix - Optional prefix for the directory name
 * @returns Absolute path to the created directory
 */
export async function createTempDir(prefix = 'reference-test-'): Promise<string> {
  const dir = join(tmpdir(), `${prefix}${randomBytes(8).toString('hex')}`)
  await fse.ensureDir(dir)
  return dir
}

/**
 * Create a project directory inside the given base path.
 * @param baseDir - Base directory (e.g. .sandbox)
 * @param name - Folder name (e.g. 'vite-18' for bundler-react version)
 */
export async function createProjectDir(baseDir: string, name: string): Promise<string> {
  const dir = join(baseDir, name)
  await fse.ensureDir(dir)
  return dir
}

/**
 * Write content to a file. Creates parent directories if needed.
 */
export async function writeFile(path: string, content: string): Promise<void> {
  const dir = join(path, '..')
  await fse.ensureDir(dir)
  await fse.writeFile(path, content, 'utf-8')
}

/**
 * Read file contents as string.
 */
export async function readFile(path: string): Promise<string> {
  return fse.readFile(path, 'utf-8')
}

/**
 * Check if a path exists.
 */
export async function pathExists(path: string): Promise<boolean> {
  return fse.pathExists(path)
}

/**
 * Remove a directory and all its contents.
 */
export async function removeDir(path: string): Promise<void> {
  await fse.remove(path)
}

/**
 * Copy a file from source to destination.
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  await fse.copy(src, dest)
}

/**
 * List files in a directory (non-recursive).
 */
export async function listDir(path: string): Promise<string[]> {
  return fse.readdir(path)
}

/**
 * File manipulation hooks for tests.
 * Atomic operations to avoid race conditions.
 */

import { readFile as readFileUtil, writeFile } from '../utils/file-system.js'
import { join } from 'node:path'

/** Read file contents */
export async function readFile(filePath: string): Promise<string> {
  return readFileUtil(filePath)
}

/** Update file: replace search string with replace string */
export async function updateFile(
  filePath: string,
  search: string | RegExp,
  replace: string
): Promise<void> {
  const content = await readFileUtil(filePath)
  const newContent = typeof search === 'string' ? content.replace(search, replace) : content.replace(search, replace)
  await writeFile(filePath, newContent)
}

/** Replace entire file content */
export async function replaceFileContent(filePath: string, newContent: string): Promise<void> {
  await writeFile(filePath, newContent)
}

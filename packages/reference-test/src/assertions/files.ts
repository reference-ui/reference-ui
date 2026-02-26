/**
 * Generated file verifications.
 */

import { pathExists, readFile } from '../utils/file-system.js'

export async function assertFileExists(filePath: string): Promise<boolean> {
  return pathExists(filePath)
}

export async function assertFileContains(filePath: string, content: string): Promise<boolean> {
  const text = await readFile(filePath)
  return text.includes(content)
}

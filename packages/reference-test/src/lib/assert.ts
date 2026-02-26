/**
 * Assertions for test verification.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

export async function assertFilesGenerated(root: string): Promise<boolean> {
  const systemDir = join(root, 'styled-system')
  const reactPkg = join(root, 'node_modules', '@reference-ui', 'react')
  return existsSync(systemDir) || existsSync(reactPkg)
}

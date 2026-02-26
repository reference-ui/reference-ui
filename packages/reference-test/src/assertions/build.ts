/**
 * Build output verifications.
 */

import { pathExists } from '../utils/file-system.js'
import { join } from 'node:path'

/** Assert ref sync produced output (node_modules/@reference-ui/react) */
export async function assertFilesGenerated(projectRoot: string): Promise<boolean> {
  const reactPkg = join(projectRoot, 'node_modules', '@reference-ui', 'react')
  return pathExists(reactPkg)
}

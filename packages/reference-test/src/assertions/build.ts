/**
 * Build output verifications.
 */

import { pathExists } from '../utils/file-system.js'
import { join } from 'node:path'

/** Assert styled-system directory exists */
export async function assertFilesGenerated(projectRoot: string): Promise<boolean> {
  const styledSystemPath = join(projectRoot, 'styled-system')
  return pathExists(styledSystemPath)
}

/**
 * Command execution - wraps CLI commands (sync, build, dev).
 */

import { execCommand } from './process-manager.js'
import type { CommandResult } from './types.js'

/** Run ref sync in project root. Uses pnpm exec ref (workspace dep). */
export async function executeSync(projectRoot: string): Promise<CommandResult> {
  return execCommand('pnpm', ['exec', 'ref', 'sync'], { cwd: projectRoot })
}

/** Run bundler build */
export async function executeBuild(projectRoot: string): Promise<CommandResult> {
  return execCommand('pnpm', ['run', 'build'], { cwd: projectRoot })
}

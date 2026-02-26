/**
 * Console logging for reference-test.
 * Similar to reference-core's cli/lib/log - [module] prefixed, timestamped.
 */

import pc from 'picocolors'

function timestamp(): string {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

/** Log with [module] prefix. Use for project, runner, orchestrator, etc. */
export function log(module: string, ...args: unknown[]) {
  const prefix = `${pc.dim(`[${timestamp()}]`)} ${pc.blue(`[${module}]`)}`
  console.log(prefix, ...args)
}


export function logError(module: string, ...args: unknown[]) {
  const prefix = `${pc.dim(`[${timestamp()}]`)} ${pc.red(`[${module}]`)}`
  console.error(prefix, ...args)
}

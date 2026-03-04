import pc from 'picocolors'
import { log } from '../log'

function createErrorHandler(actionName: string) {
  return (err: unknown) => {
    log.error(`${pc.red('✗')} ${actionName} failed:`)
    if (err instanceof Error) {
      log.error(err.message)
    } else {
      log.error(err)
    }
    process.exit(1)
  }
}

export function runCommand<T extends Record<string, unknown>>(
  execute: (options: T) => Promise<void> | void
): (options: T) => Promise<void> {
  return async (options: T) => {
    try {
      await execute(options)
    } catch (err) {
      createErrorHandler(execute.name || 'Command')(err)
    }
  }
}

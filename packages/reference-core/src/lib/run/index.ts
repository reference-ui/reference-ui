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

export function runCommand(
  execute: (...args: any[]) => Promise<void> | void
): (...args: any[]) => Promise<void> {
  return async (...args: any[]) => {
    try {
      await execute(...args)
    } catch (err) {
      createErrorHandler(execute.name || 'Command')(err)
    }
  }
}

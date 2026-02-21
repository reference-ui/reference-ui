import pc from 'picocolors'

type LogFn = (...args: unknown[]) => void

type Log = LogFn & {
  error: LogFn
  debug: LogFn
  setDebug: (enabled: boolean) => void
}

let isDebug = false

const log = ((...args: unknown[]) => {
  console.log(...args)
}) as Log

log.error = (...args: unknown[]) => {
  console.error(pc.red('error'), ...args)
}

log.debug = (...args: unknown[]) => {
  if (!isDebug) {
    return
  }

  console.log(pc.dim('debug'), ...args)
}

log.setDebug = (enabled: boolean) => {
  isDebug = enabled
}

export function initLog(config: { debug?: boolean }) {
  if (config.debug) {
    log.setDebug(true)
  }
}

export { log }

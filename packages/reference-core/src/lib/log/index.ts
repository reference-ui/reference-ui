import pc from 'picocolors'
import { getConfig } from '../../config/store'

type LogFn = (...args: unknown[]) => void
type LogDebugFn = (module: string, ...args: unknown[]) => void

type Log = LogFn & {
  error: LogFn
  info: LogFn
  debug: LogDebugFn
}

function timestamp(): string {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

const log = ((...args: unknown[]) => {
  console.log(...args)
}) as Log

log.info = (...args: unknown[]) => console.log(...args)

log.error = (...args: unknown[]) => {
  const colored = args.map(arg =>
    typeof arg === 'string' ? pc.red(arg) : arg
  )
  console.error(pc.red('error'), ...colored)
}

log.debug = (module: string, ...args: unknown[]) => {
  if (!getConfig()?.debug) return
  const timePart = pc.dim('[' + timestamp() + ']')
  const modulePart = pc.blue('[' + module + ']')
  console.log(timePart, modulePart, ...args)
}

export { log }

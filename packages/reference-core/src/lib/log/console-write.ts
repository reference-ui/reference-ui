import pc from 'picocolors'
import { getConfig } from '../../config/store'
import type { LogLevel } from './events'
import { formatTransportArg } from './serialize-args'

export function timestamp(): string {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function formatOriginPart(entry: {
  source?: 'worker'
  threadId?: number
}): string | undefined {
  if (entry.source !== 'worker' || typeof entry.threadId !== 'number') return undefined
  return pc.dim(`[worker:${entry.threadId}]`)
}

/** Orange (256-color) for warnings; respects NO_COLOR via picocolors. */
function warnOrange(text: string): string {
  if (!pc.isColorSupported) return text
  return `\x1b[38;5;208m${text}\x1b[39m`
}

function formatWarnLine(args: unknown[]): string {
  return args
    .map(arg => (typeof arg === 'string' ? arg : formatTransportArg(arg)))
    .join(' ')
}

function emitWarn(originArgs: unknown[], args: unknown[]): void {
  console.warn(...originArgs, warnOrange(`[ref sync] ${formatWarnLine(args)}`))
}

function emitError(originArgs: unknown[], args: unknown[]): void {
  const colored = args.map(arg => (typeof arg === 'string' ? pc.red(arg) : arg))
  console.error(pc.red('error'), ...originArgs, ...colored)
}

function emitDebug(
  originArgs: unknown[],
  args: unknown[],
  options: { module?: string; timestamp?: string }
): void {
  if (!getConfig()?.debug) return
  const timePart = pc.dim('[' + (options.timestamp ?? timestamp()) + ']')
  const modulePart = pc.blue('[' + (options.module ?? 'log') + ']')
  console.log(timePart, ...originArgs, modulePart, ...args)
}

export function writeLogEntry(
  level: LogLevel,
  args: unknown[],
  options: {
    module?: string
    source?: 'worker'
    threadId?: number
    timestamp?: string
  } = {}
): void {
  const originPart = formatOriginPart(options)
  const originArgs = originPart ? [originPart] : []

  if (level === 'log' || level === 'info') {
    console.log(...originArgs, ...args)
    return
  }

  if (level === 'warn') {
    emitWarn(originArgs, args)
    return
  }

  if (level === 'error') {
    emitError(originArgs, args)
    return
  }

  if (level === 'debug') {
    emitDebug(originArgs, args, options)
  }
}

/** Same styling as `log.warn`, but no worker relay (no `[worker:N]` prefix). */
export function warnRefSync(...args: unknown[]): void {
  console.warn(warnOrange(`[ref sync] ${formatWarnLine(args)}`))
}

import pc from 'picocolors'
import { getConfig } from '../../config/store'
import type { LogLevel } from './events'
import { formatBrandPrefix, formatDimTag, normalizeLogArgs } from './presentation'

export function timestamp(): string {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function emitStandard(
  level: Exclude<LogLevel, 'debug'>,
  originArgs: unknown[],
  args: unknown[],
  options: { module?: string; label?: string; badge?: string }
): void {
  const normalized = normalizeLogArgs(args, options)
  const prefix: unknown[] = [
    formatBrandPrefix(level, {
      badge: options.badge,
    }),
    ...originArgs,
  ]

  if (normalized.module) {
    prefix.push(formatDimTag(normalized.module))
  }

  if (normalized.label) {
    prefix.push(formatDimTag(normalized.label))
  }

  if (level === 'error') {
    console.error(...prefix, ...normalized.args)
    return
  }

  if (level === 'warn') {
    console.warn(...prefix, ...normalized.args)
    return
  }

  console.log(...prefix, ...normalized.args)
}

function emitDebug(
  originArgs: unknown[],
  args: unknown[],
  options: { module?: string; label?: string; badge?: string; timestamp?: string }
): void {
  if (!getConfig()?.debug) return
  const normalized = normalizeLogArgs(args, { module: options.module, label: options.label })
  const timePart = pc.dim('[' + (options.timestamp ?? timestamp()) + ']')
  const modulePart = pc.blue('[' + (normalized.module ?? 'log') + ']')
  const prefix: unknown[] = [timePart, ...originArgs, modulePart]

  if (normalized.label) {
    prefix.push(formatDimTag(normalized.label))
  }

  console.log(...prefix, ...normalized.args)
}

export function writeLogEntry(
  level: LogLevel,
  args: unknown[],
  options: {
    module?: string
    label?: string
    badge?: string
    source?: 'worker'
    threadId?: number
    timestamp?: string
  } = {}
): void {
  const originArgs: unknown[] = []

  if (level === 'log' || level === 'info') {
    emitStandard(level, originArgs, args, options)
    return
  }

  if (level === 'warn') {
    emitStandard(level, originArgs, args, options)
    return
  }

  if (level === 'error') {
    emitStandard(level, originArgs, args, options)
    return
  }

  if (level === 'debug') {
    emitDebug(originArgs, args, options)
  }
}

/** Same styling as `log.warn`, but no worker relay (no `[worker:N]` prefix). */
export function warnRefSync(...args: unknown[]): void {
  writeLogEntry('warn', args, { badge: 'ref', module: 'sync' })
}

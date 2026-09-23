import pc from 'picocolors'
import type { LogLevel } from './events'

const REF_ACCENT_FG = '\x1b[38;5;75m'
const ANSI_RESET_FG = '\x1b[39m'

function extractLeadingTag(value: string): { tag: string; rest: string } | undefined {
  if (!value.startsWith('[')) return undefined

  const closingIndex = value.indexOf(']')
  if (closingIndex <= 1) return undefined

  const tag = value.slice(1, closingIndex)
  const remainder = value.slice(closingIndex + 1)

  return {
    tag,
    rest: remainder.trimStart(),
  }
}

export function normalizeLogArgs(
  args: unknown[],
  options: { module?: string; label?: string }
): { args: unknown[]; module?: string; label?: string } {
  if (typeof args[0] !== 'string' || options.module) {
    return { args, module: options.module, label: options.label }
  }

  const leadingTag = extractLeadingTag(args[0])
  if (!leadingTag) {
    return { args, module: options.module, label: options.label }
  }

  const nextArgs = args.slice(1)
  if (leadingTag.rest.length > 0) {
    nextArgs.unshift(leadingTag.rest)
  }

  return {
    args: nextArgs,
    module: leadingTag.tag,
    label: options.label,
  }
}

export function formatDimTag(value: string): string {
  return pc.blackBright(value)
}

function formatAccentText(value: string): string {
  if (!pc.isColorSupported) return value
  return `${REF_ACCENT_FG}${value}${ANSI_RESET_FG}`
}

function warnOrange(text: string): string {
  if (!pc.isColorSupported) return text
  return `\x1b[38;5;208m${text}\x1b[39m`
}

export function formatBrandPrefix(
  level: Exclude<LogLevel, 'debug'>,
  options: { badge?: string }
): string {
  const prefixText = options.badge ?? 'ref'

  if (level === 'warn') return warnOrange(`${prefixText} →`)
  if (level === 'error') return pc.red(`${prefixText} →`)
  return formatAccentText(`${prefixText} →`)
}
/**
 * Simple log util for the test orchestrator - minimal version of reference-core/lib/log.
 */

import pc from 'picocolors'

type LogFn = (...args: unknown[]) => void

function timestamp(): string {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

let debugEnabled = false

export function setDebug(enabled: boolean) {
  debugEnabled = enabled
}

export function info(...args: unknown[]) {
  console.log(...args)
}

export function error(...args: unknown[]) {
  const colored = args.map(arg => (typeof arg === 'string' ? pc.red(arg) : arg))
  console.error(pc.red('error'), ...colored)
}

export function debug(module: string, ...args: unknown[]) {
  if (!debugEnabled) return
  const ts = pc.dim(`[${timestamp()}]`)
  const mod = pc.cyan(`[${module}]`)
  console.log(ts, mod, ...args)
}

export const log = Object.assign(
  (...args: unknown[]) => info(...args),
  { info, error, debug }
)

import { inspect } from 'node:util'

function isPassThroughPrimitive(arg: unknown): boolean {
  const t = typeof arg
  return t === 'string' || t === 'number' || t === 'boolean' || t === 'undefined'
}

function isStringCoercedPrimitive(arg: unknown): boolean {
  const t = typeof arg
  return t === 'bigint' || t === 'function' || t === 'symbol'
}

/** Serialize log args for worker → main transport (structured + safe for postMessage). */
export function formatTransportArg(arg: unknown): unknown {
  if (arg instanceof Error) {
    return arg.stack ?? `${arg.name}: ${arg.message}`
  }
  if (isPassThroughPrimitive(arg)) {
    return arg
  }
  if (isStringCoercedPrimitive(arg)) {
    return String(arg)
  }
  if (arg === null) return null

  return inspect(arg, {
    colors: false,
    compact: false,
    breakLength: 80,
    depth: 6,
    sorted: true,
  })
}

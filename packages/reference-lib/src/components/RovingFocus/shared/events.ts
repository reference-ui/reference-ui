/** Slot event chaining for the RovingFocus kernel. `chainSlotHandlers`
 * composes the child, part, and kernel listeners for one event key into a
 * single handler with DOM-faithful gating: the child always runs, while the
 * part and kernel each skip once anyone prevented default. That kernel gate
 * is what makes nesting work — an inner composite's prevention stops the
 * outer kernel while outer consumer handlers still fire. */

export type AnyHandler = (event: any, ...rest: unknown[]) => void

export function isHandlerKey(key: string, value: unknown): value is AnyHandler {
  return typeof value === 'function' && key.length > 2 && key.startsWith('on') && key[2] === key[2]?.toUpperCase()
}

export function eventWasPrevented(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'defaultPrevented' in value &&
    (value as { defaultPrevented?: unknown }).defaultPrevented === true
  )
}

// Child handler always runs (DOM-faithful: prevention never un-fires a local
// listener); part and kernel handlers each skip once anyone prevented. The
// kernel gate is what makes nesting work: an inner composite's prevention
// stops the outer kernel while outer consumer handlers still fire (RF-NEST-01
// handled-once + RF-NEST-02 bubbled fallback), and stopPropagation never
// affects this manual chain (RF-KEY-08).
export function chainSlotHandlers(
  childHandler: unknown,
  partHandler: unknown,
  kernelHandler?: AnyHandler | undefined
): AnyHandler | undefined {
  const fns = [childHandler, partHandler, kernelHandler].filter(
    (fn): fn is AnyHandler => typeof fn === 'function'
  )
  if (fns.length === 0) return undefined
  if (fns.length === 1) return fns[0]
  return function chainedSlotHandler(event: unknown, ...rest: unknown[]) {
    for (let i = 0; i < fns.length; i++) {
      if (i > 0 && eventWasPrevented(event)) return
      fns[i]?.(event, ...rest)
    }
  }
}

/**
 * The Tab decision: resolveTabTarget names the next stop for one Tab or
 * Shift+Tab press given the live candidate list, the deep active element,
 * and whether that element sits inside the lock. Boundaries wrap, outside
 * focus re-enters at the near edge, and stepping stays in list order — the
 * hook around it owns preventDefault and the actual move.
 */

export function resolveTabTarget(
  tabbables: HTMLElement[],
  active: HTMLElement | null,
  shiftKey: boolean,
  inside: boolean
): HTMLElement {
  const first = tabbables[0]
  const last = tabbables[tabbables.length - 1]
  if (!inside || !active || !tabbables.includes(active)) {
    return shiftKey ? last : first
  }
  const index = tabbables.indexOf(active)
  if (!shiftKey) {
    return tabbables[index + 1] ?? first
  }
  return tabbables[index - 1] ?? last
}

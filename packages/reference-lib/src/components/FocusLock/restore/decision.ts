/**
 * Restore decisions without a browser: captureRestoreOrigin snapshots the
 * pre-activation origin (outside focus, else the caller's default, else the
 * last pointer target, else whatever was active), and resolveRestoreTarget
 * picks the deactivation landing (explicit target, captured origin, proximity
 * walk, default). Both take their focusability and membership predicates as
 * arguments so the priority chains prove out against stubs.
 */

export type RestoreSnapshot = {
  node: HTMLElement | null
  parent: HTMLElement | null
  next: Node | null
  prev: Node | null
}

export function captureRestoreOrigin(args: {
  active: HTMLElement | null
  body: Element | null
  defaultTarget: HTMLElement | null
  pointer: HTMLElement | null
  isInside: (node: HTMLElement) => boolean
  isFocusable: (node: HTMLElement) => boolean
}): RestoreSnapshot {
  const { active, body, defaultTarget, pointer, isInside, isFocusable } = args
  const pointerFallback =
    pointer && !isInside(pointer) && isFocusable(pointer) ? pointer : null
  const origin =
    active && active !== body && !isInside(active)
      ? active
      : defaultTarget && isFocusable(defaultTarget)
        ? defaultTarget
        : pointerFallback || active
  return {
    node: origin,
    parent: origin?.parentElement || null,
    next: origin?.nextElementSibling || null,
    prev: origin?.previousElementSibling || null,
  }
}

export function resolveRestoreTarget(args: {
  active: HTMLElement | null
  body: Element | null
  container: HTMLElement | null
  explicit: HTMLElement | null
  captured: RestoreSnapshot | null
  defaultTarget: HTMLElement | null
  isInside: (node: HTMLElement) => boolean
  isFocusable: (node: HTMLElement) => boolean
  findProximity: (
    node: HTMLElement | null,
    parent: HTMLElement | null,
    next: Node | null,
    prev: Node | null
  ) => HTMLElement | null
}): HTMLElement | null {
  const {
    active,
    body,
    container,
    explicit,
    captured,
    defaultTarget,
    isInside,
    isFocusable,
    findProximity,
  } = args
  const alreadyMoved =
    active &&
    active !== body &&
    active.isConnected &&
    isFocusable(active) &&
    (!container || !container.isConnected || !isInside(active))
  if (alreadyMoved) {
    return null
  }

  if (explicit && explicit.isConnected && isFocusable(explicit)) {
    return explicit
  }
  if (captured?.node && captured.node.isConnected && isFocusable(captured.node)) {
    return captured.node
  }
  if (captured) {
    const proximity = findProximity(captured.node, captured.parent, captured.next, captured.prev)
    if (proximity) return proximity
  }
  if (defaultTarget && defaultTarget.isConnected && isFocusable(defaultTarget)) {
    return defaultTarget
  }
  return null
}

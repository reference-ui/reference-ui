export function eventPath(event: Event): EventTarget[] {
  if (typeof event.composedPath === 'function') {
    return event.composedPath()
  }
  const path: EventTarget[] = []
  let node: Node | null = event.target instanceof Node ? event.target : null
  while (node) {
    path.push(node)
    const shadow = node as Node & { host?: Element }
    node = node.parentNode ?? (shadow.host as Node | null) ?? null
  }
  if (typeof document !== 'undefined') {
    path.push(document, document.defaultView as Window)
  }
  return path
}

export function isEventInside(container: Node | null | undefined, event: Event): boolean {
  if (!container) return false
  for (const node of eventPath(event)) {
    if (node === container) return true
    if (node instanceof Node && container.contains(node)) return true
  }
  return false
}

export function isNodeInside(container: Node | null | undefined, node: Node | null): boolean {
  if (!container || !node) return false
  if (container === node || container.contains(node)) return true
  let current: Node | null = node
  while (current) {
    if (current === container) return true
    const root = current.getRootNode?.()
    current =
      current.parentNode ??
      (root instanceof ShadowRoot ? root.host : null)
  }
  return false
}

export function closestFromEvent(event: Event, selector: string): Element | null {
  for (const node of eventPath(event)) {
    if (!(node instanceof Element)) continue
    if (node.matches(selector)) return node
    const hit = node.closest(selector)
    if (hit) return hit
  }
  return null
}

export function eventElement(event: Event): Element | null {
  for (const node of eventPath(event)) {
    if (node instanceof Element) return node
  }
  const target = event.target
  if (target instanceof Element) return target
  if (target instanceof Node) return target.parentElement
  return null
}

export function isPrimaryPointer(event: PointerEvent): boolean {
  return event.isPrimary !== false && event.button === 0
}

export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

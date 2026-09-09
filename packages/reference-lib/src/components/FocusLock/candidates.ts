/** Native tabbable catalog for FocusLock. Positive tabIndex stays document order. */

const CANDIDATE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
  '[contenteditable]:not([contenteditable="false"])',
  'summary',
  'audio[controls]',
  'video[controls]',
  'iframe',
].join(',')

export function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false
  if (el.hasAttribute('hidden') || el.closest('[hidden]')) return false
  if (el.hasAttribute('inert') || el.closest('[inert]')) return false

  try {
    const style = el.ownerDocument.defaultView?.getComputedStyle(el)
    if (
      !style ||
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse'
    ) {
      return false
    }
  } catch {
    return false
  }

  return true
}

function firstLegend(fieldset: HTMLFieldSetElement): HTMLLegendElement | null {
  for (const child of fieldset.children) {
    if (child instanceof HTMLLegendElement) return child
  }
  return null
}

function firstSummary(details: HTMLDetailsElement): HTMLElement | null {
  for (const child of details.children) {
    if (child instanceof HTMLElement && child.tagName === 'SUMMARY') return child
  }
  return null
}

function isDisabledFieldsetExcluded(el: HTMLElement): boolean {
  const fieldset = el.closest('fieldset[disabled]')
  if (!(fieldset instanceof HTMLFieldSetElement)) return false
  const legend = firstLegend(fieldset)
  return !legend || !legend.contains(el)
}

function isClosedDetailsExcluded(el: HTMLElement): boolean {
  let current: HTMLElement | null = el
  while (current) {
    if (current instanceof HTMLDetailsElement && !current.open) {
      const summary = firstSummary(current)
      if (summary && (el === summary || summary.contains(el))) {
        current = current.parentElement
        continue
      }
      return true
    }
    current = current.parentElement
  }
  return false
}

function hasRenderedBox(el: HTMLElement): boolean {
  if (el.getClientRects().length > 0) return true
  if (el.offsetWidth > 0 || el.offsetHeight > 0) return true
  return el.tagName === 'IFRAME'
}

export function isElementFocusable(el: HTMLElement): boolean {
  if (!isElementVisible(el)) return false
  if ((el as HTMLButtonElement).disabled) return false
  if (isDisabledFieldsetExcluded(el)) return false
  if (isClosedDetailsExcluded(el)) return false
  const tabIndex = tabIndexValue(el)
  if (tabIndex !== null && tabIndex >= -1) return true
  return isNativelyTabbableKind(el)
}

function tabIndexValue(el: HTMLElement): number | null {
  if (!el.hasAttribute('tabindex')) return null
  const parsed = Number.parseInt(el.getAttribute('tabindex') || '', 10)
  return Number.isNaN(parsed) ? null : parsed
}

function isNativelyTabbableKind(el: HTMLElement): boolean {
  const tag = el.tagName
  if (tag === 'A') return el.hasAttribute('href')
  if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA') return true
  if (tag === 'INPUT') return (el as HTMLInputElement).type !== 'hidden'
  if (tag === 'IFRAME' || tag === 'SUMMARY') return true
  if (tag === 'AUDIO' || tag === 'VIDEO') return el.hasAttribute('controls')
  const editable = el.getAttribute('contenteditable')
  return editable !== null && editable !== 'false'
}

export function isElementTabbable(el: HTMLElement): boolean {
  if (!isElementFocusable(el)) return false
  const tabIndex = tabIndexValue(el)
  if (tabIndex !== null && tabIndex < 0) return false
  if (tabIndex !== null && tabIndex >= 0) return hasRenderedBox(el)
  if (!isNativelyTabbableKind(el)) return false
  return hasRenderedBox(el)
}

function radioGroupKey(el: HTMLInputElement): string {
  const name = el.name
  if (!name) return ''
  const formId = el.form ? `form:${el.form.id || 'anon'}` : 'doc'
  return `${formId}:${name}`
}

function includeRadio(el: HTMLElement, radioState: Map<string, HTMLInputElement | null>): boolean {
  if (!(el instanceof HTMLInputElement) || el.type !== 'radio' || !el.name) return true
  const key = radioGroupKey(el)
  const checked = radioState.get(key)
  if (checked) return checked === el
  return true
}

function collectRadioState(candidates: HTMLElement[]): Map<string, HTMLInputElement | null> {
  const state = new Map<string, HTMLInputElement | null>()
  for (const el of candidates) {
    if (!(el instanceof HTMLInputElement) || el.type !== 'radio' || !el.name) continue
    const key = radioGroupKey(el)
    if (!state.has(key)) state.set(key, null)
    if (el.checked) state.set(key, el)
  }
  return state
}

function walkComposed(node: Node, into: HTMLElement[]): void {
  if (node instanceof HTMLElement) {
    if (isElementTabbable(node)) into.push(node)

    if (node instanceof HTMLDetailsElement && !node.open) {
      const summary = firstSummary(node)
      if (summary) walkComposed(summary, into)
      return
    }

    const shadow = node.shadowRoot
    if (shadow) {
      if (shadow.mode === 'open') {
        for (const child of shadow.childNodes) walkComposed(child, into)
      }
      return
    }

    if (node instanceof HTMLSlotElement) {
      const assigned = node.assignedNodes({ flatten: true })
      if (assigned.length > 0) {
        for (const assignedNode of assigned) walkComposed(assignedNode, into)
        return
      }
    }
  } else if (node instanceof ShadowRoot) {
    for (const child of node.childNodes) walkComposed(child, into)
    return
  }

  for (const child of node.childNodes) walkComposed(child, into)
}

function hostInDocument(el: HTMLElement): HTMLElement {
  let current: Node = el
  while (current) {
    const root = current.getRootNode()
    if (root instanceof ShadowRoot) {
      current = root.host
      continue
    }
    return current instanceof HTMLElement ? current : el
  }
  return el
}

function documentOrder(a: HTMLElement, b: HTMLElement): number {
  if (a === b) return 0
  const aHost = hostInDocument(a)
  const bHost = hostInDocument(b)
  if (aHost === bHost) return 0
  const position = aHost.compareDocumentPosition(bHost)
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

export function getTabbableCandidates(
  container: HTMLElement,
  shards: HTMLElement[] = []
): HTMLElement[] {
  const roots = [container, ...shards].filter(root => root && root.isConnected)
  const collected: HTMLElement[] = []
  for (const root of roots) {
    walkComposed(root, collected)
  }

  const unique = Array.from(new Set(collected)).filter(el => {
    if (el === container && tabIndexValue(el) !== null && (tabIndexValue(el) as number) < 0) {
      return false
    }
    return true
  })

  const radioState = collectRadioState(unique)
  const eligible = unique.filter(el => includeRadio(el, radioState))
  eligible.sort(documentOrder)
  return eligible
}

export function findFocusableProximity(
  node: HTMLElement | null,
  parent: HTMLElement | null,
  next: Node | null,
  prev: Node | null
): HTMLElement | null {
  if (node && isElementFocusable(node) && node.isConnected) {
    return node
  }

  const liveParent =
    (node && node.isConnected ? node.parentElement : null) || parent
  const liveNext =
    (node && node.isConnected ? node.nextElementSibling : null) ||
    (next instanceof HTMLElement ? next : null)
  const livePrev =
    (node && node.isConnected ? node.previousElementSibling : null) ||
    (prev instanceof HTMLElement ? prev : null)

  let curr: Element | null =
    liveNext instanceof Element ? liveNext : null
  while (curr) {
    if (curr instanceof HTMLElement && curr.isConnected) {
      if (isElementFocusable(curr) && isElementTabbable(curr)) return curr
      const desc = getTabbableCandidates(curr)[0]
      if (desc) return desc
      if (isElementFocusable(curr)) return curr
    }
    curr = curr.nextElementSibling
  }

  curr = livePrev instanceof Element ? livePrev : null
  while (curr) {
    if (curr instanceof HTMLElement && curr.isConnected) {
      const focusables = getTabbableCandidates(curr)
      if (focusables.length > 0) return focusables[focusables.length - 1]
      if (isElementFocusable(curr)) return curr
    }
    curr = curr.previousElementSibling
  }

  curr = liveParent
  while (curr) {
    if (curr instanceof HTMLElement && curr.isConnected && isElementFocusable(curr)) {
      return curr
    }
    curr = curr.parentElement
  }

  return null
}

export { CANDIDATE_SELECTOR }

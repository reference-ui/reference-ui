import * as React from 'react'
import { A, Div, type PrimitiveProps } from '@reference-ui/react'
import {
  Overlay,
  OverlayPortal,
  isEventConsumed,
  isEventInside,
  isPrimaryPointer,
  markEventConsumed,
  overlayStackStore,
  useOverlay,
  type OverlayContentProps,
} from '../Overlay'
import { isInsideLayer } from '../Overlay/dismiss'
import { RovingFocus, getDirection } from '../RovingFocus'
import { controlSize, controlHeightPx } from '../../core/theme/primitives/shared'
import {
  asRect as intentAsRect,
  evaluateSubmenuIntent,
  SUBMENU_CLOSE_DELAY_MS,
  SUBMENU_OPEN_DELAY_MS,
  type Point as IntentPoint,
  type PointerSample as IntentSample,
  type Side as IntentSide,
} from './menu-intent'

export type MenuProps = PrimitiveProps<'div'> & {
  /** Nested-only: controlled submenu open. Omitted nested open is controlled false. */
  open?: boolean
  /** Nested-only: submenu open request. */
  onOpen?: () => void
  /** Nested-only: submenu dismiss request. */
  onDismiss?: () => void
}

export type MenuEntryStrategy = 'first' | 'last' | null

// Pending trigger-key entry intent. The trigger lives outside the mounted
// Menu (it stays mounted while the Popover is closed), so the opening key is
// recorded here by useMenuTriggerKeys and consumed once per open by Menu.
let pendingMenuEntry: MenuEntryStrategy = null

function setMenuEntryIntent(strategy: MenuEntryStrategy) {
  pendingMenuEntry = strategy
}

function consumeMenuEntryIntent(): MenuEntryStrategy {
  const strategy = pendingMenuEntry
  pendingMenuEntry = null
  return strategy
}

// Keyboard-entry wiring for a Popover.Trigger that opens a root Menu.
// Spread the result onto the trigger; chain consumer handlers first so a
// consumer preventDefault still wins.
export function useMenuTriggerKeys() {
  const overlay = useOverlay()
  const isOpen = overlay?.isOpen ?? false

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.defaultPrevented || !overlay) return
      // Entry intent is recorded only by a press that opens. A press on an
      // already-open trigger opens nothing, so it must plant nothing: the
      // cell has no owner and any later open would consume the stale intent.
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (!isOpen) setMenuEntryIntent('first')
        overlay.setIsOpen(true)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!isOpen) setMenuEntryIntent('last')
        overlay.setIsOpen(true)
      }
    },
    [overlay, isOpen]
  )

  const onClick = React.useCallback((_e: React.MouseEvent<HTMLButtonElement>) => {
    // Pointer opening focuses the menu itself, never an item. Keyboard
    // Enter/Space never reach here: the keydown above prevents activation.
    setMenuEntryIntent(null)
  }, [])

  return React.useMemo(() => ({ onKeyDown, onClick }), [onKeyDown, onClick])
}

function restoreFocusToTrigger(
  trigger: HTMLElement | null | undefined,
  fallback: HTMLElement | null | undefined = null
) {
  if (
    trigger &&
    trigger.isConnected &&
    !trigger.hasAttribute('disabled') &&
    trigger.getAttribute('aria-disabled') !== 'true'
  ) {
    trigger.focus()
    return
  }
  if (fallback && fallback.isConnected) {
    fallback.focus()
  }
}

function findNextTabbable(from: HTMLElement, reverse = false): HTMLElement | null {
  const allTabbables = Array.from(
    document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => el.offsetParent !== null || el.offsetWidth > 0)

  const index = allTabbables.indexOf(from)
  if (index === -1) return null
  return reverse ? (allTabbables[index - 1] ?? null) : (allTabbables[index + 1] ?? null)
}

const UNCONSUMED: unique symbol = Symbol('unconsumed')

// First-seen menu id per Overlay root. Overlay (and its triggerRef object)
// outlives Menu across Presence remounts; on real useId the derived value is
// identical at every sighting, and on the React 17 shim (fresh id per
// render) the memo holds the first one. One root Menu per Popover.
const menuIdByTriggerRef = new WeakMap<object, string>()

const MENU_ROOT_ID = 'menu-root'

const ENABLED_MENUITEM_SELECTOR =
  '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled]),' +
  '[role="menuitemcheckbox"]:not([aria-disabled="true"]):not([data-disabled]),' +
  '[role="menuitemradio"]:not([aria-disabled="true"]):not([data-disabled])'

function levelItems(content: HTMLElement | null): HTMLElement[] {
  if (!content) return []
  // Scope to this level: a nested menuitem must resolve to its own content.
  // (Submenu contents portal out as siblings, but never match descendants.)
  return Array.from(content.querySelectorAll<HTMLElement>(ENABLED_MENUITEM_SELECTOR)).filter(
    el => el.closest('[data-reference-menu-content]') === content
  )
}

function focusFirstEnabledItem(content: HTMLElement | null) {
  levelItems(content)[0]?.focus()
}

// B-33: content-focused edge navigation. Pointer-opened menus focus the
// container itself, and RovingFocus keys are item-level only, so the
// container handles its own arrows/Home/End (mirroring RovingFocus 1D
// mapping: PageUp→first, PageDown→last). Callers gate on
// e.target === e.currentTarget so item keys keep roving authority.
function focusEdgeEnabledItem(content: HTMLElement | null, edge: 'first' | 'last') {
  const items = levelItems(content)
  if (items.length === 0) return
  const target = edge === 'last' ? items[items.length - 1] : items[0]
  target?.focus()
}

function handleContentContainerKey(
  e: React.KeyboardEvent<HTMLDivElement>,
  content: HTMLElement | null
): boolean {
  if (e.target !== e.currentTarget) return false
  if (e.key === 'ArrowDown' || e.key === 'Home' || e.key === 'PageUp') {
    e.preventDefault()
    focusEdgeEnabledItem(content, 'first')
    return true
  }
  if (e.key === 'ArrowUp' || e.key === 'End' || e.key === 'PageDown') {
    e.preventDefault()
    focusEdgeEnabledItem(content, 'last')
    return true
  }
  return false
}

// Owning-root reads for ShadowRoot-mounted trees. A trigger or menu living
// in a shadow root retargets document-level lookups (event.target becomes
// the host, document.activeElement never enters), so id and focus discovery
// run against the node's own root.
function owningScope(node: HTMLElement | null): Document | ShadowRoot | null {
  if (typeof document === 'undefined') return null
  const root = node?.getRootNode?.() ?? null
  if (root !== null && typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) {
    return root
  }
  return document
}

function activeElementIn(node: HTMLElement | null): Element | null {
  const scope = owningScope(node)
  if (typeof ShadowRoot !== 'undefined' && scope instanceof ShadowRoot) return scope.activeElement
  return scope?.activeElement ?? null
}

function hoverCapablePointer(pointerType: string, pressure = 0): boolean {
  if (pointerType === 'touch') return false
  if (pointerType === 'mouse' || pointerType === '') return true
  if (pointerType === 'pen') return pressure === 0
  return false
}

function submenuSide(content: HTMLElement | null, fallback: IntentSide): IntentSide {
  const side = content?.getAttribute('data-side')?.split('-')[0]
  if (side === 'top' || side === 'right' || side === 'bottom' || side === 'left') return side
  return fallback
}

// --- Menu level tree -------------------------------------------------------
// Root Menu adopts its Popover layer; each open nested Menu owns one child
// Overlay layer. Levels chain through context; the root owns the submenu
// registry that Escape, outside press, and item selection consult.

interface SubmenuRegistration {
  id: string
  depth: number
  parentId: string
  isOpen: boolean
  getTrigger: () => HTMLElement | null
  getContent: () => HTMLDivElement | null
  requestClose: () => void
}

interface SubmenuIntentState {
  openTimer: ReturnType<typeof setTimeout> | null
  closeTimer: ReturnType<typeof setTimeout> | null
  leavePoint: IntentPoint | null
  prevSample: IntentSample | null
  keyboardOpen: boolean
}

function freshIntentState(): SubmenuIntentState {
  return { openTimer: null, closeTimer: null, leavePoint: null, prevSample: null, keyboardOpen: false }
}

function clearIntentTimer(state: SubmenuIntentState, kind: 'openTimer' | 'closeTimer') {
  if (state[kind]) {
    clearTimeout(state[kind]!)
    state[kind] = null
  }
}

interface MenuLevelValue {
  id: string
  depth: number
  isSubmenu: boolean
  isOpen: boolean
  contentId: string
  // Live node reads. Presence mounts Content a commit after open without
  // re-rendering Menu, so mirrored refs go stale; read at use time.
  getContentNode: () => HTMLDivElement | null
  getTrigger: () => HTMLElement | null
  parent: MenuLevelValue | null
  intent: SubmenuIntentState | null
  requestClose: () => void
  requestOpen: () => void
  requestDeepestClose: () => boolean
  requestTreeDismiss: () => void
  registerSubmenu: (reg: SubmenuRegistration) => () => void
  unwindForPress: (event: Event) => void
  registry: Map<string, SubmenuRegistration>
  /** Submenu levels reconcile authored Content ids through this. */
  setContentId: ((id: string) => void) | null
}

const MenuLevelContext = React.createContext<MenuLevelValue | null>(null)

function useMenuLevel() {
  return React.useContext(MenuLevelContext)
}

function rootTriggerOf(level: MenuLevelValue | null): HTMLElement | null {
  let current = level
  while (current?.parent) current = current.parent
  return current?.getTrigger() ?? null
}

function isLevelDescendantOf(
  registry: Map<string, SubmenuRegistration>,
  id: string,
  ancestorId: string
): boolean {
  let current = registry.get(id)
  while (current) {
    if (current.parentId === ancestorId) return true
    if (current.parentId === MENU_ROOT_ID) return false
    current = registry.get(current.parentId)
  }
  return false
}

function openRegistrationsDeepestFirst(
  registry: Map<string, SubmenuRegistration>
): SubmenuRegistration[] {
  return [...registry.values()].filter(r => r.isOpen).sort((a, b) => b.depth - a.depth)
}

function devWarn(message: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Reference UI: ${message}`)
  }
}

// --- Root Menu -------------------------------------------------------------

const RootMenu = React.forwardRef<HTMLDivElement, MenuProps>(function RootMenu(
  { children, className, style, onKeyDown, id: authoredId, open, onOpen, onDismiss, ...props }: MenuProps,
  ref
) {
  if (open !== undefined || onOpen !== undefined || onDismiss !== undefined) {
    devWarn('Menu `open`/`onOpen`/`onDismiss` apply only to nested Menu. Root open state lives on the wrapping Popover.')
  }
  const overlay = useOverlay()
  const isOpen = overlay?.isOpen ?? false
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const generatedId = React.useId()
  // The React 17 CT shim returns a fresh id every render; capture the first
  // one. Real useId (18/19) is already stable, so this is a no-op there.
  const stableIdRef = React.useRef<string | null>(null)
  if (stableIdRef.current === null) {
    stableIdRef.current = generatedId
  }
  // Derive from the Overlay layer id: Menu unmounts on close, so its own
  // useId would refresh every reopen. The triggerRef-keyed memo holds the
  // first sighting across remounts (matters on the React 17 shim, where
  // useId is fresh every render). No-overlay Menus (always mounted) fall
  // back to the local id.
  const overlayId = overlay?.id ? String(overlay.id).replace(/[^a-zA-Z0-9_-]/g, '') : ''
  const triggerKey: object | null = overlay?.triggerRef ?? null
  let generatedMenuId: string
  if (triggerKey) {
    let memo = menuIdByTriggerRef.get(triggerKey)
    if (!memo) {
      memo = overlayId ? `${overlayId}-menu` : stableIdRef.current
      menuIdByTriggerRef.set(triggerKey, memo)
    }
    generatedMenuId = memo
  } else {
    generatedMenuId = stableIdRef.current
  }
  const menuId = authoredId ?? generatedMenuId

  // Submenu registry + tree operations. Stable callbacks over mutable refs
  // so nested levels never churn subscriptions when open state changes.
  const registryRef = React.useRef(new Map<string, SubmenuRegistration>())
  const overlayRef = React.useRef(overlay)
  overlayRef.current = overlay

  const registerSubmenu = React.useCallback((reg: SubmenuRegistration) => {
    const registry = registryRef.current
    registry.set(reg.id, reg)
    return () => {
      for (const [key, value] of registry) {
        if (value === reg) registry.delete(key)
      }
    }
  }, [])

  const requestRootClose = React.useCallback(() => {
    overlayRef.current?.setIsOpen(false)
  }, [])

  const requestRootDeepestClose = React.useCallback(() => {
    for (const reg of openRegistrationsDeepestFirst(registryRef.current)) {
      reg.requestClose()
      return true
    }
    return false
  }, [])

  const requestRootTreeDismiss = React.useCallback(() => {
    for (const reg of openRegistrationsDeepestFirst(registryRef.current)) {
      reg.requestClose()
    }
    overlayRef.current?.setIsOpen(false)
  }, [])

  const unwindForPress = React.useCallback(
    (event: Event) => {
      const registry = registryRef.current
      // Keep levels containing the press plus their ancestors; close every
      // other open submenu deepest-first. A press outside the whole tree
      // additionally closes the root. Containment reads the composed path:
      // event.target retargets to the shadow host for shadow-internal
      // presses, so a bare target check would unwind the whole tree.
      const keep = new Set<string>()
      for (const reg of registry.values()) {
        if (isEventInside(reg.getTrigger(), event) || isEventInside(reg.getContent(), event)) {
          keep.add(reg.id)
          let ancestorId: string | undefined = reg.parentId
          while (ancestorId && ancestorId !== MENU_ROOT_ID) {
            keep.add(ancestorId)
            ancestorId = registry.get(ancestorId)?.parentId
          }
        }
      }
      const rootContent = menuRef.current
      const rootTrigger = overlayRef.current?.triggerRef.current ?? null
      const rootKept = isEventInside(rootContent, event) || isEventInside(rootTrigger, event)
      for (const reg of openRegistrationsDeepestFirst(registry)) {
        if (!keep.has(reg.id)) reg.requestClose()
      }
      if (!rootKept && keep.size === 0) {
        overlayRef.current?.setIsOpen(false)
      }
    },
    []
  )

  const getRootTrigger = React.useCallback(() => {
    return (overlayRef.current?.triggerRef.current as HTMLElement | null) ?? null
  }, [])

  const getRootContentNode = React.useCallback(() => menuRef.current, [])

  const levelValue = React.useMemo<MenuLevelValue>(
    () => ({
      id: MENU_ROOT_ID,
      depth: 0,
      isSubmenu: false,
      isOpen,
      contentId: menuId,
      getContentNode: getRootContentNode,
      getTrigger: getRootTrigger,
      parent: null,
      intent: null,
      requestClose: requestRootClose,
      requestOpen: () => overlayRef.current?.setIsOpen(true),
      requestDeepestClose: requestRootDeepestClose,
      requestTreeDismiss: requestRootTreeDismiss,
      registerSubmenu,
      unwindForPress,
      registry: registryRef.current,
      setContentId: null,
    }),
    [
      isOpen,
      menuId,
      getRootContentNode,
      getRootTrigger,
      requestRootClose,
      requestRootDeepestClose,
      requestRootTreeDismiss,
      registerSubmenu,
      unwindForPress,
    ]
  )

  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      menuRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [ref]
  )

  // Trigger-key entry focus, consumed once per open. The ref (not the module
  // cell) survives StrictMode effect replay; closing resets for the next open.
  const consumedRef = React.useRef<MenuEntryStrategy | typeof UNCONSUMED>(UNCONSUMED)
  React.useEffect(() => {
    if (!isOpen) {
      consumedRef.current = UNCONSUMED
      return
    }
    if (consumedRef.current === UNCONSUMED) {
      consumedRef.current = consumeMenuEntryIntent()
    }
    const strategy = consumedRef.current

    const frameId = requestAnimationFrame(() => {
      if (!menuRef.current) return

      if (strategy === null) {
        menuRef.current.focus({ preventScroll: true })
        return
      }

      const items = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(ENABLED_MENUITEM_SELECTOR)
      )
      if (items.length === 0) return

      const target = strategy === 'last' ? items[items.length - 1] : items[0]
      target?.focus()
    })

    return () => cancelAnimationFrame(frameId)
  }, [isOpen])

  const wasOpenRef = React.useRef(isOpen)
  React.useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen
    if (!wasOpen || isOpen) return
    if (menuRef.current?.contains(activeElementIn(menuRef.current))) {
      restoreFocusToTrigger(overlay?.triggerRef.current as HTMLElement | null)
    }
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !overlay) return

    if (e.key === 'Tab') {
      e.preventDefault()
      overlay.setIsOpen(false)
      const trigger = overlay.triggerRef.current as HTMLElement | null
      const next = trigger ? findNextTabbable(trigger, e.shiftKey) : null
      if (next) {
        next.focus()
      } else {
        restoreFocusToTrigger(trigger)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      // Level-local Escape: an open submenu absorbs this key; only a
      // submenu-free tree closes the root.
      if (requestRootDeepestClose()) return
      overlay.setIsOpen(false)
      restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
    } else {
      // B-33: arrows/Home/End with focus on the container itself move to
      // the edge item. No-ops unless the container is the key target.
      handleContentContainerKey(e, menuRef.current)
    }
  }

  return (
    <MenuLevelContext.Provider value={levelValue}>
      <Div
        role="menu"
        id={menuId}
        data-reference-menu-content=""
        tabIndex={-1}
        minW="40r"
        bg="ui.dialog.background"
        color="ui.dialog.foreground"
        borderRadius="md"
        p="1r"
        boxShadow="0 4px 16px rgba(0,0,0,0.12)"
        border="1px solid"
        borderColor="ui.dialog.border"
        outline="none"
        className={className}
        style={style}
        onKeyDown={handleKeyDown}
        {...props}
        ref={composedRef}
      >
        <RovingFocus.Root orientation="vertical" loop typeahead>
          <Div display="flex" flexDirection="column" gap="0.5r" outline="none">
            {children}
          </Div>
        </RovingFocus.Root>
      </Div>
    </MenuLevelContext.Provider>
  )
})

// --- Nested Menu -----------------------------------------------------------
// A nested Menu renders no node: it owns one submenu Overlay (one child
// layer per open Content) and provides the child level. Omitted open is
// controlled false; there is no ephemeral submenu state.

function NestedMenuInner({
  parentLevel,
  children,
}: {
  parentLevel: MenuLevelValue
  children: React.ReactNode
}) {
  const overlay = useOverlay()
  const isOpen = overlay?.isOpen ?? false
  const intentRef = React.useRef<SubmenuIntentState | null>(null)
  if (!intentRef.current) intentRef.current = freshIntentState()
  const intent = intentRef.current

  const generatedId = React.useId()
  const stableIdRef = React.useRef<string | null>(null)
  if (stableIdRef.current === null) {
    stableIdRef.current = `menu-${String(generatedId).replace(/[^a-zA-Z0-9_-]/g, '')}`
  }
  // Authored Content ids reconcile through state so Trigger aria-controls
  // never points at a stale duplicate.
  const [contentId, setContentId] = React.useState(stableIdRef.current)

  const isOpenRef = React.useRef(isOpen)
  isOpenRef.current = isOpen
  const overlayRef = React.useRef(overlay)
  overlayRef.current = overlay

  // Registration identity is stable; open/request fields refresh per render.
  const regRef = React.useRef<SubmenuRegistration | null>(null)
  if (!regRef.current) {
    regRef.current = {
      id: contentId,
      depth: parentLevel.depth + 1,
      parentId: parentLevel.id,
      isOpen,
      getTrigger: () => overlayRef.current?.triggerRef.current ?? null,
      getContent: () => overlayRef.current?.contentRef.current ?? null,
      requestClose: () => {},
    }
  }
  const reg = regRef.current
  reg.id = contentId
  reg.isOpen = isOpen
  reg.requestClose = () => {
    overlayRef.current?.setIsOpen(false)
  }

  React.useEffect(() => parentLevel.registerSubmenu(reg), [parentLevel, reg, contentId])

  // Intent timers die with the level; open state resets travel samples.
  React.useEffect(() => {
    if (!isOpen) {
      clearIntentTimer(intent, 'openTimer')
      clearIntentTimer(intent, 'closeTimer')
      intent.leavePoint = null
      intent.prevSample = null
    }
  }, [isOpen, intent])
  React.useEffect(() => {
    const state = intentRef.current
    return () => {
      if (state) {
        clearIntentTimer(state, 'openTimer')
        clearIntentTimer(state, 'closeTimer')
      }
    }
  }, [])

  const requestClose = React.useCallback(() => {
    overlayRef.current?.setIsOpen(false)
  }, [])
  const requestOpen = React.useCallback(() => {
    overlayRef.current?.setIsOpen(true)
  }, [])
  const getTrigger = React.useCallback(
    () => overlayRef.current?.triggerRef.current ?? null,
    []
  )
  const getContentNode = React.useCallback(
    () => overlayRef.current?.contentRef.current ?? null,
    []
  )
  const requestDeepestClose = React.useCallback(() => {
    // Deepest open descendant absorbs; else this level closes itself.
    const registry = parentLevel.registry
    for (const candidate of openRegistrationsDeepestFirst(registry)) {
      if (candidate.id === contentId || isLevelDescendantOf(registry, candidate.id, contentId)) {
        candidate.requestClose()
        return true
      }
    }
    requestClose()
    return true
  }, [parentLevel, contentId, requestClose])

  const levelValue = React.useMemo<MenuLevelValue>(
    () => ({
      id: contentId,
      depth: parentLevel.depth + 1,
      isSubmenu: true,
      isOpen,
      contentId,
      getContentNode,
      getTrigger,
      parent: parentLevel,
      intent,
      requestClose,
      requestOpen,
      requestDeepestClose,
      requestTreeDismiss: parentLevel.requestTreeDismiss,
      registerSubmenu: parentLevel.registerSubmenu,
      unwindForPress: parentLevel.unwindForPress,
      registry: parentLevel.registry,
      setContentId,
    }),
    [
      contentId,
      parentLevel,
      isOpen,
      getContentNode,
      getTrigger,
      intent,
      requestClose,
      requestOpen,
      requestDeepestClose,
      setContentId,
    ]
  )

  // Menu-owned outside press. Overlay dismisses only its top layer, but a
  // press outside the menu tree must unwind every level deepest-first while
  // a press inside an ancestor keeps it. Capture runs before Overlay's
  // bubble listener; marking consumed pre-empts the single dismiss without
  // preventDefault, so native focus and outside clicks are preserved.
  React.useLayoutEffect(() => {
    if (!isOpen) return
    const doc =
      overlayRef.current?.triggerRef.current?.ownerDocument ??
      (typeof document !== 'undefined' ? document : null)
    if (!doc) return
    const onDown = (event: PointerEvent) => {
      if (!isPrimaryPointer(event) || isEventConsumed(event)) return
      const overlayId = overlayRef.current?.id
      const layer = overlayId
        ? overlayStackStore.getState().layers.find(l => l.id === overlayId)
        : undefined
      if (!layer || !layer.open) return
      if (isInsideLayer(layer, event)) return
      parentLevel.unwindForPress(event)
      markEventConsumed(event)
    }
    doc.addEventListener('pointerdown', onDown, true)
    return () => doc.removeEventListener('pointerdown', onDown, true)
  }, [isOpen, parentLevel])

  // Grace-polygon travel tracking while open. Inside/grace samples cancel
  // the close timer; leave samples arm the frozen 300ms close.
  React.useEffect(() => {
    if (!isOpen) return
    const doc =
      overlayRef.current?.contentRef.current?.ownerDocument ??
      overlayRef.current?.triggerRef.current?.ownerDocument ??
      (typeof document !== 'undefined' ? document : null)
    if (!doc) return
    const onMove = (event: PointerEvent) => {
      if (!hoverCapablePointer(event.pointerType, event.pressure)) return
      const trigger = overlayRef.current?.triggerRef.current ?? null
      const content = overlayRef.current?.contentRef.current ?? null
      if (!trigger || !content) return
      const fallback: IntentSide =
        getDirection(trigger) === 'rtl' ? 'left' : 'right'
      const decision = evaluateSubmenuIntent({
        currentPoint: [event.clientX, event.clientY],
        triggerRect: intentAsRect(trigger.getBoundingClientRect()),
        contentRect: intentAsRect(content.getBoundingClientRect()),
        side: submenuSide(content, fallback),
        leavePoint: intent.leavePoint ?? undefined,
        prevSample: intent.prevSample ?? undefined,
      })
      intent.prevSample = { x: event.clientX, y: event.clientY, timestamp: event.timeStamp }
      if (decision === 'leave') {
        if (!intent.closeTimer) {
          intent.closeTimer = setTimeout(() => {
            intent.closeTimer = null
            if (isOpenRef.current) overlayRef.current?.setIsOpen(false)
          }, SUBMENU_CLOSE_DELAY_MS)
        }
      } else {
        clearIntentTimer(intent, 'closeTimer')
      }
    }
    doc.addEventListener('pointermove', onMove, true)
    return () => doc.removeEventListener('pointermove', onMove, true)
  }, [isOpen, intent])

  return <MenuLevelContext.Provider value={levelValue}>{children}</MenuLevelContext.Provider>
}

function NestedMenu({ open, onOpen, onDismiss, children }: MenuProps) {
  const parentLevel = useMenuLevel()
  const parentOverlay = useOverlay()
  const portalContainer = parentOverlay?.portalContainer
  if (!parentLevel) return null
  const inner = <NestedMenuInner parentLevel={parentLevel}>{children}</NestedMenuInner>
  return (
    <Overlay
      open={open ?? false}
      onOpen={onOpen}
      onDismiss={onDismiss}
      isolation={false}
    >
      {portalContainer !== undefined && portalContainer !== null ? (
        <OverlayPortal container={portalContainer}>{inner}</OverlayPortal>
      ) : (
        inner
      )}
    </Overlay>
  )
}

// --- Submenu parts ---------------------------------------------------------

export type MenuTriggerProps = PrimitiveProps<'div'> & {
  disabled?: boolean
  textValue?: string
}

export const MenuTrigger = React.forwardRef<HTMLDivElement, MenuTriggerProps>(function MenuTrigger(
  {
    children,
    disabled = false,
    textValue,
    onKeyDown,
    onClick,
    onPointerEnter,
    onPointerLeave,
    className,
    style,
    id: authoredId,
    ...props
  }: MenuTriggerProps,
  ref
) {
  const level = useMenuLevel()
  const overlay = useOverlay()
  if (!level || !level.isSubmenu) {
    devWarn('Menu.Trigger is valid only when nested inside a submenu Menu.')
  }
  const isOpen = level?.isOpen ?? false

  const generatedId = React.useId()
  const stableTriggerIdRef = React.useRef<string | null>(null)
  if (stableTriggerIdRef.current === null) {
    stableTriggerIdRef.current = `menu-trigger-${String(generatedId).replace(/[^a-zA-Z0-9_-]/g, '')}`
  }
  const triggerId = authoredId ?? stableTriggerIdRef.current

  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // The submenu Overlay anchors geometry and outside-press ownership to
      // this node, mirroring Overlay.Trigger registration without the button.
      // RovingFocus.Item drops child refs on React 17/18 (props.ref
      // stripping), so the layout resolution below is the portable path.
      if (overlay) {
        overlay.triggerRef.current = node as HTMLElement | null
        overlayStackStore.getState().setLayerTrigger(overlay.id, node)
      }
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [overlay, ref]
  )

  // Portable trigger registration: resolve the mounted node by stable id so
  // geometry, outside-press ownership, and focus restore work on React 17/18
  // where the child ref above is dropped. Follows authored id changes.
  React.useLayoutEffect(() => {
    if (!overlay || typeof document === 'undefined') return
    // Resolve in the parent level's owning root: document.getElementById
    // never sees shadow-hosted triggers (and would null a good ref on 19).
    const scope = owningScope(level?.parent?.getContentNode() ?? null) ?? document
    const node = scope.getElementById(triggerId)
    overlay.triggerRef.current = node
    overlayStackStore.getState().setLayerTrigger(overlay.id, node)
  }, [overlay, triggerId, level])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled || !level || !level.isSubmenu) return
    const isRtl = getDirection(e.currentTarget) === 'rtl'
    const openKey = isRtl ? 'ArrowLeft' : 'ArrowRight'
    if (e.key === openKey || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (isOpen) {
        // Open by pointer, now directed by key: move focus in once, never a
        // second open request.
        focusFirstEnabledItem(level.getContentNode())
        return
      }
      if (level.intent) level.intent.keyboardOpen = true
      level.requestOpen()
    }
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(e)
    if (e.defaultPrevented || disabled || !level || !level.isSubmenu || !level.intent) return
    if (!hoverCapablePointer(e.pointerType, e.pressure)) return
    const intent = level.intent
    // Hover supersedes any stale keyboard-open flag from a rejected request.
    intent.keyboardOpen = false
    clearIntentTimer(intent, 'closeTimer')
    if (isOpen || intent.openTimer) return
    intent.openTimer = setTimeout(() => {
      intent.openTimer = null
      level.requestOpen()
    }, SUBMENU_OPEN_DELAY_MS)
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e)
    if (e.defaultPrevented || disabled || !level || !level.isSubmenu || !level.intent) return
    if (!hoverCapablePointer(e.pointerType, e.pressure)) return
    const intent = level.intent
    intent.leavePoint = [e.clientX, e.clientY]
    clearIntentTimer(intent, 'openTimer')
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || disabled || !level || !level.isSubmenu) return
    // Tap/click activation opens once; the hover timer would only duplicate.
    if (level.intent) clearIntentTimer(level.intent, 'openTimer')
    if (!isOpen) level.requestOpen()
  }

  return (
    <RovingFocus.Item disabled={disabled} textValue={textValue}>
      <Div
        role="menuitem"
        id={triggerId}
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="menu"
        aria-expanded={level?.isSubmenu ? isOpen : undefined}
        aria-controls={level?.isSubmenu && isOpen ? level.contentId : undefined}
        aria-disabled={disabled ? 'true' : undefined}
        data-disabled={disabled ? '' : undefined}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        display="flex"
        alignItems="center"
        minHeight={controlSize.height}
        height="auto"
        px="3r"
        py={controlSize.paddingBlock}
        boxSizing="border-box"
        borderRadius="sm"
        fontSize="3.5r"
        lineHeight="5r"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        bg="transparent"
        color="design.text.base"
        opacity={disabled ? 0.5 : 1}
        outline="none"
        userSelect="none"
        _hover={!disabled ? { bg: 'ui.table.row.mutedBackground', color: 'design.text.base' } : undefined}
        _focus={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
        _focusVisible={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
        className={className}
        style={{
          minHeight: controlHeightPx,
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
        ref={composedRef}
      >
        {children}
      </Div>
    </RovingFocus.Item>
  )
})

export type MenuContentProps = OverlayContentProps

export const MenuContent = React.forwardRef<HTMLDivElement, MenuContentProps>(function MenuContent(
  {
    children,
    id: authoredId,
    placement,
    onKeyDown,
    className,
    style,
    ...props
  }: MenuContentProps,
  ref
) {
  const level = useMenuLevel()
  const overlay = useOverlay()
  if (!level || !level.isSubmenu) {
    devWarn('Menu.Content is valid only when nested inside a submenu Menu.')
  }
  const isOpen = level?.isOpen ?? false

  // Authored ids reconcile to the level so Trigger aria-controls follows.
  React.useLayoutEffect(() => {
    if (authoredId && level?.setContentId && authoredId !== level.contentId) {
      level.setContentId(authoredId)
    }
  }, [authoredId, level])

  const contentId = authoredId ?? level?.contentId ?? undefined

  // Overlay.Content owns the host node; resolve the consumer ref once it is
  // mounted (a frame after open — Presence mounts a commit late) and release
  // it on close. Levels read the live node at use time instead.
  React.useEffect(() => {
    if (!isOpen) {
      if (typeof ref === 'function') {
        ref(null)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = null
      }
      return
    }
    const frameId = requestAnimationFrame(() => {
      const node = overlay?.contentRef.current ?? null
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    })
    return () => cancelAnimationFrame(frameId)
  }, [isOpen, overlay, ref])

  const resolvedPlacement =
    placement ?? (getDirection(level?.getTrigger() ?? null) === 'rtl' ? 'left-start' : 'right-start')

  // Keyboard-open entry focus once per open; close restores the trigger
  // unless focus already left (outside press) or the trigger is gone
  // (fallback to a live parent target). Effects run deepest-first, so a
  // full-tree unwind lands on the root trigger last.
  const wasOpenRef = React.useRef(isOpen)
  React.useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen
    if (!level || !level.isSubmenu) return
    if (!wasOpen && isOpen) {
      const keyboardOpen = level.intent?.keyboardOpen ?? false
      if (level.intent) level.intent.keyboardOpen = false
      if (!keyboardOpen) return
      const frameId = requestAnimationFrame(() => {
        focusFirstEnabledItem(level.getContentNode())
      })
      return () => cancelAnimationFrame(frameId)
    }
    if (wasOpen && !isOpen) {
      if (level.intent) level.intent.keyboardOpen = false
      const content = level.getContentNode()
      if (!content?.contains(activeElementIn(content))) return
      const trigger = level.getTrigger()
      if (trigger && trigger.isConnected && !trigger.hasAttribute('disabled') && trigger.getAttribute('aria-disabled') !== 'true') {
        trigger.focus()
        return
      }
      const parentContent = level.parent?.getContentNode() ?? null
      const fallback = parentContent?.querySelector<HTMLElement>(ENABLED_MENUITEM_SELECTOR) ?? null
      if (fallback) {
        fallback.focus()
        return
      }
      restoreFocusToTrigger(rootTriggerOf(level))
    }
    return undefined
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !level || !level.isSubmenu) return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      level.requestDeepestClose()
      return
    }
    const isRtl = getDirection(e.currentTarget) === 'rtl'
    const closeKey = isRtl ? 'ArrowRight' : 'ArrowLeft'
    if (e.key === closeKey) {
      e.preventDefault()
      level.requestClose()
      return
    }
    // B-33, submenu level: container-focused edge navigation.
    handleContentContainerKey(e, level.getContentNode())
  }

  return (
    <Overlay.Content
      placement={resolvedPlacement}
      {...props}
      role="menu"
      id={contentId}
      data-reference-menu-content=""
      tabIndex={-1}
      minW="40r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      p="1r"
      boxShadow="0 4px 16px rgba(0,0,0,0.12)"
      border="1px solid"
      borderColor="ui.dialog.border"
      outline="none"
      className={className}
      style={style}
      onKeyDown={handleKeyDown}
    >
      <RovingFocus.Root orientation="vertical" loop typeahead>
        <Div display="flex" flexDirection="column" gap="0.5r" outline="none">
          {children}
        </Div>
      </RovingFocus.Root>
    </Overlay.Content>
  )
})

// --- Command items ---------------------------------------------------------

export type MenuItemProps = Omit<PrimitiveProps<'div'>, 'onSelect'> & {
  disabled?: boolean
  selected?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnClick?: boolean
  /** @deprecated Use closeOnClick instead */
  closeOnSelect?: boolean
}

export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  {
    children,
    disabled = false,
    selected = false,
    textValue,
    onSelect,
    closeOnClick = true,
    closeOnSelect,
    onClick,
    onKeyDown,
    className,
    style,
    ...props
  }: MenuItemProps,
  ref
) {
  const overlay = useOverlay()
  const level = useMenuLevel()
  const shouldClose = closeOnSelect !== undefined ? closeOnSelect : closeOnClick

  const dismissAfterSelect = React.useCallback(() => {
    if (level) {
      level.requestTreeDismiss()
      restoreFocusToTrigger(rootTriggerOf(level))
      return
    }
    if (overlay) {
      overlay.setIsOpen(false)
      restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
    }
  }, [level, overlay])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
    if (e.defaultPrevented) return
    onSelect?.(e.nativeEvent)
    if (e.nativeEvent.defaultPrevented) return
    if (shouldClose) dismissAfterSelect()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation()
      onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
      if (e.defaultPrevented) return
      onSelect?.(e.nativeEvent)
      if (e.nativeEvent.defaultPrevented) {
        e.preventDefault()
        return
      }
      e.preventDefault()
      if (shouldClose) dismissAfterSelect()
    }
  }

  return (
    <RovingFocus.Item disabled={disabled} textValue={textValue}>
      <Div
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? 'true' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-state={selected ? 'selected' : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        display="flex"
        alignItems="center"
        minHeight={controlSize.height}
        height="auto"
        px="3r"
        py={controlSize.paddingBlock}
        boxSizing="border-box"
        borderRadius="sm"
        fontSize="3.5r"
        lineHeight="5r"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        bg={selected ? 'ui.table.row.mutedBackground' : 'transparent'}
        color="design.text.base"
        opacity={disabled ? 0.5 : 1}
        outline="none"
        userSelect="none"
        _hover={!disabled ? { bg: 'ui.table.row.mutedBackground', color: 'design.text.base' } : undefined}
        _focus={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
        _focusVisible={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
        className={className}
        style={{
          minHeight: controlHeightPx,
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
        ref={ref}
      >
        {children}
      </Div>
    </RovingFocus.Item>
  )
})

// --- Choice items (W-28) ------------------------------------------------------
// Controlled choice commands. Activation order (MN-CHOICE-06): native
// handler → cancelable onSelect → one checked/value request → optional
// deepest-first dismissal. closeOnSelect defaults false; cancellation in a
// native handler or onSelect stops both the state request and dismissal
// (MN-CHOICE-07). Controlled props stay authoritative: ARIA derives from
// props, never from a hidden toggle (MN-CHOICE-03/05).

function useChoiceDismiss() {
  const overlay = useOverlay()
  const level = useMenuLevel()
  return React.useCallback(() => {
    if (level) {
      level.requestTreeDismiss()
      restoreFocusToTrigger(rootTriggerOf(level))
      return
    }
    if (overlay) {
      overlay.setIsOpen(false)
      restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
    }
  }, [level, overlay])
}

function ChoiceIndicator({ glyph }: { glyph: string }) {
  // Fixed slot keeps labels aligned with unchecked siblings. aria-hidden
  // keeps the glyph out of accessible names and typeahead text.
  return (
    <Div
      aria-hidden="true"
      data-menu-indicator=""
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      w="4r"
      mr="2r"
    >
      {glyph}
    </Div>
  )
}

function choiceItemLayout(disabled: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    minHeight: controlSize.height,
    height: 'auto',
    px: '3r',
    py: controlSize.paddingBlock,
    boxSizing: 'border-box',
    borderRadius: 'sm',
    fontSize: '3.5r',
    lineHeight: '5r',
    cursor: disabled ? 'not-allowed' : 'pointer',
    bg: 'transparent',
    color: 'design.text.base',
    opacity: disabled ? 0.5 : 1,
    outline: 'none',
    userSelect: 'none',
  } as const
}

export type MenuCheckboxItemProps = Omit<PrimitiveProps<'div'>, 'onSelect' | 'onChange'> & {
  checked: boolean | 'mixed'
  onChange?: (checked: boolean) => void
  /** Alias of onChange (W-28 naming). Both fire when both are provided. */
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnSelect?: boolean
}

export const MenuCheckboxItem = React.forwardRef<HTMLDivElement, MenuCheckboxItemProps>(
  function MenuCheckboxItem(
    {
      children,
      checked,
      onChange,
      onCheckedChange,
      disabled = false,
      textValue,
      onSelect,
      closeOnSelect = false,
      onClick,
      onKeyDown,
      className,
      style,
      ...props
    }: MenuCheckboxItemProps,
    ref
  ) {
    const dismissAfterSelect = useChoiceDismiss()

    const requestState = React.useCallback(() => {
      // checked=true → false; false and mixed → true.
      const next = checked !== true
      onChange?.(next)
      onCheckedChange?.(next)
    }, [checked, onChange, onCheckedChange])

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        e.preventDefault()
        return
      }
      onClick?.(e)
      if (e.defaultPrevented) return
      onSelect?.(e.nativeEvent)
      if (e.nativeEvent.defaultPrevented) return
      requestState()
      if (closeOnSelect) dismissAfterSelect()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || disabled) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation()
        onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        if (e.defaultPrevented) return
        onSelect?.(e.nativeEvent)
        if (e.nativeEvent.defaultPrevented) {
          e.preventDefault()
          return
        }
        e.preventDefault()
        requestState()
        if (closeOnSelect) dismissAfterSelect()
      }
    }

    const ariaChecked = checked === 'mixed' ? 'mixed' : checked ? 'true' : 'false'
    const dataState = checked === 'mixed' ? 'mixed' : checked ? 'checked' : 'unchecked'
    const glyph = checked === 'mixed' ? '–' : checked ? '✓' : ''

    return (
      <RovingFocus.Item disabled={disabled} textValue={textValue}>
        <Div
          role="menuitemcheckbox"
          tabIndex={disabled ? -1 : 0}
          aria-checked={ariaChecked}
          aria-disabled={disabled ? 'true' : undefined}
          data-disabled={disabled ? '' : undefined}
          data-state={dataState}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...choiceItemLayout(disabled)}
          _hover={!disabled ? { bg: 'ui.table.row.mutedBackground', color: 'design.text.base' } : undefined}
          _focus={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
          _focusVisible={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
          className={className}
          style={{
            minHeight: controlHeightPx,
            boxSizing: 'border-box',
            ...style,
          }}
          {...props}
          ref={ref}
        >
          <ChoiceIndicator glyph={glyph} />
          {children}
        </Div>
      </RovingFocus.Item>
    )
  }
)

interface MenuRadioGroupValue {
  value: string | null | undefined
  onChange: ((value: string) => void) | undefined
  onValueChange: ((value: string) => void) | undefined
}

const MenuRadioGroupContext = React.createContext<MenuRadioGroupValue | null>(null)

export type MenuRadioGroupProps = Omit<PrimitiveProps<'div'>, 'onChange'> & {
  value?: string | null
  onChange?: (value: string) => void
  /** Alias of onChange (W-28 naming). Both fire when both are provided. */
  onValueChange?: (value: string) => void
}

export const MenuRadioGroup = React.forwardRef<HTMLDivElement, MenuRadioGroupProps>(
  function MenuRadioGroup(
    { children, value, onChange, onValueChange, className, style, ...props }: MenuRadioGroupProps,
    ref
  ) {
    // Structural only: never a roving stop, never a typeahead match.
    const groupValue = React.useMemo<MenuRadioGroupValue>(
      () => ({ value, onChange, onValueChange }),
      [value, onChange, onValueChange]
    )
    return (
      <MenuRadioGroupContext.Provider value={groupValue}>
        <Div role="group" className={className} style={style} {...props} ref={ref}>
          {children}
        </Div>
      </MenuRadioGroupContext.Provider>
    )
  }
)

export type MenuRadioItemProps = Omit<PrimitiveProps<'div'>, 'onSelect'> & {
  value: string
  disabled?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnSelect?: boolean
}

export const MenuRadioItem = React.forwardRef<HTMLDivElement, MenuRadioItemProps>(
  function MenuRadioItem(
    {
      children,
      value,
      disabled = false,
      textValue,
      onSelect,
      closeOnSelect = false,
      onClick,
      onKeyDown,
      className,
      style,
      ...props
    }: MenuRadioItemProps,
    ref
  ) {
    const group = React.useContext(MenuRadioGroupContext)
    const dismissAfterSelect = useChoiceDismiss()
    if (!group) {
      devWarn('Menu.RadioItem is valid only inside a Menu.RadioGroup.')
    }
    const checked = group != null && group.value === value

    const requestState = React.useCallback(() => {
      // Every activation requests, including the already-selected value;
      // the group never interprets parent acceptance (MN-CHOICE-04).
      group?.onChange?.(value)
      group?.onValueChange?.(value)
    }, [group, value])

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        e.preventDefault()
        return
      }
      onClick?.(e)
      if (e.defaultPrevented) return
      onSelect?.(e.nativeEvent)
      if (e.nativeEvent.defaultPrevented) return
      requestState()
      if (closeOnSelect) dismissAfterSelect()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || disabled) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation()
        onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        if (e.defaultPrevented) return
        onSelect?.(e.nativeEvent)
        if (e.nativeEvent.defaultPrevented) {
          e.preventDefault()
          return
        }
        e.preventDefault()
        requestState()
        if (closeOnSelect) dismissAfterSelect()
      }
    }

    return (
      <RovingFocus.Item disabled={disabled} textValue={textValue}>
        <Div
          role="menuitemradio"
          tabIndex={disabled ? -1 : 0}
          aria-checked={checked ? 'true' : 'false'}
          aria-disabled={disabled ? 'true' : undefined}
          data-disabled={disabled ? '' : undefined}
          data-state={checked ? 'checked' : 'unchecked'}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...choiceItemLayout(disabled)}
          _hover={!disabled ? { bg: 'ui.table.row.mutedBackground', color: 'design.text.base' } : undefined}
          _focus={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
          _focusVisible={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
          className={className}
          style={{
            minHeight: controlHeightPx,
            boxSizing: 'border-box',
            ...style,
          }}
          {...props}
          ref={ref}
        >
          <ChoiceIndicator glyph={checked ? '●' : ''} />
          {children}
        </Div>
      </RovingFocus.Item>
    )
  }
)

export type MenuLinkItemProps = Omit<PrimitiveProps<'a'>, 'onSelect'> & {
  href: string
  disabled?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnSelect?: boolean
}

export const MenuLinkItem = React.forwardRef<HTMLAnchorElement, MenuLinkItemProps>(
  function MenuLinkItem(
    {
      children,
      href,
      disabled = false,
      textValue,
      onSelect,
      closeOnSelect = true,
      onClick,
      onKeyDown,
      className,
      style,
      ...props
    }: MenuLinkItemProps,
    ref
  ) {
    const overlay = useOverlay()
    const level = useMenuLevel()

    const dismissAfterSelect = React.useCallback(() => {
      // Deferred restore: the anchor-focus default lands after React's flush,
      // so both synchronous and effect restores would be clobbered. A frame
      // later the dismissal has committed and the default has run; a real
      // navigation unloads before the frame and needs no restore.
      if (level) {
        level.requestTreeDismiss()
        const rootTrigger = rootTriggerOf(level)
        requestAnimationFrame(() => {
          restoreFocusToTrigger(rootTrigger)
        })
        return
      }
      if (overlay) {
        overlay.setIsOpen(false)
        restoreFocusToTrigger(overlay.triggerRef.current as HTMLElement | null)
      }
    }, [level, overlay])

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      if (disabled) {
        // Non-navigable: block every activation route after observability.
        e.preventDefault()
        return
      }
      if (e.defaultPrevented) return
      // Modified, middle-button, and right-button gestures stay fully native:
      // no selection, no dismissal.
      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      onSelect?.(e.nativeEvent)
      // Cancellation prevents both Menu defaults and navigation; the native
      // event is the click itself, so its prevention already blocks nav.
      if (e.nativeEvent.defaultPrevented) return
      if (closeOnSelect) dismissAfterSelect()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || disabled) return
      // Enter activates natively through click; Space is Menu-owned (anchors
      // scroll natively) and funnels through one synthetic click so handlers,
      // navigation, and dismissal observe a single primary activation.
      if (e.key === ' ') {
        e.preventDefault()
        e.currentTarget.click()
      }
    }

    return (
      <RovingFocus.Item disabled={disabled} textValue={textValue}>
        <A
          role="menuitem"
          href={href}
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled ? 'true' : undefined}
          data-disabled={disabled ? '' : undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          display="flex"
          alignItems="center"
          minHeight={controlSize.height}
          height="auto"
          px="3r"
          py={controlSize.paddingBlock}
          boxSizing="border-box"
          borderRadius="sm"
          fontSize="3.5r"
          lineHeight="5r"
          cursor={disabled ? 'not-allowed' : 'pointer'}
          bg="transparent"
          color="design.text.base"
          opacity={disabled ? 0.5 : 1}
          outline="none"
          userSelect="none"
          textDecoration="none"
          _hover={!disabled ? { bg: 'ui.table.row.mutedBackground', color: 'design.text.base' } : undefined}
          _focus={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
          _focusVisible={{ bg: 'ui.table.row.mutedBackground', color: 'design.text.base', outline: 'none' }}
          className={className}
          style={{
            minHeight: controlHeightPx,
            boxSizing: 'border-box',
            ...style,
          }}
          {...props}
          ref={ref}
        >
          {children}
        </A>
      </RovingFocus.Item>
    )
  }
)

export type MenuSeparatorProps = PrimitiveProps<'div'>

export const MenuSeparator = React.forwardRef<HTMLDivElement, MenuSeparatorProps>(
  function MenuSeparator({ className, style, ...props }: MenuSeparatorProps, ref) {
    return (
      <Div
        role="separator"
        height="1px"
        bg="ui.hr.border"
        my="1r"
        className={className}
        style={style}
        {...props}
        ref={ref}
      />
    )
  }
)

// --- Dispatcher ------------------------------------------------------------

export const Menu = React.forwardRef<HTMLDivElement, MenuProps>(function Menu(props: MenuProps, ref) {
  const parentLevel = useMenuLevel()
  if (parentLevel) {
    const { open, onOpen, onDismiss, children } = props
    return (
      <NestedMenu open={open} onOpen={onOpen} onDismiss={onDismiss}>
        {children}
      </NestedMenu>
    )
  }
  return <RootMenu {...props} ref={ref} />
}) as React.ForwardRefExoticComponent<MenuProps & React.RefAttributes<HTMLDivElement>> & {
  Item: typeof MenuItem
  Separator: typeof MenuSeparator
  Trigger: typeof MenuTrigger
  Content: typeof MenuContent
  LinkItem: typeof MenuLinkItem
  CheckboxItem: typeof MenuCheckboxItem
  RadioGroup: typeof MenuRadioGroup
  RadioItem: typeof MenuRadioItem
}

Menu.Item = MenuItem
Menu.Separator = MenuSeparator
Menu.Trigger = MenuTrigger
Menu.Content = MenuContent
Menu.LinkItem = MenuLinkItem
Menu.CheckboxItem = MenuCheckboxItem
Menu.RadioGroup = MenuRadioGroup
Menu.RadioItem = MenuRadioItem

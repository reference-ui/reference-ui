import * as React from 'react'
import { css, type PrimitiveProps } from '@reference-ui/react'
import { findGridTarget, type GridCell } from './grid'
import { TypeaheadModel, shouldIgnoreTypeaheadKey, type TypeaheadItem } from './typeahead'

export { TypeaheadModel, shouldIgnoreTypeaheadKey } from './typeahead'
export type { TypeaheadItem, TypeaheadGuardEvent } from './typeahead'
export { findGridTarget, groupGridRows } from './grid'
export type { GridArrow, GridCell, GridCellRect } from './grid'

export type RovingFocusOrientation = 'horizontal' | 'vertical' | 'both'

// Transparent-part surface (components.md `ReferenceSlotPartProps`): common
// DOM events/ARIA plus the shared StyleProps surface, exactly one element
// child, one ref. Local alias per the Listbox `ReferencePartProps` precedent;
// no shared module owns this name yet.
type ReferenceSlotPartProps = Omit<PrimitiveProps<'div'>, 'children'> & {
  children: React.ReactElement
  ref?: React.Ref<HTMLElement>
}

export type RovingFocusRootProps = ReferenceSlotPartProps & {
  orientation?: RovingFocusOrientation
  loop?: boolean
  typeahead?: boolean
}

export type RovingFocusItemProps = ReferenceSlotPartProps & {
  id?: string
  disabled?: boolean
  textValue?: string
}

interface ItemEntry {
  id: string
  ref: React.RefObject<HTMLElement | null>
  disabled: boolean
  textValue?: string
}

interface RovingFocusContextValue {
  orientation: RovingFocusOrientation
  loop: boolean
  typeahead: boolean
  currentId: string | null
  setCurrentId: (id: string) => void
  registerItem: (entry: ItemEntry) => () => void
  focusItemById: (id: string) => void
  onItemKeyDown: (e: React.KeyboardEvent<HTMLElement>, id: string) => void
  claimInitialActiveId: (id: string) => boolean
}

function isItemAvailable(entry: ItemEntry): boolean {
  if (entry.disabled) return false
  const el = entry.ref.current
  if (!el) return true
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
    return false
  }
  if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') {
    return false
  }
  if (typeof window !== 'undefined') {
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false
    }
  }
  return true
}

function extractVisibleText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || ''
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement
    if (el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('hidden')) {
      return ''
    }
    let text = ''
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i]
      if (child) text += extractVisibleText(child)
    }
    return text
  }
  return ''
}

// Next-then-previous repair (RF-TAB-06): resolve the successor of a stale
// current id against a DOM order that may still contain it. Removal deletes
// the entry before repair runs, so resolving against the live map alone would
// fall back to the first item instead of the removed item's successor.
function resolveRepairTarget(
  ordered: ItemEntry[],
  orderIds: string[],
  currentId: string
): string | null {
  const available = ordered.filter(isItemAvailable)
  if (available.length === 0) return null
  const orderIndex = orderIds.indexOf(currentId)
  if (orderIndex === -1) {
    const first = available[0]
    return first ? first.id : null
  }
  const availableIds = new Set(available.map(i => i.id))
  for (let i = orderIndex + 1; i < orderIds.length; i++) {
    const id = orderIds[i]
    if (id !== undefined && availableIds.has(id)) return id
  }
  for (let i = orderIndex - 1; i >= 0; i--) {
    const id = orderIds[i]
    if (id !== undefined && availableIds.has(id)) return id
  }
  const first = available[0]
  return first ? first.id : null
}

function getItemSearchText(entry: ItemEntry): string {
  if (entry.textValue != null && entry.textValue !== '') {
    return entry.textValue.trim()
  }
  const el = entry.ref.current
  if (!el) return ''
  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel != null && ariaLabel !== '') {
    return ariaLabel.trim()
  }
  const text = extractVisibleText(el)
  return text.replace(/\s+/g, ' ').trim()
}

// Convergence seam (FEATURES #7): forked engines (Listbox navigation, Tabs
// arrows) read inherited direction through this instead of a local copy.
export function getDirection(el: HTMLElement | null): 'ltr' | 'rtl' {
  if (!el || typeof window === 'undefined') return 'ltr'
  return window.getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr'
}

// Single-element anatomy gate (RF-DOM-06, FEATURES #3): Root and Item slot
// behavior onto exactly one element, so anything else throws at render with
// no partial registration. Called after hooks; a throw unmounts the tree.
function assertSingleElementChild(
  children: React.ReactNode,
  part: 'Root' | 'Item'
): asserts children is React.ReactElement {
  // Nullish and booleans normalize to a zero count before measuring:
  // Children.count(false) is 1 (booleans traverse as render-nothing nodes),
  // but false/null/undefined all mean "no element was authored".
  const count =
    children === null || children === undefined || typeof children === 'boolean'
      ? 0
      : React.Children.count(children)
  if (count === 0) {
    throw new Error(
      `Reference UI: RovingFocus.${part} expects exactly one element child, but received none (children omitted, null, or false). Render a single element so the kernel has a node to augment.`
    )
  }
  if (count > 1) {
    throw new Error(
      `Reference UI: RovingFocus.${part} expects exactly one element child, but received ${count} children. Wrap them in a single element.`
    )
  }
  // toArray (not Children.only, which throws its own invariant for non-element
  // singles) — validation-only, never rendered.
  const [child] = React.Children.toArray(children)
  if (typeof child !== 'object' || child === null || !React.isValidElement(child)) {
    const received =
      typeof child === 'string' ? 'text' : typeof child === 'number' ? 'a number' : typeof child
    throw new Error(
      `Reference UI: RovingFocus.${part} expects exactly one element child, but received ${received}. Render a single element so the kernel has a node to augment.`
    )
  }
  if (child.type === React.Fragment) {
    throw new Error(
      `Reference UI: RovingFocus.${part} expects exactly one element child, but received a Fragment. Fragments render no node for tabIndex/ref augmentation — render a single element instead.`
    )
  }
}

const RovingFocusContext = React.createContext<RovingFocusContextValue | null>(null)

let rovingFocusIdCounter = 0

// Transparent-part merge (components.md merge rules, FEATURES #2): the part
// spreads first and the authored child wins, except className (combined),
// style (shallow-merged, child wins), event handlers (child first, then part,
// each gated on defaultPrevented), refs (chained), and aria-describedby
// (tokens concatenated). Kernel overrides (Item tabIndex) apply last so the
// kernel stays authoritative (RF-TAB-08).
type AnyProps = Record<string, unknown>
type AnyHandler = (event: any, ...rest: unknown[]) => void

function isHandlerKey(key: string, value: unknown): value is AnyHandler {
  return typeof value === 'function' && key.length > 2 && key.startsWith('on') && key[2] === key[2]?.toUpperCase()
}

function eventWasPrevented(value: unknown): boolean {
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
function chainSlotHandlers(
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

function setSlotRef(ref: unknown, node: HTMLElement | null): void {
  if (typeof ref === 'function') {
    ;(ref as (node: HTMLElement | null) => void)(node)
  } else if (ref && typeof ref === 'object' && 'current' in ref) {
    ;(ref as React.MutableRefObject<HTMLElement | null>).current = node
  }
}

function chainSlotRefs(...refs: unknown[]): (node: HTMLElement | null) => void {
  return function chainedSlotRef(node: HTMLElement | null) {
    for (const ref of refs) setSlotRef(ref, node)
  }
}

// Pre-19 React strips ref from props into element.ref; 19 exposes both. Read
// element.ref first so child refs survive on every runtime (Menu's 17/18
// workaround documents the old drop).
function getChildRef(child: React.ReactElement): unknown {
  return (child as { ref?: unknown }).ref ?? (child.props as AnyProps | undefined)?.ref
}

function concatDescribedBy(childValue: unknown, partValue: unknown): string | undefined {
  const tokens = `${childValue ?? ''} ${partValue ?? ''}`.trim().split(/\s+/).filter(Boolean)
  return tokens.length > 0 ? tokens.join(' ') : undefined
}

function mergeSlotProps(options: {
  partProps: AnyProps
  child: React.ReactElement
  exclude: ReadonlySet<string>
  kernelHandlers?: Record<string, AnyHandler | undefined>
  overrides?: AnyProps
}): AnyProps {
  const { partProps, child, exclude, kernelHandlers = {}, overrides = {} } = options
  const childProps = (child.props ?? {}) as AnyProps
  const merged: AnyProps = {}

  for (const key of Object.keys(partProps)) {
    if (exclude.has(key)) continue
    const value = partProps[key]
    if (isHandlerKey(key, value) || key in kernelHandlers || key === 'aria-describedby') continue
    merged[key] = value
  }
  for (const key of Object.keys(childProps)) {
    if (key === 'children' || key === 'ref') continue
    merged[key] = childProps[key]
  }

  const handlerKeys = new Set<string>(Object.keys(kernelHandlers))
  for (const key of [...Object.keys(partProps), ...Object.keys(childProps)]) {
    if (isHandlerKey(key, partProps[key]) || isHandlerKey(key, childProps[key])) {
      handlerKeys.add(key)
    }
  }
  for (const key of handlerKeys) {
    if (exclude.has(key)) continue
    const chained = chainSlotHandlers(childProps[key], partProps[key], kernelHandlers[key])
    if (chained) merged[key] = chained
    else delete merged[key]
  }

  if ('aria-describedby' in partProps || 'aria-describedby' in childProps) {
    const describedBy = concatDescribedBy(childProps['aria-describedby'], partProps['aria-describedby'])
    if (describedBy) merged['aria-describedby'] = describedBy
    else delete merged['aria-describedby']
  }

  const cssProp = partProps['css']
  const compiled = cssProp != null && typeof cssProp === 'object' ? css(cssProp as never) : ''
  const className = [compiled, partProps['className'], childProps['className']]
    .filter(c => typeof c === 'string' && c !== '')
    .join(' ')
  if (className !== '') merged['className'] = className
  else delete merged['className']

  const partStyle = partProps['style']
  const childStyle = childProps['style']
  if (
    partStyle != null &&
    typeof partStyle === 'object' &&
    childStyle != null &&
    typeof childStyle === 'object'
  ) {
    merged['style'] = { ...(partStyle as object), ...(childStyle as object) }
  }

  for (const key of Object.keys(overrides)) {
    merged[key] = overrides[key]
  }
  return merged
}

// Props consumed by the part itself; never spread onto the child.
const ROOT_EXCLUDED_PROPS: ReadonlySet<string> = new Set([
  'children',
  'ref',
  'css',
  'className',
  'style',
  'orientation',
  'loop',
  'typeahead',
])

const ITEM_EXCLUDED_PROPS: ReadonlySet<string> = new Set([
  'children',
  'ref',
  'css',
  'className',
  'style',
  'tabIndex',
  'id',
  'disabled',
  'textValue',
])

export const RovingFocusRoot = React.forwardRef<HTMLElement, RovingFocusRootProps>(
  function RovingFocusRoot(props, forwardedRef) {
    const { children, orientation = 'horizontal', loop = false, typeahead = false } = props
    // Currentness is internal-only (FEATURES #5): the controlled current-id API
    // was stripped per the SPEC freeze — no consumer named a use.
    const [currentId, setCurrentId] = React.useState<string | null>(null)
    const itemsMapRef = React.useRef<Map<string, ItemEntry>>(new Map())
    const typeaheadModelRef = React.useRef<TypeaheadModel>(new TypeaheadModel())
    const initialActiveIdRef = React.useRef<string | null>(null)
    const lastOrderRef = React.useRef<string[]>([])
    // Registration bump: forces the rerender that lets post-commit
    // settlement observe mounts/unmounts. The value itself is unread.
    const [, setRegistrationVersion] = React.useState(0)

    const getOrderedItems = React.useCallback((): ItemEntry[] => {
      const entries = Array.from(itemsMapRef.current.values())
      // Sort items by DOM position
      return entries
        .filter(entry => entry.ref.current && entry.ref.current.isConnected)
        .sort((a, b) => {
          const elA = a.ref.current!
          const elB = b.ref.current!
          const pos = elA.compareDocumentPosition(elB)
          if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
          if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
          return 0
        })
    }, [])

    // First enabled item to render claims the SSR tab stop so server HTML carries
    // the same sole tabIndex=0 the client settles on after mount (RF-ENV-01).
    const claimInitialActiveId = React.useCallback((id: string) => {
      if (initialActiveIdRef.current === null) {
        initialActiveIdRef.current = id
        return true
      }
      return initialActiveIdRef.current === id
    }, [])

    React.useEffect(() => {
      const model = typeaheadModelRef.current
      return () => {
        model.reset()
      }
    }, [])

    const notifyItemsChanged = React.useCallback(() => {
      setRegistrationVersion(v => v + 1)
    }, [])

    // Post-commit settlement (RF-TAB-06/07): runs after EVERY commit with no
    // dep array on purpose. DOM-derived availability (hidden, native
    // disabled, display:none) can flip on any parent rerender without
    // touching registration, and removal deletes the entry before effects
    // run — so settle here, against post-commit DOM and the last committed
    // order. Steady state costs one DOM-order pass plus one availability
    // check; the full scan only runs when the current item actually went
    // stale, and the repaired id is always available (or null), so the next
    // pass is a no-op.
    React.useEffect(() => {
      const ordered = getOrderedItems()
      const prevOrder = lastOrderRef.current
      lastOrderRef.current = ordered.map(i => i.id)

      if (currentId === null) {
        const claimed = initialActiveIdRef.current
        if (claimed && ordered.some(i => i.id === claimed && isItemAvailable(i))) {
          setCurrentId(claimed)
          return
        }
        const firstAvailable = ordered.find(isItemAvailable)
        if (firstAvailable) {
          setCurrentId(firstAvailable.id)
        }
        return
      }

      const currentEntry = ordered.find(i => i.id === currentId)
      if (currentEntry && isItemAvailable(currentEntry)) return
      const orderIds = prevOrder.includes(currentId) ? prevOrder : ordered.map(i => i.id)
      setCurrentId(resolveRepairTarget(ordered, orderIds, currentId))
    })

    const registerItem = React.useCallback(
      (entry: ItemEntry) => {
        itemsMapRef.current.set(entry.id, entry)
        notifyItemsChanged()
        return () => {
          itemsMapRef.current.delete(entry.id)
          notifyItemsChanged()
        }
      },
      [notifyItemsChanged]
    )

    const focusItemById = React.useCallback(
      (id: string) => {
        const entry = itemsMapRef.current.get(id)
        if (entry?.ref.current && isItemAvailable(entry)) {
          setCurrentId(id)
          entry.ref.current.focus()
        }
      },
      [setCurrentId]
    )

    const handle1DNavigation = React.useCallback(
      (e: React.KeyboardEvent<HTMLElement>, currentIndex: number, enabledItems: ItemEntry[]) => {
        const currentEntry = enabledItems[currentIndex]
        const isRtl = getDirection(currentEntry?.ref.current ?? null) === 'rtl'
        const key = e.key

        let targetIndex = currentIndex

        if (orientation === 'horizontal') {
          if ((!isRtl && key === 'ArrowRight') || (isRtl && key === 'ArrowLeft')) {
            e.preventDefault()
            targetIndex = currentIndex + 1
            if (targetIndex >= enabledItems.length) {
              targetIndex = loop ? 0 : enabledItems.length - 1
            }
          } else if ((!isRtl && key === 'ArrowLeft') || (isRtl && key === 'ArrowRight')) {
            e.preventDefault()
            targetIndex = currentIndex - 1
            if (targetIndex < 0) {
              targetIndex = loop ? enabledItems.length - 1 : 0
            }
          }
        }

        if (orientation === 'vertical') {
          if (key === 'ArrowDown') {
            e.preventDefault()
            targetIndex = currentIndex + 1
            if (targetIndex >= enabledItems.length) {
              targetIndex = loop ? 0 : enabledItems.length - 1
            }
          } else if (key === 'ArrowUp') {
            e.preventDefault()
            targetIndex = currentIndex - 1
            if (targetIndex < 0) {
              targetIndex = loop ? enabledItems.length - 1 : 0
            }
          }
        }

        if (key === 'Home' || key === 'PageUp') {
          e.preventDefault()
          targetIndex = 0
        } else if (key === 'End' || key === 'PageDown') {
          e.preventDefault()
          targetIndex = enabledItems.length - 1
        }

        if (targetIndex !== currentIndex && enabledItems[targetIndex]) {
          focusItemById(enabledItems[targetIndex].id)
        }
      },
      [orientation, loop, focusItemById]
    )

    // Visual-grid arrows (FEATURES #1): rects re-read per keystroke so CSS
    // reflow is observable (RF-GRID-07); geometry is direction-free so RTL
    // reversal falls out of the layout (RF-GRID-06).
    const handleGridNavigation = React.useCallback(
      (e: React.KeyboardEvent<HTMLElement>, id: string, orderedItems: ItemEntry[]) => {
        const arrow =
          e.key === 'ArrowLeft'
            ? 'left'
            : e.key === 'ArrowRight'
              ? 'right'
              : e.key === 'ArrowUp'
                ? 'up'
                : e.key === 'ArrowDown'
                  ? 'down'
                  : null
        if (arrow === null) return
        e.preventDefault()
        const cells: GridCell[] = []
        orderedItems.forEach((entry, domIndex) => {
          const el = entry.ref.current
          if (!el) return
          cells.push({
            id: entry.id,
            rect: el.getBoundingClientRect(),
            domIndex,
            available: isItemAvailable(entry),
          })
        })
        const targetId = findGridTarget(cells, id, arrow, { loop })
        if (targetId) {
          focusItemById(targetId)
        }
      },
      [loop, focusItemById]
    )

    const handleTypeahead = React.useCallback(
      (e: React.KeyboardEvent<HTMLElement>, activeId: string, orderedItems: ItemEntry[]) => {
        if (shouldIgnoreTypeaheadKey(e)) return
        // Space only continues an active search; it never starts one, so buttons
        // keep native Space activation when no buffer is active.
        if (e.key === ' ' && !typeaheadModelRef.current.hasBuffer()) return

        e.preventDefault()

        const typeaheadItems: TypeaheadItem[] = orderedItems.map(item => ({
          id: item.id,
          text: getItemSearchText(item),
          disabled: item.disabled,
          hidden: !isItemAvailable(item),
        }))

        const matchId = typeaheadModelRef.current.handleKey(e.key, activeId, typeaheadItems)
        if (matchId && matchId !== activeId) {
          focusItemById(matchId)
        }
      },
      [focusItemById]
    )

    const onItemKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLElement>, id: string) => {
        if (e.defaultPrevented) return
        if (e.ctrlKey || e.altKey || e.metaKey) return

        const orderedItems = getOrderedItems()
        const enabledItems = orderedItems.filter(isItemAvailable)
        const currentIndex = enabledItems.findIndex(i => i.id === id)
        if (currentIndex === -1) return

        if (
          [
            'ArrowRight',
            'ArrowLeft',
            'ArrowDown',
            'ArrowUp',
            'Home',
            'End',
            'PageUp',
            'PageDown',
          ].includes(e.key)
        ) {
          // Home/End/PageUp/PageDown are whole-composite endpoints in every
          // orientation including grids (RF-GRID-08); arrows go 2D only for
          // orientation="both" (RF-GRID-01).
          if (
            orientation === 'both' &&
            (e.key === 'ArrowRight' ||
              e.key === 'ArrowLeft' ||
              e.key === 'ArrowDown' ||
              e.key === 'ArrowUp')
          ) {
            handleGridNavigation(e, id, orderedItems)
          } else {
            handle1DNavigation(e, currentIndex, enabledItems)
          }
        } else if (typeahead) {
          handleTypeahead(e, id, orderedItems)
        }
      },
      [getOrderedItems, handle1DNavigation, handleGridNavigation, handleTypeahead, typeahead, orientation]
    )

    const contextValue = React.useMemo<RovingFocusContextValue>(() => {
      return {
        orientation,
        loop,
        typeahead,
        currentId,
        setCurrentId,
        registerItem,
        focusItemById,
        onItemKeyDown,
        claimInitialActiveId,
      }
    }, [
      orientation,
      loop,
      typeahead,
      currentId,
      setCurrentId,
      registerItem,
      focusItemById,
      onItemKeyDown,
      claimInitialActiveId,
    ])

    assertSingleElementChild(children, 'Root')

    const child = children as React.ReactElement
    const merged = mergeSlotProps({
      partProps: props as unknown as AnyProps,
      child,
      exclude: ROOT_EXCLUDED_PROPS,
    })

    return (
      <RovingFocusContext.Provider value={contextValue}>
        {React.cloneElement(child, {
          ...merged,
          ref: chainSlotRefs(forwardedRef, getChildRef(child)),
        } as unknown as Record<string, unknown>)}
      </RovingFocusContext.Provider>
    )
  }
)

RovingFocusRoot.displayName = 'RovingFocus.Root'

export const RovingFocusItem = React.forwardRef<HTMLElement, RovingFocusItemProps>(
  function RovingFocusItem(props, forwardedRef) {
    const { children, id: idProp, disabled = false, textValue } = props
    const context = React.useContext(RovingFocusContext)
    if (!context) {
      throw new Error('Reference UI: RovingFocus.Item must be used within a RovingFocus.Root')
    }

    const generatedIdRef = React.useRef<string | null>(null)
    if (!generatedIdRef.current) {
      generatedIdRef.current = `rf-item-${++rovingFocusIdCounter}`
    }
    const id = idProp ?? generatedIdRef.current

    const itemRef = React.useRef<HTMLElement | null>(null)

    React.useEffect(() => {
      return context.registerItem({
        id,
        ref: itemRef,
        disabled,
        textValue,
      })
    }, [context, id, disabled, textValue])

    assertSingleElementChild(children, 'Item')

    const child = children as React.ReactElement

    // Before the client settles a current id (and during SSR), the first enabled
    // item to render claims the sole tab stop so server and client agree.
    let isCurrent = false
    if (context.currentId !== null) {
      isCurrent = context.currentId === id
    } else if (!disabled) {
      isCurrent = context.claimInitialActiveId(id)
    }
    // Authoritative: consumer tabIndex values on part or child never win (RF-TAB-08).
    const tabIndex = isCurrent && !disabled ? 0 : -1

    // Kernel handlers run last in the slot chain (child, then part consumer
    // props, then kernel), each gated on defaultPrevented (RF-KEY-08).
    const handleKernelFocus = () => {
      if (!disabled && context.currentId !== id) {
        context.setCurrentId(id)
      }
    }

    const handleKernelKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
      context.onItemKeyDown(e, id)
    }

    // Pointer press sets currentness (RF-TAB-04, FEATURES #4): taps that never
    // move DOM focus (touch, Safari click) still choose the re-entry stop.
    // Currentness-only — never focuses, so composed focus policies (Menu
    // click-open restore) keep full authority. Consumer preventDefault opts out.
    // Primary button only: right-clicks and aux presses must not move the stop
    // (UX review); the consumer's own handler still sees every press.
    const handleKernelPointerDown = (e: React.PointerEvent<HTMLElement>) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (!disabled && context.currentId !== id) {
        context.setCurrentId(id)
      }
    }

    const merged = mergeSlotProps({
      partProps: props as unknown as AnyProps,
      child,
      exclude: ITEM_EXCLUDED_PROPS,
      kernelHandlers: {
        onFocus: handleKernelFocus,
        onKeyDown: handleKernelKeyDown,
        onPointerDown: handleKernelPointerDown,
      },
      overrides: { tabIndex },
    })

    return React.cloneElement(child, {
      ...merged,
      ref: chainSlotRefs(
        (node: HTMLElement | null) => {
          itemRef.current = node
        },
        getChildRef(child),
        forwardedRef
      ),
    } as unknown as Record<string, unknown>)
  }
)

RovingFocusItem.displayName = 'RovingFocus.Item'

export const RovingFocus = {
  Root: RovingFocusRoot,
  Item: RovingFocusItem,
}

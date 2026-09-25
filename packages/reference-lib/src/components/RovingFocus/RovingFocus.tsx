import * as React from 'react'
import { TypeaheadModel, type TypeaheadItem } from './typeahead'

export { TypeaheadModel } from './typeahead'
export type { TypeaheadItem } from './typeahead'

export type RovingFocusOrientation = 'horizontal' | 'vertical' | 'both'

export interface RovingFocusRootProps {
  children?: React.ReactElement | null | false
  orientation?: RovingFocusOrientation
  loop?: boolean
  typeahead?: boolean
  defaultCurrentId?: string
  currentId?: string
  onCurrentIdChange?: (id: string) => void
}

export interface RovingFocusItemProps {
  children?: React.ReactElement | null | false
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

function getDirection(el: HTMLElement | null): 'ltr' | 'rtl' {
  if (!el || typeof window === 'undefined') return 'ltr'
  return window.getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr'
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true
  if (target.isContentEditable) return true
  return false
}

const RovingFocusContext = React.createContext<RovingFocusContextValue | null>(null)

let rovingFocusIdCounter = 0

export function RovingFocusRoot({
  children,
  orientation = 'horizontal',
  loop = false,
  typeahead = false,
  defaultCurrentId,
  currentId: currentIdProp,
  onCurrentIdChange,
}: RovingFocusRootProps) {
  const [internalCurrentId, setInternalCurrentId] = React.useState<string | null>(
    defaultCurrentId ?? null
  )
  const itemsMapRef = React.useRef<Map<string, ItemEntry>>(new Map())
  const typeaheadModelRef = React.useRef<TypeaheadModel>(new TypeaheadModel())
  const initialActiveIdRef = React.useRef<string | null>(null)
  const [registrationVersion, setRegistrationVersion] = React.useState(0)

  const isControlled = currentIdProp !== undefined
  const currentId = isControlled ? currentIdProp : internalCurrentId

  const setCurrentId = React.useCallback(
    (id: string) => {
      if (!isControlled) {
        setInternalCurrentId(id)
      }
      onCurrentIdChange?.(id)
    },
    [isControlled, onCurrentIdChange]
  )

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

  // Initial and reactive active item settlement: pick a tab stop on mount and
  // repair it when the current item is removed or becomes unavailable (RF-TAB-06).
  React.useEffect(() => {
    const ordered = getOrderedItems()
    const available = ordered.filter(isItemAvailable)

    if (available.length === 0) {
      if (currentId !== null && !isControlled) {
        setInternalCurrentId(null)
      }
      return
    }

    if (currentId === null) {
      const claimed = initialActiveIdRef.current
      const first = available[0]
      const target =
        claimed && available.some(i => i.id === claimed) ? claimed : first ? first.id : null
      if (target !== null) {
        setCurrentId(target)
      }
      return
    }

    if (!available.some(i => i.id === currentId)) {
      const oldIndex = ordered.findIndex(i => i.id === currentId)
      let nextAvailable: ItemEntry | undefined
      if (oldIndex !== -1) {
        for (let i = oldIndex + 1; i < ordered.length; i++) {
          const candidate = ordered[i]
          if (candidate && isItemAvailable(candidate)) {
            nextAvailable = candidate
            break
          }
        }
        if (!nextAvailable) {
          for (let i = oldIndex - 1; i >= 0; i--) {
            const candidate = ordered[i]
            if (candidate && isItemAvailable(candidate)) {
              nextAvailable = candidate
              break
            }
          }
        }
      }
      const fallback = available[0]
      const target = nextAvailable ? nextAvailable.id : fallback ? fallback.id : null
      if (target !== null) {
        setCurrentId(target)
      }
    }
  }, [getOrderedItems, currentId, isControlled, registrationVersion, setCurrentId])

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

      if (orientation === 'horizontal' || orientation === 'both') {
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

      if (orientation === 'vertical' || orientation === 'both') {
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

  const handleTypeahead = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>, activeId: string, orderedItems: ItemEntry[]) => {
      if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return
      if (e.nativeEvent?.isComposing) return
      if (isEditableTarget(e.target)) return
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
        handle1DNavigation(e, currentIndex, enabledItems)
      } else if (typeahead) {
        handleTypeahead(e, id, orderedItems)
      }
    },
    [getOrderedItems, handle1DNavigation, handleTypeahead, typeahead]
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

  if (!children) {
    return null
  }

  if (typeof children !== 'object' || !React.isValidElement(children)) {
    throw new Error('Reference UI: RovingFocus.Root expects a single valid React element child.')
  }

  return (
    <RovingFocusContext.Provider value={contextValue}>
      {children}
    </RovingFocusContext.Provider>
  )
}

export function RovingFocusItem({
  children,
  id: idProp,
  disabled = false,
  textValue,
}: RovingFocusItemProps) {
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

  if (!children) {
    return null
  }

  if (typeof children !== 'object' || !React.isValidElement(children)) {
    throw new Error('Reference UI: RovingFocus.Item expects a single valid React element child.')
  }

  const child = children as React.ReactElement<any>
  const originalRef = (child.props as any)?.ref
  const originalOnFocus = child.props.onFocus
  const originalOnKeyDown = child.props.onKeyDown

  // Before the client settles a current id (and during SSR), the first enabled
  // item to render claims the sole tab stop so server and client agree.
  let isCurrent = false
  if (context.currentId !== null) {
    isCurrent = context.currentId === id
  } else if (!disabled) {
    isCurrent = context.claimInitialActiveId(id)
  }
  const tabIndex = isCurrent && !disabled ? 0 : -1

  const composedRef = (node: HTMLElement | null) => {
    itemRef.current = node
    if (typeof originalRef === 'function') {
      originalRef(node)
    } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
      ;(originalRef as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    originalOnFocus?.(e)
    if (!disabled && context.currentId !== id) {
      context.setCurrentId(id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    originalOnKeyDown?.(e)
    if (!e.defaultPrevented) {
      context.onItemKeyDown(e, id)
    }
  }

  return React.cloneElement(child, {
    ref: composedRef,
    tabIndex,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
  })
}

export const RovingFocus = {
  Root: RovingFocusRoot,
  Item: RovingFocusItem,
}

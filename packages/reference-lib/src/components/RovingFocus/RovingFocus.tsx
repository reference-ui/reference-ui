import * as React from 'react'

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
  const typeaheadBufferRef = React.useRef<string>('')
  const typeaheadTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Ensure an initial currentId is assigned once items mount
  React.useEffect(() => {
    if (currentId === null) {
      const ordered = getOrderedItems().filter(i => !i.disabled)
      if (ordered.length > 0 && ordered[0]) {
        setCurrentId(ordered[0].id)
      }
    }
  }, [currentId, getOrderedItems, setCurrentId])

  const registerItem = React.useCallback((entry: ItemEntry) => {
    itemsMapRef.current.set(entry.id, entry)
    return () => {
      itemsMapRef.current.delete(entry.id)
    }
  }, [])

  const focusItemById = React.useCallback(
    (id: string) => {
      const entry = itemsMapRef.current.get(id)
      if (entry?.ref.current && !entry.disabled) {
        setCurrentId(id)
        entry.ref.current.focus()
      }
    },
    [setCurrentId]
  )

  const handle1DNavigation = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>, currentIndex: number, enabledItems: ItemEntry[]) => {
      const isRtl = typeof document !== 'undefined' && document.dir === 'rtl'
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
    (e: React.KeyboardEvent<HTMLElement>, currentItem: ItemEntry, enabledItems: ItemEntry[]) => {
      if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key === ' ' && typeaheadBufferRef.current.length === 0) return // Space doesn't start typeahead

      e.preventDefault()

      if (typeaheadTimerRef.current) {
        clearTimeout(typeaheadTimerRef.current)
      }

      typeaheadTimerRef.current = setTimeout(() => {
        typeaheadBufferRef.current = ''
      }, 1000)

      typeaheadBufferRef.current += e.key.toLowerCase()
      const search = typeaheadBufferRef.current

      // Search from current item forward, wrapping once
      const currentIndex = enabledItems.findIndex(i => i.id === currentItem.id)
      const searchOrder = [
        ...enabledItems.slice(currentIndex + 1),
        ...enabledItems.slice(0, currentIndex + 1),
      ]

      const match = searchOrder.find(item => {
        const label = (
          item.textValue ||
          item.ref.current?.getAttribute('aria-label') ||
          item.ref.current?.textContent ||
          ''
        )
          .trim()
          .toLowerCase()
        return label.startsWith(search)
      })

      if (match) {
        focusItemById(match.id)
      }
    },
    [focusItemById]
  )

  const onItemKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>, id: string) => {
      if (e.defaultPrevented) return
      if (e.ctrlKey || e.altKey || e.metaKey) return

      const orderedItems = getOrderedItems()
      const enabledItems = orderedItems.filter(i => !i.disabled)
      const currentIndex = enabledItems.findIndex(i => i.id === id)
      if (currentIndex === -1) return

      const currentItem = enabledItems[currentIndex]

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
      } else if (typeahead && currentItem) {
        handleTypeahead(e, currentItem, enabledItems)
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
  const originalRef = (child as any).ref
  const originalOnFocus = child.props.onFocus
  const originalOnKeyDown = child.props.onKeyDown

  const isCurrent = context.currentId === id
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

import * as React from 'react'

export interface SlotVisibility {
  visible?: boolean
  hidden?: boolean
}

export type ResolvedSlotVisibility = 'visible' | 'hidden' | 'unmounted'

export function resolveSlotVisibility(visibility?: SlotVisibility): ResolvedSlotVisibility {
  if (!visibility) {
    return 'visible'
  }
  const isHidden = visibility.hidden === true
  const isVisible = visibility.visible !== false // omitted visible is true

  if (isHidden) {
    return 'hidden'
  }
  if (!isVisible) {
    return 'unmounted'
  }
  return 'visible'
}

export interface SlotRegistration<TMeta = unknown> {
  element: React.ReactElement
  slotId: string
  meta?: TMeta
  visibility?: SlotVisibility
}

export class SlotRoot<TMeta = unknown> {
  private _version = 0
  private _entries = new Map<string, SlotRegistration<TMeta>>()
  private _cachedList: SlotRegistration<TMeta>[] = []
  private _isCacheDirty = false
  private _subscribers = new Set<() => void>()

  public register(registrationId: string, slot: SlotRegistration<TMeta>): void {
    this._entries.set(registrationId, slot)
    this._version++
    this._isCacheDirty = true
    this._notify()
  }

  public unregister(registrationId: string): void {
    if (this._entries.delete(registrationId)) {
      this._version++
      this._isCacheDirty = true
      this._notify()
    }
  }

  public getVersion(): number {
    return this._version
  }

  public scanById(slotId: string): SlotRegistration<TMeta> | undefined {
    for (const entry of this._entries.values()) {
      if (entry.slotId === slotId) {
        return entry
      }
    }
    return undefined
  }

  public scanAll(predicate: (slot: SlotRegistration<TMeta>) => boolean): SlotRegistration<TMeta>[] {
    const results: SlotRegistration<TMeta>[] = []
    for (const entry of this._entries.values()) {
      if (predicate(entry)) {
        results.push(entry)
      }
    }
    return results
  }

  public getAll(): SlotRegistration<TMeta>[] {
    if (this._isCacheDirty) {
      this._cachedList = Array.from(this._entries.values())
      this._isCacheDirty = false
    }
    return this._cachedList
  }

  public subscribe(listener: () => void): () => void {
    this._subscribers.add(listener)
    let unsubscribed = false
    return () => {
      if (unsubscribed) return
      unsubscribed = true
      this._subscribers.delete(listener)
    }
  }

  private _notify(): void {
    const subscribers = Array.from(this._subscribers)
    for (const sub of subscribers) {
      try {
        sub()
      } catch (err) {
        // Log or suppress without breaking notification of other subscribers
        console.error('Error in SlotRoot subscriber:', err)
      }
    }
  }
}

export function createSlotCacheKey(slots: SlotRegistration[]): string {
  return slots
    .map(s => s.slotId)
    .sort()
    .join(',')
}

export function transformSlotElements<TProps extends Record<string, unknown>>(
  slots: SlotRegistration[],
  createProps: (slot: SlotRegistration) => TProps
): Array<React.ReactElement<TProps>> {
  return slots.map(slot => {
    const extraProps = createProps(slot)
    const originalProps = (slot.element.props && typeof slot.element.props === 'object'
      ? slot.element.props
      : {}) as Record<string, unknown>
    return React.cloneElement(slot.element, {
      ...originalProps,
      ...extraProps,
    } as any) as unknown as React.ReactElement<TProps>
  })
}

export interface UseSlotRegistrationOptions<TMeta = unknown> {
  slotId: string
  element: React.ReactElement
  meta?: TMeta
  visibility?: SlotVisibility
}

export interface SlotRootContext<TMeta = unknown> {
  Provider: React.ComponentType<{
    children?: React.ReactNode
    root?: SlotRoot<TMeta>
  }>
  useRoot(): SlotRoot<TMeta>
  useSlotRegistration(
    options: UseSlotRegistrationOptions<TMeta>,
    deps?: React.DependencyList
  ): void
  useScanById(slotId: string): SlotRegistration<TMeta> | undefined
  useGetAll(): SlotRegistration<TMeta>[]
}

let registrationCounter = 0

export function createSlotRootContext<TMeta = unknown>(): SlotRootContext<TMeta> {
  const Context = React.createContext<SlotRoot<TMeta> | null>(null)

  function Provider({
    children,
    root: userRoot,
  }: {
    children?: React.ReactNode
    root?: SlotRoot<TMeta>
  }) {
    const rootRef = React.useRef<SlotRoot<TMeta> | null>(null)
    if (!rootRef.current) {
      rootRef.current = userRoot ?? new SlotRoot<TMeta>()
    }
    const root = userRoot ?? rootRef.current

    return React.createElement(Context.Provider, { value: root }, children)
  }

  function useRoot(): SlotRoot<TMeta> {
    const root = React.useContext(Context)
    if (!root) {
      throw new Error(
        'Reference UI: useRoot must be used within a corresponding Slot.Provider'
      )
    }
    return root
  }

  function useSlotRegistration(
    options: UseSlotRegistrationOptions<TMeta>,
    deps: React.DependencyList = []
  ): void {
    const root = useRoot()
    const regIdRef = React.useRef<string | null>(null)
    if (regIdRef.current === null) {
      regIdRef.current = `slot-reg-${++registrationCounter}`
    }
    const regId = regIdRef.current

    // Live getters held in a ref container
    const latestRef = React.useRef(options)
    latestRef.current = options

    // In-place registration container object with live getters
    const slotContainerRef = React.useRef<SlotRegistration<TMeta> | null>(null)
    if (!slotContainerRef.current) {
      slotContainerRef.current = {
        get slotId() {
          return latestRef.current.slotId
        },
        get element() {
          return latestRef.current.element
        },
        get meta() {
          return latestRef.current.meta
        },
        get visibility() {
          return latestRef.current.visibility
        },
      } as SlotRegistration<TMeta>
    }

    const isInitialMount = React.useRef(true)

    React.useLayoutEffect(() => {
      // Re-register in place when slotId or deps change
      root.register(regId, slotContainerRef.current!)
      isInitialMount.current = false
    }, [root, regId, options.slotId, ...deps])

    React.useEffect(() => {
      return () => {
        root.unregister(regId)
      }
    }, [root, regId])
  }

  function useScanById(slotId: string): SlotRegistration<TMeta> | undefined {
    const root = useRoot()
    const subscribe = React.useCallback(
      (onStoreChange: () => void) => root.subscribe(onStoreChange),
      [root]
    )
    const getSnapshot = React.useCallback(() => root.getVersion(), [root])

    // Subscribe to version changes to trigger re-renders
    React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

    return root.scanById(slotId)
  }

  function useGetAll(): SlotRegistration<TMeta>[] {
    const root = useRoot()
    const subscribe = React.useCallback(
      (onStoreChange: () => void) => root.subscribe(onStoreChange),
      [root]
    )
    const getSnapshot = React.useCallback(() => root.getAll(), [root])

    return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  }

  return {
    Provider,
    useRoot,
    useSlotRegistration,
    useScanById,
    useGetAll,
  }
}

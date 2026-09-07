import { createStore } from 'zustand/vanilla'

export interface TooltipGroupState {
  activeId: string | null;
  pendingId: string | null;
  warmUntil: number;
  skipDelay: number;
}

export interface TooltipGroupActions {
  setActive: (id: string | null) => void;
  setPending: (id: string | null) => void;
  warm: () => void;
  resetWarm: () => void;
  setSkipDelay: (delay: number) => void;
}

export type TooltipGroupStore = ReturnType<typeof createTooltipGroupStore>

function createTooltipGroupStore() {
  return createStore<TooltipGroupState & TooltipGroupActions>((set) => ({
    activeId: null,
    pendingId: null,
    warmUntil: 0,
    skipDelay: 300,
    setActive: (id) => set({ activeId: id }),
    setPending: (id) => set({ pendingId: id }),
    warm: () => set((state) => ({ warmUntil: Date.now() + state.skipDelay })),
    resetWarm: () => set({ warmUntil: 0 }),
    setSkipDelay: (delay) => set({ skipDelay: delay }),
  }))
}

const stores = new WeakMap<Document, TooltipGroupStore>()

export function getTooltipGroupStore(doc?: Document): TooltipGroupStore {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : undefined)
  if (!targetDoc) {
    return createTooltipGroupStore()
  }
  let store = stores.get(targetDoc)
  if (!store) {
    store = createTooltipGroupStore()
    stores.set(targetDoc, store)
  }
  return store
}

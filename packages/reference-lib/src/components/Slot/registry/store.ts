/**
 * The Slot registry store: `SlotRoot` keys entries by registration id (not
 * slot id), so one slot id may hold several registrations and `getById`
 * returns the first exact match. Writes bump a structural version and notify
 * subscribers; reads never clone, and `getAll` keeps array identity while
 * the set is unchanged so `useSyncExternalStore` snapshots stay stable.
 */
import type { SlotRegistration } from '../types'

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

  public getById(slotId: string): SlotRegistration<TMeta> | undefined {
    for (const entry of this._entries.values()) {
      if (entry.slotId === slotId) {
        return entry
      }
    }
    return undefined
  }

  public select(filter: (slot: SlotRegistration<TMeta>) => boolean): SlotRegistration<TMeta>[] {
    const results: SlotRegistration<TMeta>[] = []
    for (const entry of this._entries.values()) {
      if (filter(entry)) {
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

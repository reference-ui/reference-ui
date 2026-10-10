/**
 * Sibling-part exit ledger behind `PresenceCoordinatorContext`. Overlay owns
 * one ledger per open cycle and shares it with its parts (Backdrop, Content):
 * parts register on mount, report when their own effects finish, and the
 * ledger notifies `subscribeToAllComplete` subscribers on a microtask once
 * every registered part has reported while closed. `reset` clears the
 * finished set when the cycle reopens; `isActive` gates the whole protocol —
 * a lone part completes on its own effects without ever consulting the
 * ledger. The hook wraps this class in refs; the class carries the counting,
 * so coordination pins down in a unit test instead of a browser.
 */

export class CoordinatorLedger {
  private registered = new Set<string>()
  private finished = new Set<string>()
  private subscribers = new Set<() => void>()

  constructor(private isPresent: () => boolean) {}

  /** Clear finished reports when the cycle reopens. */
  reset(): void {
    this.finished.clear()
  }

  register(id: string): void {
    this.registered.add(id)
  }

  unregister(id: string): void {
    this.registered.delete(id)
    this.finished.delete(id)
    this.notifyIfAllComplete()
  }

  reportFinished(id: string): void {
    this.finished.add(id)
    this.notifyIfAllComplete()
  }

  subscribe(cb: () => void): () => void {
    this.subscribers.add(cb)
    return () => {
      this.subscribers.delete(cb)
    }
  }

  isActive(): boolean {
    return !this.isPresent() && this.registered.size > 1
  }

  private notifyIfAllComplete(): void {
    if (
      !this.isPresent() &&
      this.registered.size > 0 &&
      this.finished.size >= this.registered.size
    ) {
      queueMicrotask(() => this.notify())
    }
  }

  private notify(): void {
    if (
      !this.isPresent() &&
      this.registered.size > 0 &&
      this.finished.size >= this.registered.size
    ) {
      this.subscribers.forEach(cb => cb())
    }
  }
}

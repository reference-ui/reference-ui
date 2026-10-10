/**
 * Parent-side descendant bookkeeping for nested exits. A closing parent
 * suspends until its own effects finish and every registered descendant exit
 * reports back; `createDescendantRegistry` owns that pending set. Descendants
 * register at exit-start only — never on mount, so a born-closed child has no
 * exit to report and cannot strand the parent (B-01) — and every release path
 * (`unregister` for interruption/removal, `complete` for a finished exit)
 * funnels through `onSettled`, which is where the hook re-checks the release
 * predicate. The settlement call fires unconditionally, matching the
 * historical port: the hook's guard absorbs redundant releases.
 */

export interface DescendantRegistry {
  register: (id: string) => void
  unregister: (id: string) => void
  complete: (id: string) => void
  readonly size: number
}

export function createDescendantRegistry(
  onSettled: (id: string) => void
): DescendantRegistry {
  const pending = new Set<string>()
  return {
    register: (id: string) => {
      pending.add(id)
    },
    unregister: (id: string) => {
      pending.delete(id)
      onSettled(id)
    },
    complete: (id: string) => {
      pending.delete(id)
      onSettled(id)
    },
    get size() {
      return pending.size
    },
  }
}

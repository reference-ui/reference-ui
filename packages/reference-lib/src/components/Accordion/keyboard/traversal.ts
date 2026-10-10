/**
 * Header traversal math: the APG arrow/Home/End index decisions over an
 * accordion's header buttons. A header counts when it is enabled (no
 * `disabled` property and no `disabled` attribute), and arrow moves wrap
 * around the header order, skipping every disabled stop.
 */
export interface HeaderCandidate {
  readonly disabled: boolean
  hasAttribute(name: string): boolean
}

export function isHeaderEnabled(candidate: HeaderCandidate): boolean {
  return !candidate.disabled && !candidate.hasAttribute('disabled')
}

export function findNextEnabledIndex(
  triggers: readonly HeaderCandidate[],
  currentIndex: number,
  direction: 1 | -1
): number {
  const count = triggers.length
  if (count === 0) return -1
  for (let i = 1; i <= count; i++) {
    const nextIndex = (currentIndex + direction * i + count * 10) % count
    const candidate = triggers[nextIndex]
    if (candidate && isHeaderEnabled(candidate)) {
      return nextIndex
    }
  }
  return -1
}

export function firstEnabledIndex(triggers: readonly HeaderCandidate[]): number {
  return triggers.findIndex((candidate) => isHeaderEnabled(candidate))
}

export function lastEnabledIndex(triggers: readonly HeaderCandidate[]): number {
  for (let i = triggers.length - 1; i >= 0; i--) {
    const candidate = triggers[i]
    if (candidate && isHeaderEnabled(candidate)) {
      return i
    }
  }
  return -1
}

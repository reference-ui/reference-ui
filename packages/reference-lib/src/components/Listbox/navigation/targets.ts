/**
 * Listbox's arrow-navigation targets: pure index resolvers for the
 * standalone path (live-DOM options, already enabled-filtered by the
 * query) and the virtual path (logical items with disabled skipping).
 * Arrows wrap with orientation/RTL direction, Home/End jump to the first
 * and last stop, and anything else holds position. The navigation hook
 * owns DOM focus and pending virtual targets; this module only answers
 * "which index does this key name".
 */
import type { ListboxOrientation } from '../types'

export function resolveStandaloneTarget(
  count: number,
  current: number,
  key: string,
  orientation: ListboxOrientation,
  isRtl: boolean
): number {
  let target = current
  if (orientation === 'vertical') {
    if (key === 'ArrowDown') {
      target = (current + 1) % count
    } else if (key === 'ArrowUp') {
      target = (current - 1 + count) % count
    }
  } else if (orientation === 'horizontal') {
    const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight'
    const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft'
    if (key === nextKey) {
      target = (current + 1) % count
    } else if (key === prevKey) {
      target = (current - 1 + count) % count
    }
  }

  if (key === 'Home') {
    target = 0
  } else if (key === 'End') {
    target = count - 1
  }
  return target
}

export function resolveVirtualTarget(
  items: readonly { disabled?: boolean }[],
  effective: number,
  key: string,
  orientation: ListboxOrientation,
  isRtl: boolean
): number {
  let target = effective
  const step = (delta: 1 | -1) => {
    for (let s = 1; s <= items.length; s += 1) {
      const idx = (effective + delta * s + items.length) % items.length
      if (!items[idx].disabled) {
        target = idx
        break
      }
    }
  }

  if (orientation === 'vertical') {
    if (key === 'ArrowDown') {
      step(1)
    } else if (key === 'ArrowUp') {
      step(-1)
    }
  } else if (orientation === 'horizontal') {
    const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight'
    const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft'
    if (key === nextKey) {
      step(1)
    } else if (key === prevKey) {
      step(-1)
    }
  }

  if (key === 'Home') {
    const first = items.findIndex(i => !i.disabled)
    if (first !== -1) target = first
  } else if (key === 'End') {
    for (let i = items.length - 1; i >= 0; i--) {
      if (!items[i].disabled) {
        target = i
        break
      }
    }
  }
  return target
}

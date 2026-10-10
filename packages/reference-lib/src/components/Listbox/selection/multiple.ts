/**
 * Listbox's multiple-selection reducer: toggling a value returns the next
 * array with known values in collection order and unknown values (selected
 * but not mounted, e.g. filtered out) appended in encounter order. Pure —
 * the selection hook calls it and hands the result to onChange.
 */

export function computeNextMultipleSelection<TValue extends string = string>(
  currentValue: TValue | TValue[] | null | undefined,
  toggledValue: TValue,
  orderedKnownValues: readonly TValue[]
): TValue[] {
  const currentArray: readonly TValue[] = Array.isArray(currentValue) ? currentValue : []
  const isCurrentlySelected = currentArray.includes(toggledValue)

  let nextSelectedSet: Set<TValue>
  if (isCurrentlySelected) {
    nextSelectedSet = new Set(currentArray.filter(v => v !== toggledValue))
  } else {
    nextSelectedSet = new Set([...currentArray, toggledValue])
  }

  const knownSelected: TValue[] = []
  for (const val of orderedKnownValues) {
    if (nextSelectedSet.has(val)) {
      knownSelected.push(val)
      nextSelectedSet.delete(val)
    }
  }

  const unknownSelected: TValue[] = []
  for (const val of currentArray) {
    if (nextSelectedSet.has(val) && !unknownSelected.includes(val)) {
      unknownSelected.push(val)
      nextSelectedSet.delete(val)
    }
  }
  if (nextSelectedSet.has(toggledValue) && !unknownSelected.includes(toggledValue)) {
    unknownSelected.push(toggledValue)
  }

  return [...knownSelected, ...unknownSelected]
}

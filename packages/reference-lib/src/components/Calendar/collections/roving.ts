/**
 * Collection roving: computePreferredCell ranks the enabled selection,
 * then the enabled current cell, then the first enabled cell — null when
 * the whole collection is blocked, so no artificial tab stop.
 * nearestEnabledCell relocates a lost target forward-first. Generic over
 * the cell key so the month and year fields share one rover.
 */
export interface RovingCell {
  key: string
  disabled: boolean
  selected: boolean
  current: boolean
}

export function computePreferredCell(cells: RovingCell[]): string | null {
  const enabledSelected = cells.find((cell) => !cell.disabled && cell.selected)
  if (enabledSelected) return enabledSelected.key
  const current = cells.find((cell) => cell.current && !cell.disabled)
  if (current) return current.key
  return cells.find((cell) => !cell.disabled)?.key ?? null
}

export function nearestEnabledCell(cells: RovingCell[], origin: string): string | null {
  const originIndex = cells.findIndex((cell) => cell.key === origin)
  const scan = (from: number, step: 1 | -1): string | null => {
    for (let i = from; i >= 0 && i < cells.length; i += step) {
      if (!cells[i].disabled) return cells[i].key
    }
    return null
  }
  if (originIndex >= 0) {
    return scan(originIndex + 1, 1) ?? scan(originIndex - 1, -1)
  }
  return scan(0, 1)
}

// Visual-grid geometry for orientation="both" (FEATURES #1). Rows and columns
// are the rendered visual geometry: rects are re-read per keystroke by the
// caller (no cached grid), rows group by vertical overlap, horizontal moves
// follow visual x order, and vertical moves choose the adjacent row's nearest
// horizontal center with DOM-order tie-breaking. Framework-free so unit tests
// pin ragged rows, ties, and loop wrap deterministically.

export interface GridCellRect {
  top: number
  left: number
  width: number
  height: number
}

export interface GridCell {
  id: string
  rect: GridCellRect
  /** Position in current DOM order; breaks exact distance ties. */
  domIndex: number
  /** Disabled and hidden cells shape rows but are never destinations. */
  available: boolean
}

export type GridArrow = 'left' | 'right' | 'up' | 'down'

function centerX(rect: GridCellRect): number {
  return rect.left + rect.width / 2
}

function bottom(rect: GridCellRect): number {
  return rect.top + rect.height
}

/**
 * Group cells into visual rows by vertical overlap. Cells sorted by top join
 * the current row while they overlap its bottom edge; a cell starting at or
 * below that edge opens a new row. Rows arrive in top order; members keep
 * DOM order so downstream tie-breaking stays stable.
 */
export function groupGridRows(cells: GridCell[]): GridCell[][] {
  const sorted = [...cells].sort((a, b) =>
    a.rect.top !== b.rect.top ? a.rect.top - b.rect.top : a.domIndex - b.domIndex
  )
  const rows: GridCell[][] = []
  let rowMaxBottom = -Infinity
  for (const cell of sorted) {
    const current = rows[rows.length - 1]
    if (!current || cell.rect.top >= rowMaxBottom) {
      rows.push([cell])
      rowMaxBottom = bottom(cell.rect)
    } else {
      current.push(cell)
      if (bottom(cell.rect) > rowMaxBottom) rowMaxBottom = bottom(cell.rect)
    }
  }
  return rows
}

function nearestCenterInRow(
  row: GridCell[],
  targetCenterX: number
): GridCell | undefined {
  let best: GridCell | undefined
  let bestDistance = Infinity
  for (const cell of row) {
    if (!cell.available) continue
    const distance = Math.abs(centerX(cell.rect) - targetCenterX)
    // Strictly-less replacement over DOM-ordered candidates: an exact tie
    // keeps the earliest candidate in DOM order (RF-GRID-02).
    if (distance < bestDistance) {
      best = cell
      bestDistance = distance
    }
  }
  return best
}

/**
 * Resolve one grid arrow to a destination id, or null when focus must stay
 * (missing edge with loop off, or an adjacent row with no available cell).
 * Horizontal moves follow visual x order, so RTL reversal falls out of the
 * geometry; vertical moves never consult direction (RF-GRID-06).
 */
export function findGridTarget(
  cells: GridCell[],
  currentId: string,
  arrow: GridArrow,
  options?: { loop?: boolean }
): string | null {
  const loop = options?.loop === true
  const rows = groupGridRows(cells)
  const currentRowIndex = rows.findIndex(row => row.some(cell => cell.id === currentId))
  if (currentRowIndex === -1) return null
  const currentRow = rows[currentRowIndex]
  const current = currentRow?.find(cell => cell.id === currentId)
  if (!currentRow || !current || !current.available) return null

  if (arrow === 'left' || arrow === 'right') {
    const inRow = currentRow
      .filter(cell => cell.available)
      .sort((a, b) =>
        centerX(a.rect) !== centerX(b.rect)
          ? centerX(a.rect) - centerX(b.rect)
          : a.domIndex - b.domIndex
      )
    const at = inRow.findIndex(cell => cell.id === currentId)
    if (at === -1) return null
    const next = arrow === 'right' ? at + 1 : at - 1
    if (next >= 0 && next < inRow.length) {
      const target = inRow[next]
      return target ? target.id : null
    }
    if (!loop || inRow.length === 0) return null
    const wrapped = arrow === 'right' ? inRow[0] : inRow[inRow.length - 1]
    return wrapped ? wrapped.id : null
  }

  const rowCount = rows.length
  const adjacentIndex = arrow === 'down' ? currentRowIndex + 1 : currentRowIndex - 1
  const targetRow =
    adjacentIndex >= 0 && adjacentIndex < rowCount
      ? rows[adjacentIndex]
      : loop
        ? rows[arrow === 'down' ? 0 : rowCount - 1]
        : undefined
  if (!targetRow) return null
  const target = nearestCenterInRow(targetRow, centerX(current.rect))
  return target ? target.id : null
}

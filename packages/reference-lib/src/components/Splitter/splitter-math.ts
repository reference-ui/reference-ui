export interface PanelConstraints {
  minSize?: number
  maxSize?: number
  collapsible?: boolean
  collapsedSize?: number
  disabled?: boolean
}

export function formatLayoutNumber(num: number): number {
  return parseFloat(num.toFixed(3))
}

export function layoutNumbersEqual(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(formatLayoutNumber(a) - formatLayoutNumber(b)) <= epsilon
}

export function compareLayoutNumbers(a: number, b: number): number {
  if (layoutNumbersEqual(a, b)) return 0
  return a > b ? 1 : -1
}

export function validatePanelSize({
  panelConstraints,
  prevSize,
  size,
  overrideDisabledPanels = false,
}: {
  panelConstraints: PanelConstraints
  prevSize: number
  size: number
  overrideDisabledPanels?: boolean
}): number {
  const {
    collapsedSize = 0,
    collapsible = false,
    disabled = false,
    maxSize = 100,
    minSize = 0,
  } = panelConstraints

  if (disabled && !overrideDisabledPanels) {
    return prevSize
  }

  if (compareLayoutNumbers(size, minSize) < 0) {
    if (collapsible) {
      const halfwayPoint = (collapsedSize + minSize) / 2
      if (compareLayoutNumbers(size, halfwayPoint) < 0) {
        size = collapsedSize
      } else {
        size = minSize
      }
    } else {
      size = minSize
    }
  }

  size = Math.min(maxSize, size)
  return formatLayoutNumber(size)
}

export function validatePanelGroupLayout({
  layout,
  panelConstraints,
}: {
  layout: number[]
  panelConstraints: PanelConstraints[]
}): number[] {
  const prevLayout = [...layout]
  const nextLayout = [...prevLayout]

  const nextLayoutTotalSize = nextLayout.reduce((acc, cur) => acc + cur, 0)

  if (nextLayout.length !== panelConstraints.length) {
    return nextLayout
  }

  if (!layoutNumbersEqual(nextLayoutTotalSize, 100) && nextLayout.length > 0 && nextLayoutTotalSize > 0) {
    for (let i = 0; i < panelConstraints.length; i++) {
      nextLayout[i] = (100 / nextLayoutTotalSize) * (nextLayout[i] ?? 0)
    }
  }

  let remainingSize = 0

  for (let i = 0; i < panelConstraints.length; i++) {
    const prev = prevLayout[i] ?? 0
    const unsafe = nextLayout[i] ?? 0
    const safe = validatePanelSize({
      panelConstraints: panelConstraints[i] ?? {},
      prevSize: prev,
      size: unsafe,
      overrideDisabledPanels: true,
    })

    if (!layoutNumbersEqual(unsafe, safe)) {
      remainingSize += unsafe - safe
      nextLayout[i] = safe
    }
  }

  if (!layoutNumbersEqual(remainingSize, 0)) {
    for (let i = 0; i < panelConstraints.length; i++) {
      const prev = nextLayout[i] ?? 0
      const unsafe = prev + remainingSize
      const safe = validatePanelSize({
        panelConstraints: panelConstraints[i] ?? {},
        prevSize: prev,
        size: unsafe,
        overrideDisabledPanels: true,
      })

      if (prev !== safe) {
        remainingSize -= safe - prev
        nextLayout[i] = safe

        if (layoutNumbersEqual(remainingSize, 0)) {
          break
        }
      }
    }
  }

  return nextLayout.map(formatLayoutNumber)
}

export function adjustLayoutByDelta({
  delta,
  initialLayout,
  panelConstraints,
  pivotIndices,
  prevLayout,
  trigger = 'mouse-or-touch',
}: {
  delta: number
  initialLayout: number[]
  panelConstraints: PanelConstraints[]
  pivotIndices: [number, number]
  prevLayout: number[]
  trigger?: 'imperative-api' | 'keyboard' | 'mouse-or-touch'
}): number[] {
  if (layoutNumbersEqual(delta, 0)) {
    return initialLayout
  }

  const overrideDisabledPanels = trigger === 'imperative-api'
  const nextLayout = [...initialLayout]
  const [firstPivotIndex, secondPivotIndex] = pivotIndices

  if (firstPivotIndex == null || secondPivotIndex == null) {
    return prevLayout
  }

  let adjustedDelta = delta

  // Edge cases for collapse/expand threshold
  if (trigger === 'keyboard') {
    // Expanding a collapsed panel
    const expandIndex = adjustedDelta < 0 ? secondPivotIndex : firstPivotIndex
    const expandConstraints = panelConstraints[expandIndex]
    if (expandConstraints?.collapsible) {
      const { collapsedSize = 0, minSize = 0 } = expandConstraints
      const prevSize = initialLayout[expandIndex] ?? 0
      if (layoutNumbersEqual(prevSize, collapsedSize)) {
        const localDelta = minSize - prevSize
        if (compareLayoutNumbers(localDelta, Math.abs(adjustedDelta)) > 0) {
          adjustedDelta = adjustedDelta < 0 ? -localDelta : localDelta
        }
      }
    }

    // Collapsing a panel at minSize
    const collapseIndex = adjustedDelta < 0 ? firstPivotIndex : secondPivotIndex
    const collapseConstraints = panelConstraints[collapseIndex]
    if (collapseConstraints?.collapsible) {
      const { collapsedSize = 0, minSize = 0 } = collapseConstraints
      const prevSize = initialLayout[collapseIndex] ?? 0
      if (layoutNumbersEqual(prevSize, minSize)) {
        const localDelta = prevSize - collapsedSize
        if (compareLayoutNumbers(localDelta, Math.abs(adjustedDelta)) > 0) {
          adjustedDelta = adjustedDelta < 0 ? -localDelta : localDelta
        }
      }
    }
  } else {
    // Pointer drag past halfway point expands/collapses
    const checkIndex = adjustedDelta < 0 ? secondPivotIndex : firstPivotIndex
    const constraints = panelConstraints[checkIndex]
    if (constraints?.collapsible) {
      const { minSize = 0, collapsedSize = 0 } = constraints
      const prevSize = initialLayout[checkIndex] ?? 0
      if (compareLayoutNumbers(prevSize, minSize) < 0) {
        const gapSize = minSize - collapsedSize
        if (adjustedDelta > 0) {
          const halfwayDelta = gapSize / 2
          const nextSize = prevSize + adjustedDelta
          if (compareLayoutNumbers(nextSize, minSize) < 0) {
            adjustedDelta = compareLayoutNumbers(adjustedDelta, halfwayDelta) <= 0 ? 0 : gapSize
          }
        } else {
          const halfwayDelta = 100 - gapSize / 2
          const nextSize = prevSize - adjustedDelta
          if (compareLayoutNumbers(nextSize, minSize) < 0) {
            adjustedDelta = compareLayoutNumbers(100 + adjustedDelta, halfwayDelta) > 0 ? 0 : -gapSize
          }
        }
      }
    }
  }

  // Pre-calculate max available delta in the opposite direction
  const increment = adjustedDelta < 0 ? 1 : -1
  let preIndex = adjustedDelta < 0 ? secondPivotIndex : firstPivotIndex
  let maxAvailableDelta = 0

  while (preIndex >= 0 && preIndex < panelConstraints.length) {
    const prevSize = initialLayout[preIndex] ?? 0
    const maxSafeSize = validatePanelSize({
      overrideDisabledPanels,
      panelConstraints: panelConstraints[preIndex] ?? {},
      prevSize,
      size: 100,
    })
    maxAvailableDelta += maxSafeSize - prevSize
    preIndex += increment
  }

  const minAbsDelta = Math.min(Math.abs(adjustedDelta), Math.abs(maxAvailableDelta))
  adjustedDelta = adjustedDelta < 0 ? -minAbsDelta : minAbsDelta

  let deltaApplied = 0
  const shrinkPivotIndex = adjustedDelta < 0 ? firstPivotIndex : secondPivotIndex
  let shrinkIndex = shrinkPivotIndex

  while (shrinkIndex >= 0 && shrinkIndex < panelConstraints.length) {
    const deltaRemaining = Math.abs(adjustedDelta) - Math.abs(deltaApplied)
    const prevSize = initialLayout[shrinkIndex] ?? 0
    const unsafeSize = prevSize - deltaRemaining
    const safeSize = validatePanelSize({
      overrideDisabledPanels,
      panelConstraints: panelConstraints[shrinkIndex] ?? {},
      prevSize,
      size: unsafeSize,
    })

    if (!layoutNumbersEqual(prevSize, safeSize)) {
      deltaApplied += prevSize - safeSize
      nextLayout[shrinkIndex] = safeSize

      if (
        deltaApplied.toFixed(3).localeCompare(Math.abs(adjustedDelta).toFixed(3), undefined, {
          numeric: true,
        }) >= 0
      ) {
        break
      }
    }

    if (adjustedDelta < 0) {
      shrinkIndex--
    } else {
      shrinkIndex++
    }
  }

  // Check if anything could be resized
  const isUnchanged = prevLayout.every((val, idx) => layoutNumbersEqual(val, nextLayout[idx] ?? 0))
  if (isUnchanged) {
    return prevLayout
  }

  // Now distribute applied delta to panels in the other direction
  const growPivotIndex = adjustedDelta < 0 ? secondPivotIndex : firstPivotIndex
  const prevGrowSize = initialLayout[growPivotIndex] ?? 0
  const unsafeGrowSize = prevGrowSize + deltaApplied
  const safeGrowSize = validatePanelSize({
    overrideDisabledPanels,
    panelConstraints: panelConstraints[growPivotIndex] ?? {},
    prevSize: prevGrowSize,
    size: unsafeGrowSize,
  })

  nextLayout[growPivotIndex] = safeGrowSize

  if (!layoutNumbersEqual(safeGrowSize, unsafeGrowSize)) {
    let deltaRemaining = unsafeGrowSize - safeGrowSize
    let secondaryIndex = growPivotIndex

    while (secondaryIndex >= 0 && secondaryIndex < panelConstraints.length) {
      const prevSecondary = nextLayout[secondaryIndex] ?? 0
      const unsafeSecondary = prevSecondary + deltaRemaining
      const safeSecondary = validatePanelSize({
        overrideDisabledPanels,
        panelConstraints: panelConstraints[secondaryIndex] ?? {},
        prevSize: prevSecondary,
        size: unsafeSecondary,
      })

      if (!layoutNumbersEqual(prevSecondary, safeSecondary)) {
        deltaRemaining -= safeSecondary - prevSecondary
        nextLayout[secondaryIndex] = safeSecondary
      }

      if (layoutNumbersEqual(deltaRemaining, 0)) {
        break
      }

      if (adjustedDelta > 0) {
        secondaryIndex--
      } else {
        secondaryIndex++
      }
    }
  }

  const totalSize = nextLayout.reduce((acc, cur) => acc + cur, 0)
  if (!layoutNumbersEqual(totalSize, 100, 0.1)) {
    return prevLayout
  }

  return nextLayout.map(formatLayoutNumber)
}

export function calculateSeparatorAriaValues({
  layout,
  panelConstraints,
  panelIndex,
}: {
  layout: number[]
  panelConstraints: PanelConstraints[]
  panelIndex: number
}): {
  valueMin: number
  valueMax: number
  valueNow: number
} {
  const panelSize = layout[panelIndex] ?? 50
  const constraints = panelConstraints[panelIndex]

  if (!constraints || layout.length !== panelConstraints.length) {
    return {
      valueMin: 0,
      valueMax: 100,
      valueNow: formatLayoutNumber(panelSize),
    }
  }

  const maxSize = constraints.maxSize ?? 100
  const minSize = constraints.collapsible
    ? (constraints.collapsedSize ?? 0)
    : (constraints.minSize ?? 0)

  const pivotIndices: [number, number] = [panelIndex, panelIndex + 1]

  const minLayout = validatePanelGroupLayout({
    layout: adjustLayoutByDelta({
      delta: minSize - panelSize,
      initialLayout: layout,
      panelConstraints,
      pivotIndices,
      prevLayout: layout,
    }),
    panelConstraints,
  })

  const maxLayout = validatePanelGroupLayout({
    layout: adjustLayoutByDelta({
      delta: maxSize - panelSize,
      initialLayout: layout,
      panelConstraints,
      pivotIndices,
      prevLayout: layout,
    }),
    panelConstraints,
  })

  return {
    valueMin: formatLayoutNumber(minLayout[panelIndex] ?? minSize),
    valueMax: formatLayoutNumber(maxLayout[panelIndex] ?? maxSize),
    valueNow: formatLayoutNumber(panelSize),
  }
}

export function validateLayout(value: unknown, expectedPanelCount?: number): { valid: boolean; error?: string } {
  if (!Array.isArray(value)) {
    return { valid: false, error: 'Splitter `value` must be an array of numbers.' }
  }

  if (expectedPanelCount !== undefined && value.length !== expectedPanelCount) {
    return {
      valid: false,
      error: `Splitter value length (${value.length}) does not match Panel count (${expectedPanelCount}).`,
    }
  }

  for (let i = 0; i < value.length; i++) {
    const v = value[i]
    if (typeof v !== 'number' || Number.isNaN(v) || !Number.isFinite(v) || v < 0) {
      return {
        valid: false,
        error: `Splitter value at index ${i} (${v}) must be a finite non-negative percentage.`,
      }
    }
  }

  const total = value.reduce((sum, v) => sum + v, 0)
  if (!layoutNumbersEqual(total, 100, 0.1)) {
    return {
      valid: false,
      error: `Splitter value entries must sum to 100%, but received total of ${total.toFixed(2)}%.`,
    }
  }

  return { valid: true }
}

export function validatePanelConstraints(
  constraints: Array<{
    id?: string
    min?: number | string
    max?: number | string
    collapsible?: boolean
    collapsedSize?: number
  }>
): { valid: boolean; error?: string } {
  let minSum = 0

  for (let i = 0; i < constraints.length; i++) {
    const c = constraints[i]!
    if (typeof c.min === 'number') {
      if (!Number.isFinite(c.min) || c.min < 0) {
        return { valid: false, error: `Panel at index ${i} has invalid min constraint: ${c.min}` }
      }
    }
    if (typeof c.max === 'number') {
      if (!Number.isFinite(c.max) || c.max < 0) {
        return { valid: false, error: `Panel at index ${i} has invalid max constraint: ${c.max}` }
      }
    }
    if (typeof c.min === 'number' && typeof c.max === 'number' && c.min > c.max) {
      return {
        valid: false,
        error: `Panel at index ${i} has min (${c.min}) greater than max (${c.max}).`,
      }
    }
    if (c.collapsedSize !== undefined) {
      if (!Number.isFinite(c.collapsedSize) || c.collapsedSize < 0 || c.collapsedSize > 100) {
        return {
          valid: false,
          error: `Panel at index ${i} has invalid collapsedSize: ${c.collapsedSize}`,
        }
      }
      if (typeof c.max === 'number' && c.collapsedSize > c.max) {
        return {
          valid: false,
          error: `Panel at index ${i} has collapsedSize (${c.collapsedSize}) greater than max (${c.max}).`,
        }
      }
    }
    if (typeof c.min === 'string') {
      if (!isMeasuredLength(c.min)) {
        return { valid: false, error: `Panel at index ${i} has invalid measured min length: ${c.min}` }
      }
    }
    if (typeof c.max === 'string') {
      if (!isMeasuredLength(c.max)) {
        return { valid: false, error: `Panel at index ${i} has invalid measured max length: ${c.max}` }
      }
    }

    if (typeof c.min === 'number') {
      minSum += c.min
    }
  }

  if (minSum > 100) {
    return {
      valid: false,
      error: `Sum of panel minimum sizes (${minSum}) exceeds 100%.`,
    }
  }

  return { valid: true }
}

export function parseCssLengthToPx(
  lengthStr: string,
  element?: HTMLElement | null
): number | null {
  const trimmed = lengthStr.trim()
  const match = trimmed.match(/^([+-]?\d*(?:\.\d+)?)\s*([a-z%]+)?$/i)
  if (!match) return null

  const value = parseFloat(match[1] || '0')
  const unit = (match[2] || 'px').toLowerCase()

  switch (unit) {
    case 'px':
      return value
    case 'rem': {
      const rootFontSize =
        typeof document !== 'undefined'
          ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
          : 16
      return value * rootFontSize
    }
    case 'em': {
      const fontSize =
        element && typeof getComputedStyle !== 'undefined'
          ? parseFloat(getComputedStyle(element).fontSize) || 16
          : 16
      return value * fontSize
    }
    case 'r': {
      // Resolves through --spacing-root
      let spacingRootPx = 4
      if (element && typeof getComputedStyle !== 'undefined') {
        const customSpacing = getComputedStyle(element).getPropertyValue('--spacing-root')
        if (customSpacing) {
          const parsed = parseCssLengthToPx(customSpacing, element)
          if (parsed != null) spacingRootPx = parsed
        }
      }
      return value * spacingRootPx
    }
    default:
      return null
  }
}

export function resolveConstraintToPercentage(
  constraint: number | string | undefined,
  availableGroupSize: number,
  element?: HTMLElement | null,
  defaultValue = 0
): number {
  if (constraint === undefined) return defaultValue
  if (typeof constraint === 'number') return constraint

  const trimmed = constraint.trim()
  if (trimmed.endsWith('%')) {
    const pct = parseFloat(trimmed)
    return Number.isFinite(pct) ? pct : defaultValue
  }

  if (availableGroupSize <= 0) return defaultValue

  const px = parseCssLengthToPx(trimmed, element)
  if (px == null || px < 0) return defaultValue

  return formatLayoutNumber((px / availableGroupSize) * 100)
}

// FEATURES #3/#9 seam: the measured-length grammar the validator and the
// resolver agree on. Unitless zero is valid CSS and resolves to 0; units are
// case-insensitive like the resolver; anything else is a parse failure the
// component answers with a dev diagnostic plus the default bound.
export function isMeasuredLength(value: string): boolean {
  const trimmed = value.trim()
  if (/^0(\.0+)?$/.test(trimmed)) return true
  return /^(\d+(\.\d+)?)(px|r|rem|em|%)$/i.test(trimmed)
}

export type SplitterStructurePart = 'panel' | 'handle'

// FEATURES #9: strict structural validation over merged document order.
// Pure (the caller merges registrations by document position), so the
// message wording is unit-pinned and the component only decides severity.
// Message wording is a DRAFT for the HQ wording check (FEATURES #6).
export function validateSplitterStructure(
  sequence: SplitterStructurePart[],
  valueLength: number
): { valid: boolean; error?: string } {
  const panelCount = sequence.filter((part) => part === 'panel').length
  const handleCount = sequence.length - panelCount

  if (panelCount === 0) {
    return {
      valid: false,
      error:
        'Invalid structure: a Splitter needs at least two Panels, but none are mounted. ' +
        'Render Panel (Handle Panel)+ with a matching value array.',
    }
  }
  if (panelCount === 1) {
    return {
      valid: false,
      error:
        'Invalid structure: a Splitter needs at least two Panels, but only one is mounted. ' +
        'One-Panel trees are not supported — "the rest of the page" is another Panel.',
    }
  }
  if (valueLength !== panelCount) {
    return {
      valid: false,
      error:
        `Invalid structure: value has ${valueLength} ${valueLength === 1 ? 'entry' : 'entries'} ` +
        `but ${panelCount} Panels are mounted. Update Panels and value entries atomically in the same render.`,
    }
  }
  if (handleCount !== panelCount - 1) {
    return {
      valid: false,
      error:
        `Invalid structure: ${panelCount} Panels need exactly ${panelCount - 1} ` +
        `${panelCount - 1 === 1 ? 'Handle' : 'Handles'}, but ${handleCount} ` +
        `${handleCount === 1 ? 'is' : 'are'} mounted. Handles sit between Panels: Panel (Handle Panel)+.`,
    }
  }
  for (let i = 0; i < sequence.length; i++) {
    const expected: SplitterStructurePart = i % 2 === 0 ? 'panel' : 'handle'
    if (sequence[i] !== expected) {
      return {
        valid: false,
        error:
          'Invalid structure: Panels and Handles must strictly alternate from Panel to Panel, ' +
          `but mounted order is "${sequence.join(' → ')}".`,
      }
    }
  }
  return { valid: true }
}

// FEATURES #7: a Handle is blocked when no full-range delta in either
// direction moves the layout — definitionally the same solver the gesture
// would run, so aria-disabled always matches actual infeasibility.
export function isHandleBlocked({
  layout,
  panelConstraints,
  handleIndex,
}: {
  layout: number[]
  panelConstraints: PanelConstraints[]
  handleIndex: number
}): boolean {
  if (handleIndex < 0 || handleIndex >= layout.length - 1) return true
  if (layout.length !== panelConstraints.length) return true
  const pivotIndices: [number, number] = [handleIndex, handleIndex + 1]
  for (const delta of [100, -100]) {
    const candidate = adjustLayoutByDelta({
      delta,
      initialLayout: layout,
      panelConstraints,
      pivotIndices,
      prevLayout: layout,
      trigger: 'mouse-or-touch',
    })
    if (candidate.some((entry, i) => !layoutNumbersEqual(entry, layout[i] ?? 0))) {
      return false
    }
  }
  return true
}

// FEATURES #8: the drag/convert denominator — available group size, i.e. the
// Panel-axis sum with Handles excluded. Measured as the container content
// box minus each Handle's flex footprint (border box plus axis margins, so
// negative-margin overlap counts as the space it really takes). In the
// no-overlap model this equals the panel-box sum exactly (516 − 16 = 500);
// reading panel boxes directly would inherit engine-dependent sub-pixel
// rounding instead. Zero when unmeasurable: callers defer, never divide.
export function measureAvailableGroupSize({
  container,
  handles,
  orientation,
}: {
  container: HTMLElement | null
  handles: Array<HTMLElement | null>
  orientation: 'horizontal' | 'vertical'
}): number {
  if (!container || typeof getComputedStyle === 'undefined') return 0
  const horizontal = orientation === 'horizontal'
  const toPx = (value: string): number => {
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }
  const rect = container.getBoundingClientRect()
  const style = getComputedStyle(container)
  const box = horizontal
    ? rect.width -
      toPx(style.borderLeftWidth) -
      toPx(style.borderRightWidth) -
      toPx(style.paddingLeft) -
      toPx(style.paddingRight)
    : rect.height -
      toPx(style.borderTopWidth) -
      toPx(style.borderBottomWidth) -
      toPx(style.paddingTop) -
      toPx(style.paddingBottom)
  let footprints = 0
  for (const handle of handles) {
    if (!handle) continue
    const handleStyle = getComputedStyle(handle)
    footprints += horizontal
      ? handle.offsetWidth + toPx(handleStyle.marginLeft) + toPx(handleStyle.marginRight)
      : handle.offsetHeight + toPx(handleStyle.marginTop) + toPx(handleStyle.marginBottom)
  }
  const available = box - footprints
  return available > 0 ? available : 0
}

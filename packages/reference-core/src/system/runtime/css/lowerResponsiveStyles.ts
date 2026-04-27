type ResponsiveStyleObject = Record<string, unknown>

/**
 * Lower Reference UI-owned responsive sugar into plain container-query style
 * objects before delegating to Panda's generated runtime.
 *
 * This mirrors the virtual lowering for anonymous numeric `r` breakpoints so
 * runtime css() consumers and Panda extraction observe the same style shape.
 * Named-container behavior remains owned by primitive/pattern `r`, not by this
 * utility-layer sugar.
 */
export function lowerResponsiveStyles<T>(styles: T): T {
  if (Array.isArray(styles)) {
    return styles.map(style => lowerResponsiveStyles(style)) as T
  }

  if (!isStyleObject(styles)) {
    return styles
  }

  return lowerStyleObject(styles) as T
}

function lowerStyleObject<T extends ResponsiveStyleObject>(styles: T): T {
  let changed = false
  const loweredEntries: Array<[string, unknown]> = []

  for (const [key, value] of Object.entries(styles)) {
    if (key === 'r') {
      const responsiveEntries = lowerResponsiveProperty(value)
      if (responsiveEntries) {
        loweredEntries.push(...responsiveEntries)
        changed = true
        continue
      }
    }

    const nextValue = isStyleObject(value) ? lowerStyleObject(value) : value

    if (nextValue !== value) {
      changed = true
    }

    loweredEntries.push([key, nextValue])
  }

  if (!changed) {
    return styles
  }

  return Object.fromEntries(loweredEntries) as T
}

function lowerResponsiveProperty(value: unknown): Array<[string, unknown]> | null {
  if (!isStyleObject(value)) {
    return null
  }

  const lowered: Array<[string, unknown]> = []

  for (const [breakpoint, styles] of Object.entries(value)) {
    const width = normalizeBreakpointWidth(breakpoint)

    if (!width || !isStyleObject(styles)) {
      // Keep unsupported shapes on the original path rather than partially
      // rewriting them into a different runtime contract.
      return null
    }

    lowered.push([
      `@container (min-width: ${width}px)`,
      lowerStyleObject(styles),
    ])
  }

  return lowered.length > 0 ? lowered : null
}

function normalizeBreakpointWidth(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  return Number.isFinite(Number(trimmed)) ? trimmed : null
}

function isStyleObject(value: unknown): value is ResponsiveStyleObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
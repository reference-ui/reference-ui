/**
 * Thumb presentation decisions: resolveThumbZIndex stacks the most recently
 * active thumb above a direct stack (lower index above when none is active),
 * resolveDefaultAriaLabel names thumbs by convention, and resolveAriaValueText
 * applies the authored-format precedence chain. Pure so the render path and
 * the tests share one implementation.
 */

export function resolveThumbZIndex(args: {
  activeThumbIndex: number | null
  index: number
  thumbCount: number
}): number {
  const { activeThumbIndex, index, thumbCount } = args
  if (activeThumbIndex === index) return 2
  if (activeThumbIndex === null) return Math.max(1, thumbCount - index)
  return 1
}

export function resolveDefaultAriaLabel(args: {
  thumbCount: number
  index: number
}): string | undefined {
  const { thumbCount, index } = args
  if (thumbCount === 2) return index === 0 ? 'Minimum' : 'Maximum'
  if (thumbCount > 2) return `Value ${index + 1} of ${thumbCount}`
  return undefined
}

export function resolveAriaValueText(args: {
  authoredAriaValueText: string | undefined
  authoredValueText: string | undefined
  authoredAriaNow: number | undefined
  formatValue: ((value: number) => string) | undefined
  ariaNow: number
}): string | undefined {
  const { authoredAriaValueText, authoredValueText, authoredAriaNow, formatValue, ariaNow } = args
  return (
    authoredAriaValueText ??
    authoredValueText ??
    (authoredAriaNow !== undefined ? undefined : formatValue ? formatValue(ariaNow) : undefined)
  )
}

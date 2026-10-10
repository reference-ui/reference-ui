/**
 * Slider.Range: the filled span between the extreme thumbs (or min to value
 * for a single thumb). It reads geometry from context, registers itself so
 * the root can enforce at-most-one, and paints no interaction of its own —
 * pointer events pass straight through to the track.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { SliderContext } from '../context'
import type { SliderRangeProps } from '../types'
import { valueToPercent } from '../math/slider-math'

export const SliderRange = React.forwardRef<HTMLDivElement, SliderRangeProps>(
  function SliderRange(
    {
      className,
      style,
      ...props
    },
    forwardedRef
  ) {
    const context = React.useContext(SliderContext)
    const registerRange = context?.registerRange

    const handleRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        registerRange?.(node)
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          ;(forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [registerRange, forwardedRef]
    )

    if (!context) return null

    const { values, min, max, orientation, isRtl } = context
    const startVal = values.length > 1 ? Math.min(...values) : min
    const endVal = values.length > 1 ? Math.max(...values) : values[0] ?? min

    const startPercent = valueToPercent(startVal, min, max)
    const endPercent = valueToPercent(endVal, min, max)
    const sizePercent = endPercent - startPercent

    const isHorizontal = orientation === 'horizontal'

    return (
      <Div
        ref={handleRef}
        data-reference-slider-range=""
      position="absolute"
      bg="ui.progress.bar.foreground"
      borderRadius="full"
      pointerEvents="none"
      className={className}
      style={{
        left: isHorizontal ? (isRtl ? undefined : `${startPercent}%`) : 0,
        right: isHorizontal && isRtl ? `${startPercent}%` : undefined,
        bottom: !isHorizontal ? `${startPercent}%` : undefined,
        top: isHorizontal ? 0 : undefined,
        width: isHorizontal ? `${sizePercent}%` : '100%',
        height: isHorizontal ? '100%' : `${sizePercent}%`,
        ['--reference-slider-range-start' as any]: `${startPercent}%`,
        ['--reference-slider-range-end' as any]: `${endPercent}%`,
        ...style,
      }}
      {...props}
    />
    )
  }
)

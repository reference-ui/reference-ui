/**
 * Slider.Track: the clickable rail thumbs ride on. It registers itself as
 * the geometry authority, resolves pointer-down positions to snapped values
 * through the track-choice module, and hands the chosen thumb to the root's
 * pointer session. Renders nothing but the rail — thumbs are children.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { trackBackground, sliderTrack } from '../../../core/theme/primitives/shared'
import { SliderContext } from '../context'
import type { SliderTrackProps } from '../types'
import { chooseTrackThumb, pointerToSnappedValue } from '../interaction/track-choice'

export const SliderTrack = React.forwardRef<HTMLDivElement, SliderTrackProps>(
  function SliderTrack(
    {
      children,
      className,
      style,
      onPointerDown,
      ...props
    },
    forwardedRef
  ) {
    const context = React.useContext(SliderContext)
    const orientation = context?.orientation ?? 'horizontal'
    const isHorizontal = orientation === 'horizontal'

    const handleRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        if (context) {
          context.registerTrack(node)
          ;(context.trackRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          ;(forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [context, forwardedRef]
    )

    const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(e)
      if (!context || e.defaultPrevented || context.disabled) return
      if (e.button !== 0 || (e.isPrimary !== undefined && !e.isPrimary)) return

      const {
        trackRef,
        startPointerDrag,
        values,
        min,
        max,
        step,
        minStepsBetweenThumbs,
        isRtl,
        activeThumbIndex,
      } = context

      const trackEl = trackRef.current
      if (!trackEl) return

      const rect = trackEl.getBoundingClientRect()
      const snapped = pointerToSnappedValue({
        clientX: e.clientX,
        clientY: e.clientY,
        rect,
        orientation,
        isRtl,
        min,
        max,
        step,
      })
      if (snapped === null) return

      const chosenIndex = chooseTrackThumb({
        values,
        snapped,
        min,
        max,
        step,
        minStepsBetweenThumbs,
        activeThumbIndex,
      })

      startPointerDrag(e, chosenIndex, false)
    }

    return (
      <Div
        ref={handleRef}
        data-reference-slider-track=""
        data-orientation={orientation}
        position="relative"
        flexGrow={isHorizontal ? 1 : 0}
        flexShrink={0}
        borderRadius="full"
        height={isHorizontal ? sliderTrack.height : '100%'}
        width={orientation === 'vertical' ? sliderTrack.height : '100%'}
        className={className}
        onPointerDown={handleTrackPointerDown}
        style={{
          height: isHorizontal ? sliderTrack.heightPx : '100%',
          width: orientation === 'vertical' ? sliderTrack.heightPx : '100%',
          background: trackBackground,
          backgroundColor: trackBackground,
          ...style,
        }}
        {...props}
      >
        {children}
      </Div>
    )
  }
)

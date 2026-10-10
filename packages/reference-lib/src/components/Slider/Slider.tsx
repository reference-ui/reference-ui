/**
 * Slider root: a controlled single or multi-thumb slider that composes the
 * direction, registry, value-request, pointer-drag, and keyboard hooks, then
 * publishes them as context for Track, Range, and Thumb. It owns the
 * configuration validation, the track/range singleton registries, the disable
 * teardown, and the window pointer listeners; every other behavior lives in
 * its hook. Default children render a complete track with range and thumbs.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { validateSliderConfig } from './math/slider-math'
import { SliderContext, type SliderContextValue } from './context'
import type { SliderProps, SliderValue } from './types'
import { isProductionEnv, warnSlider } from './shared/warn'
import { useDirection } from './hooks/use-direction'
import { useThumbRegistry } from './hooks/use-thumb-registry'
import { useValueRequest } from './hooks/use-value-request'
import { usePointerDrag } from './hooks/use-pointer-drag'
import { useKeyboard } from './hooks/use-keyboard'
import { SliderTrack } from './parts/Track'
import { SliderRange } from './parts/Range'
import { SliderThumb } from './parts/Thumb'

export type {
  SliderOrientation,
  SliderProps,
  SliderRangeProps,
  SliderThumbProps,
  SliderTrackProps,
  SliderValue,
} from './types'
export { SliderTrack, SliderRange, SliderThumb }

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  function Slider(
    {
      children,
      value: valueProp,
      min = 0,
      max = 100,
      step = 1,
      minStepsBetweenThumbs = 0,
      orientation = 'horizontal',
      disabled = false,
      onChange,
      onChangeEnd,
      className,
      style,
      onPointerDown,
      ...props
    },
    ref
  ) {
    const currentValue = valueProp

    // Fail fast on malformed configuration before any ARIA or CSS publishes.
    validateSliderConfig({
      min,
      max,
      step,
      minStepsBetweenThumbs,
      value: currentValue,
    })

    const isRange = Array.isArray(currentValue)
    const values = React.useMemo(() => {
      if (Array.isArray(currentValue)) return [...currentValue]
      return [typeof currentValue === 'number' ? currentValue : min]
    }, [currentValue, min])

    // W-35 clamp-or-warn: an out-of-range controlled value clamps (render +
    // ARIA agree — see the B-29 ariaNow clamp in SliderThumb) AND dev-warns
    // naming component, prop, value, and valid range. Clamp-silently matches
    // Radix/RAC/native; the dev warning is our addition.
    if (!isProductionEnv()) {
      values.forEach((entry, entryIndex) => {
        if (entry < min || entry > max) {
          warnSlider(
            `value${isRange ? ` at index ${entryIndex}` : ''} (${entry}) is outside [${min}, ${max}]; rendering and ARIA are clamped to the range.`
          )
        }
      })
    }

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const trackRef = React.useRef<HTMLDivElement | null>(null)

    const registeredTrackNodeRef = React.useRef<HTMLDivElement | null>(null)
    const registerTrack = React.useCallback((node: HTMLDivElement | null) => {
      if (node) {
        if (registeredTrackNodeRef.current && registeredTrackNodeRef.current !== node) {
          throw new Error('[Slider] Exactly one Slider.Track is permitted, found duplicate')
        }
        registeredTrackNodeRef.current = node
      } else {
        registeredTrackNodeRef.current = null
      }
    }, [])

    const registeredRangeNodeRef = React.useRef<HTMLDivElement | null>(null)
    const registerRange = React.useCallback((node: HTMLDivElement | null) => {
      if (node) {
        if (registeredRangeNodeRef.current && registeredRangeNodeRef.current !== node) {
          throw new Error('[Slider] At most one Slider.Range is permitted, found duplicate')
        }
        registeredRangeNodeRef.current = node
      } else {
        registeredRangeNodeRef.current = null
      }
    }, [])

    const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null)
    const [focusVisibleIndex, setFocusVisibleIndex] = React.useState<number | null>(null)
    const [activeThumbIndex, setActiveThumbIndex] = React.useState<number | null>(null)

    const isRtl = useDirection(rootRef)
    const registry = useThumbRegistry()
    const valueApi = useValueRequest(
      {
        min,
        max,
        step,
        minStepsBetweenThumbs,
        orientation,
        disabled,
        isRange,
        values,
        onChange,
        onChangeEnd,
      },
      currentValue
    )
    const drag = usePointerDrag({
      values,
      min,
      max,
      orientation,
      disabled,
      isRtl,
      trackRef,
      registry,
      valueApi,
      setDraggingIndex,
      setActiveThumbIndex,
      setFocusVisibleIndex,
    })
    const keyboard = useKeyboard({
      disabled,
      isRtl,
      registry,
      valueApi,
      isPointerActive: drag.isPointerActive,
      setFocusVisibleIndex,
      setActiveThumbIndex,
    })

    const registerThumb = React.useCallback(
      (id: number, node: HTMLDivElement | null) => {
        if (node) {
          registry.setThumbNode(id, node)
        } else {
          // Resolve before delete: removing the dragged thumb invalidates
          // its session with no end report.
          const removedIndex = registry.getThumbIndex(id)
          registry.removeThumbNode(id)
          if (removedIndex === drag.getActiveDragIndex()) {
            drag.cancelPointerSession()
          }
        }
      },
      [
        registry.setThumbNode,
        registry.getThumbIndex,
        registry.removeThumbNode,
        drag.getActiveDragIndex,
        drag.cancelPointerSession,
      ]
    )

    // Disabling cancels every active interaction without an end report.
    React.useEffect(() => {
      if (disabled) {
        drag.cancelPointerSession()
        keyboard.resetKeySession()
        setFocusVisibleIndex(null)
      }
    }, [disabled, drag.cancelPointerSession, keyboard.resetKeySession])

    React.useEffect(() => {
      const onLostCapture = () => {
        if (drag.isPointerActive()) {
          drag.cancelPointerSession()
        }
      }
      const onBlur = () => {
        if (drag.isPointerActive()) {
          drag.cancelPointerSession()
        }
        keyboard.resetKeySession()
      }

      window.addEventListener('pointermove', drag.handlePointerMove)
      window.addEventListener('pointerup', drag.handlePointerUp)
      window.addEventListener('pointercancel', drag.handlePointerCancel)
      window.addEventListener('lostpointercapture', onLostCapture)
      window.addEventListener('blur', onBlur)

      return () => {
        window.removeEventListener('pointermove', drag.handlePointerMove)
        window.removeEventListener('pointerup', drag.handlePointerUp)
        window.removeEventListener('pointercancel', drag.handlePointerCancel)
        window.removeEventListener('lostpointercapture', onLostCapture)
        window.removeEventListener('blur', onBlur)
      }
    }, [
      drag.handlePointerMove,
      drag.handlePointerUp,
      drag.handlePointerCancel,
      drag.cancelPointerSession,
      drag.isPointerActive,
      keyboard.resetKeySession,
    ])

    const contextValue = React.useMemo<SliderContextValue>(
      () => ({
        values,
        min,
        max,
        step,
        minStepsBetweenThumbs,
        orientation,
        disabled,
        isRtl,
        draggingIndex,
        focusVisibleIndex,
        activeThumbIndex,
        trackRef,
        registerTrack,
        registerRange,
        claimThumbId: registry.claimThumbId,
        registerThumb,
        getThumbIndex: registry.getThumbIndex,
        startPointerDrag: drag.startPointerDrag,
        handleThumbKeyDown: keyboard.handleThumbKeyDown,
        handleThumbKeyUp: keyboard.handleThumbKeyUp,
        handleThumbFocus: keyboard.handleThumbFocus,
        handleThumbBlur: keyboard.handleThumbBlur,
        setFocusVisibleIndex,
      }),
      [
        values,
        min,
        max,
        step,
        minStepsBetweenThumbs,
        orientation,
        disabled,
        isRtl,
        draggingIndex,
        focusVisibleIndex,
        activeThumbIndex,
        registerTrack,
        registerRange,
        registry.claimThumbId,
        registerThumb,
        registry.getThumbIndex,
        registry.version,
        drag.startPointerDrag,
        keyboard.handleThumbKeyDown,
        keyboard.handleThumbKeyUp,
        keyboard.handleThumbFocus,
        keyboard.handleThumbBlur,
      ]
    )

    const isHorizontal = orientation === 'horizontal'

    const handleRootRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [ref]
    )

    return (
      <SliderContext.Provider value={contextValue}>
        <Div
          ref={handleRootRef}
          data-reference-slider=""
          data-orientation={orientation}
          data-disabled={disabled ? '' : undefined}
          data-dragging={draggingIndex !== null ? '' : undefined}
          position="relative"
          display="flex"
          flexDirection={isHorizontal ? 'row' : 'column'}
          alignItems="center"
          justifyContent="center"
          userSelect="none"
          touchAction="none"
          cursor={disabled ? 'not-allowed' : 'pointer'}
          onPointerDown={onPointerDown}
          width={isHorizontal ? '100%' : '6r'}
          height={isHorizontal ? '6r' : '100%'}
          className={className}
          style={style}
          {...props}
        >
          {children ?? (
            <SliderTrack>
              <SliderRange />
              {values.map((_, i) => (
                <SliderThumb key={i} />
              ))}
            </SliderTrack>
          )}
        </Div>
      </SliderContext.Provider>
    )
  }
) as unknown as (<T extends SliderValue = SliderValue>(
  props: SliderProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement | null) & {
  Track: typeof SliderTrack
  Range: typeof SliderRange
  Thumb: typeof SliderThumb
}

Slider.Track = SliderTrack
Slider.Range = SliderRange
Slider.Thumb = SliderThumb

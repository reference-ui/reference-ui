import * as React from 'react'
import { Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import {
  focusRing,
  focusRingStyles,
  pressableActiveStyles,
  trackBackground,
  sliderTrack,
  sliderThumb,
} from '../../core/theme/primitives/shared'
import { isFocusVisible } from '../../core/theme/primitives/forms/focus-visible'
import {
  validateSliderConfig,
  snapValueToStep,
  stepValue,
  getPageStep,
  getThumbBounds,
  valueToPercent,
} from './slider-math'

export type SliderOrientation = 'horizontal' | 'vertical'
export type SliderValue = number | number[]

export type SliderProps<T extends SliderValue = SliderValue> = Omit<PrimitiveProps<'div'>, 'onChange' | 'defaultValue'> & {
  value?: T
  defaultValue?: T
  min?: number
  max?: number
  step?: number
  minStepsBetweenThumbs?: number
  orientation?: SliderOrientation
  disabled?: boolean
  onChange?: (value: T) => void
  onChangeEnd?: (value: T) => void
}

interface SliderContextValue {
  values: number[]
  min: number
  max: number
  step: number
  minStepsBetweenThumbs: number
  orientation: SliderOrientation
  disabled: boolean
  isRtl: boolean
  draggingIndex: number | null
  focusVisibleIndex: number | null
  activeThumbIndex: number | null
  trackRef: React.RefObject<HTMLDivElement | null>
  registerTrack: (node: HTMLDivElement | null) => void
  registerRange: (node: HTMLDivElement | null) => void
  registerThumb: (index: number, node: HTMLDivElement | null) => void
  startPointerDrag: (
    e: React.PointerEvent<HTMLDivElement>,
    targetIndex: number,
    fromThumb: boolean
  ) => void
  handleThumbKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void
  handleThumbKeyUp: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void
  handleThumbFocus: (e: React.FocusEvent<HTMLDivElement>, index: number) => void
  handleThumbBlur: (e: React.FocusEvent<HTMLDivElement>, index: number) => void
  setFocusVisibleIndex: (index: number | null) => void
}

const SliderContext = React.createContext<SliderContextValue | null>(null)

export type SliderTrackProps = PrimitiveProps<'div'>

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
      if (isHorizontal && rect.width === 0) return
      if (!isHorizontal && rect.height === 0) return

      let clickPercent: number
      if (isHorizontal) {
        clickPercent = isRtl
          ? (rect.right - e.clientX) / rect.width
          : (e.clientX - rect.left) / rect.width
      } else {
        clickPercent = (rect.bottom - e.clientY) / rect.height
      }
      clickPercent = Math.max(0, Math.min(1, clickPercent))
      const rawVal = min + clickPercent * (max - min)
      const snapped = snapValueToStep(rawVal, min, max, step)

      // Frozen tie rule: nearest movable thumb; ties choose the most recently
      // active thumb, then the lower DOM index.
      let chosenIndex = 0
      if (values.length > 1) {
        const candidates: { index: number; dist: number; movable: boolean }[] = []
        for (let i = 0; i < values.length; i++) {
          const bounds = getThumbBounds(values, i, min, max, step, minStepsBetweenThumbs)
          const cur = values[i]
          let movable = false
          if (snapped > cur && cur < bounds.max) movable = true
          else if (snapped < cur && cur > bounds.min) movable = true
          else if (snapped === cur) movable = true

          candidates.push({
            index: i,
            dist: Math.abs(cur - snapped),
            movable,
          })
        }

        const movableCandidates = candidates.filter(c => c.movable)
        const pool = movableCandidates.length > 0 ? movableCandidates : candidates

        let minDist = Infinity
        for (const c of pool) {
          if (c.dist < minDist) minDist = c.dist
        }
        const closest = pool.filter(c => Math.abs(c.dist - minDist) < 1e-9)

        if (
          activeThumbIndex !== null &&
          closest.some(c => c.index === activeThumbIndex)
        ) {
          chosenIndex = activeThumbIndex
        } else {
          chosenIndex = closest[0].index
        }
      }

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

export type SliderRangeProps = PrimitiveProps<'div'>

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

export type SliderThumbProps = PrimitiveProps<'div'> & {
  index?: number
  valueText?: string
  formatValue?: (value: number) => string
}

export function SliderThumb({
  index = 0,
  valueText,
  formatValue,
  className,
  style,
  onKeyDown,
  onKeyUp,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: SliderThumbProps) {
  const context = React.useContext(SliderContext)
  if (!context) return null

  const {
    values,
    min,
    max,
    orientation,
    disabled,
    isRtl,
    draggingIndex,
    focusVisibleIndex,
    activeThumbIndex,
    registerThumb,
    startPointerDrag,
    handleThumbKeyDown,
    handleThumbKeyUp,
    handleThumbFocus,
    handleThumbBlur,
    setFocusVisibleIndex,
  } = context
  const [localFocusVisible, setLocalFocusVisible] = React.useState(false)
  const isFocusVisibleManaged =
    focusVisibleIndex !== undefined
      ? focusVisibleIndex === index
      : localFocusVisible

  const val = values[index] ?? min
  const percent = valueToPercent(val, min, max)
  const isHorizontal = orientation === 'horizontal'
  const [isThumbPressed, setIsThumbPressed] = React.useState(false)
  const isDragging = draggingIndex === index
  const isActive = isDragging || isThumbPressed

  // Keep retained local pressed/focus state coherent with the owned session:
  // every session end (release, cancel, disable, unmount) clears draggingIndex.
  React.useEffect(() => {
    if (draggingIndex !== index) {
      setIsThumbPressed(false)
    }
  }, [draggingIndex, index])
  React.useEffect(() => {
    setLocalFocusVisible(focusVisibleIndex === index)
  }, [focusVisibleIndex, index])

  const setThumbRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      registerThumb(index, node)
    },
    [registerThumb, index]
  )

  // Out-of-range thumbs render global bounds so no ARIA attribute ever
  // contains NaN; the count mismatch itself throws when interaction begins.
  const inRange = index >= 0 && index < values.length
  const thumbBounds = inRange
    ? getThumbBounds(values, index, min, max, context.step, context.minStepsBetweenThumbs)
    : { min, max }
  const thumbMin = thumbBounds.min
  const thumbMax = thumbBounds.max

  // The most recently active thumb paints on top so a direct stack press hits
  // the tie-rule winner; with no active thumb the lower index paints above.
  let zIndex = 1
  if (activeThumbIndex === index) {
    zIndex = 2
  } else if (activeThumbIndex === null) {
    zIndex = Math.max(1, values.length - index)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled) return
    handleThumbKeyDown(e, index)
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyUp?.(e)
    if (e.defaultPrevented || disabled) return
    handleThumbKeyUp(e, index)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (e.defaultPrevented || disabled) return
    if (e.button !== 0 || (e.isPrimary !== undefined && !e.isPrimary)) return
    e.stopPropagation()
    setIsThumbPressed(true)
    startPointerDrag(e, index, true)
  }

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    props.onFocus?.(e)
    if (e.defaultPrevented) return
    handleThumbFocus(e, index)
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    props.onBlur?.(e)
    if (e.defaultPrevented) return
    handleThumbBlur(e, index)
  }

  // Consumer move/up handlers stay attached to the element; internal drag
  // math runs on owned window listeners so drags survive leaving the track.
  const handleConsumerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
  }

  const handleConsumerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(e)
  }

  const defaultAriaLabel =
    values.length === 2
      ? index === 0
        ? 'Minimum'
        : 'Maximum'
      : values.length > 2
      ? `Value ${index + 1} of ${values.length}`
      : undefined

  const ariaValueText =
    props['aria-valuetext'] ??
    valueText ??
    (props['aria-valuenow'] !== undefined
      ? undefined
      : formatValue
      ? formatValue(val)
      : undefined)

  return (
    <Div
      ref={setThumbRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={props['aria-label'] ?? defaultAriaLabel}
      aria-valuemin={thumbMin}
      aria-valuemax={thumbMax}
      aria-valuenow={val}
      aria-valuetext={ariaValueText}
      aria-orientation={orientation}
      aria-disabled={disabled ? true : undefined}
      data-reference-slider-thumb=""
      data-orientation={orientation}
      data-disabled={disabled ? '' : undefined}
      data-active={isActive ? '' : undefined}
      data-focus-visible={!isActive && isFocusVisibleManaged ? '' : undefined}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handleConsumerPointerMove}
      onPointerUp={handleConsumerPointerUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      position="absolute"
      width={isHorizontal ? sliderThumb.length : sliderThumb.cross}
      height={isHorizontal ? sliderThumb.cross : sliderThumb.length}
      borderRadius={sliderThumb.borderRadius}
      bg="ui.progress.bar.foreground"
      boxShadow={isActive ? undefined : '0 1px 3px rgba(0,0,0,0.2)'}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      touchAction="none"
      transition="box-shadow 200ms ease, transform 200ms ease"
      _focusVisible={focusRing}
      className={className}
      style={{
        zIndex,
        width: isHorizontal ? sliderThumb.lengthPx : sliderThumb.crossPx,
        height: isHorizontal ? sliderThumb.crossPx : sliderThumb.lengthPx,
        borderRadius: sliderThumb.borderRadiusPx,
        boxShadow: isActive
          ? '0 0 0 4px color-mix(in oklch, var(--colors-ui-progress-bar-foreground, currentColor) 15.2%, transparent)'
          : undefined,
        outline: !isActive && isFocusVisibleManaged ? undefined : 'none',
        left: isHorizontal ? (isRtl ? undefined : `${percent}%`) : '50%',
        right: isHorizontal && isRtl ? `${percent}%` : undefined,
        bottom: !isHorizontal ? `${percent}%` : undefined,
        top: isHorizontal ? '50%' : undefined,
        transform: isHorizontal
          ? isRtl
            ? 'translate(50%, -50%)'
            : 'translate(-50%, -50%)'
          : 'translate(-50%, 50%)',
        ['--reference-slider-thumb-position' as any]: `${percent}%`,
        ...style,
      }}
      {...props}
    />
  )
}

function countMismatchMessage(valueLength: number, thumbCount: number): string {
  return (
    `[Slider] Value-to-Thumb count mismatch: value has ${valueLength} ` +
    `${valueLength === 1 ? 'entry' : 'entries'} but ${thumbCount} ` +
    `${thumbCount === 1 ? 'Thumb is' : 'Thumbs are'} registered`
  )
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  function Slider(
    {
      children,
      value: valueProp,
      defaultValue = 0,
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
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<SliderValue>(defaultValue)
    const currentValue = isControlled ? valueProp : internalValue

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

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const trackRef = React.useRef<HTMLDivElement | null>(null)
    const thumbNodesRef = React.useRef<Map<number, HTMLDivElement>>(new Map())

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

    // Owned-pointer session refs. Exactly one pointer owns a session; window
    // listeners drive it so drags survive leaving the track and viewport.
    const activePointerIdRef = React.useRef<number | null>(null)
    const activeDragIndexRef = React.useRef<number | null>(null)
    const sessionLengthRef = React.useRef<number | null>(null)
    const grabOffsetRef = React.useRef(0)
    const lastRequestedValueRef = React.useRef<SliderValue>(currentValue)
    const hasChangedInSessionRef = React.useRef(false)
    const hasChangedInKeySessionRef = React.useRef(false)
    const activeKeyRef = React.useRef<string | null>(null)

    const isControlledRef = React.useRef(isControlled)
    isControlledRef.current = isControlled

    const latestPropsRef = React.useRef({
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
    })
    latestPropsRef.current = {
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
    }

    const cancelPointerSession = React.useCallback(() => {
      activePointerIdRef.current = null
      activeDragIndexRef.current = null
      sessionLengthRef.current = null
      hasChangedInSessionRef.current = false
      setDraggingIndex(null)
    }, [])

    const registerThumb = React.useCallback(
      (index: number, node: HTMLDivElement | null) => {
        if (node) {
          thumbNodesRef.current.set(index, node)
        } else {
          thumbNodesRef.current.delete(index)
          // Removing the dragged thumb invalidates its session: no end report.
          if (index === activeDragIndexRef.current) {
            cancelPointerSession()
          }
        }
      },
      [cancelPointerSession]
    )

    // Inherited direction: an explicit dir ancestor wins, otherwise the
    // computed direction (which also crosses ShadowRoot boundaries).
    const [isRtl, setIsRtl] = React.useState(false)
    React.useLayoutEffect(() => {
      const rootNode = rootRef.current
      if (!rootNode) return
      const dirAttr = rootNode.closest('[dir]')?.getAttribute('dir')
      if (dirAttr) {
        setIsRtl(dirAttr.toLowerCase() === 'rtl')
      } else if (typeof window !== 'undefined') {
        const computed = window.getComputedStyle(rootNode).direction
        setIsRtl(computed === 'rtl')
      }
    })

    // Cardinality changes invalidate the active drag: the old release commits
    // nothing and later moves issue no stale request.
    React.useEffect(() => {
      if (
        sessionLengthRef.current !== null &&
        values.length !== sessionLengthRef.current
      ) {
        cancelPointerSession()
      }
    }, [values.length, cancelPointerSession])

    // Disabling cancels every active interaction without an end report.
    React.useEffect(() => {
      if (disabled) {
        cancelPointerSession()
        hasChangedInKeySessionRef.current = false
        activeKeyRef.current = null
        setFocusVisibleIndex(null)
      }
    }, [disabled, cancelPointerSession])

    // Snaps, neighbor-clamps, and requests a candidate; returns whether the
    // candidate differed. Tracks the last request for end-of-session summary.
    const requestThumbValue = React.useCallback((index: number, raw: number): boolean => {
      const {
        min: curMin,
        max: curMax,
        step: curStep,
        minStepsBetweenThumbs: curMinSteps,
        values: curValues,
        isRange: curIsRange,
        onChange: curOnChange,
      } = latestPropsRef.current
      if (index < 0 || index >= curValues.length) return false
      const snapped = snapValueToStep(raw, curMin, curMax, curStep)
      const bounds = getThumbBounds(curValues, index, curMin, curMax, curStep, curMinSteps)
      const clamped = Math.max(bounds.min, Math.min(bounds.max, snapped))
      if (clamped === curValues[index]) return false
      const nextValues = [...curValues]
      nextValues[index] = clamped
      const emitted: SliderValue = curIsRange ? nextValues : clamped
      if (!isControlledRef.current) {
        setInternalValue(emitted)
      }
      lastRequestedValueRef.current = emitted
      curOnChange?.(emitted)
      return true
    }, [])

    const computePointerPercent = React.useCallback(
      (clientX: number, clientY: number): number | null => {
        const trackEl = trackRef.current
        if (!trackEl) return null
        const rect = trackEl.getBoundingClientRect()
        const { orientation: currentOrientation } = latestPropsRef.current
        const isHoriz = currentOrientation === 'horizontal'
        if (isHoriz && rect.width === 0) return null
        if (!isHoriz && rect.height === 0) return null

        let percent: number
        if (isHoriz) {
          const adjustedX = clientX - grabOffsetRef.current
          percent = isRtl
            ? (rect.right - adjustedX) / rect.width
            : (adjustedX - rect.left) / rect.width
        } else {
          const adjustedY = clientY - grabOffsetRef.current
          percent = (rect.bottom - adjustedY) / rect.height
        }
        if (!Number.isFinite(percent)) return null
        return Math.max(0, Math.min(1, percent))
      },
      [isRtl]
    )

    const handlePointerMove = React.useCallback(
      (e: PointerEvent) => {
        if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) {
          return
        }
        if (e.buttons === 0) {
          // Dropped mouseup / released touch contact: cancel, never commit.
          cancelPointerSession()
          return
        }

        const dragIndex = activeDragIndexRef.current
        const { values: curValues, min: curMin, max: curMax } = latestPropsRef.current
        if (dragIndex === null || dragIndex < 0 || dragIndex >= curValues.length) return

        const percent = computePointerPercent(e.clientX, e.clientY)
        if (percent === null) return
        const raw = curMin + percent * (curMax - curMin)
        if (requestThumbValue(dragIndex, raw)) {
          hasChangedInSessionRef.current = true
        }
      },
      [computePointerPercent, requestThumbValue, cancelPointerSession]
    )

    const handlePointerUp = React.useCallback(
      (e: PointerEvent) => {
        if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) {
          return
        }
        const dragIndex = activeDragIndexRef.current
        const changed = hasChangedInSessionRef.current
        const lastRequested = lastRequestedValueRef.current
        cancelPointerSession()

        // Exactly one end per changed session, before capture cleanup.
        if (changed) {
          const { onChangeEnd: curOnChangeEnd } = latestPropsRef.current
          curOnChangeEnd?.(lastRequested)
        }

        if (dragIndex !== null) {
          thumbNodesRef.current.get(dragIndex)?.focus()
        }
      },
      [cancelPointerSession]
    )

    const handlePointerCancel = React.useCallback(
      (e: PointerEvent) => {
        if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) {
          return
        }
        cancelPointerSession()
      },
      [cancelPointerSession]
    )

    React.useEffect(() => {
      const onLostCapture = () => {
        if (activePointerIdRef.current !== null) {
          cancelPointerSession()
        }
      }
      const onBlur = () => {
        if (activePointerIdRef.current !== null) {
          cancelPointerSession()
        }
        if (hasChangedInKeySessionRef.current) {
          hasChangedInKeySessionRef.current = false
          activeKeyRef.current = null
        }
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerCancel)
      window.addEventListener('lostpointercapture', onLostCapture)
      window.addEventListener('blur', onBlur)

      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerCancel)
        window.removeEventListener('lostpointercapture', onLostCapture)
        window.removeEventListener('blur', onBlur)
      }
    }, [handlePointerMove, handlePointerUp, handlePointerCancel, cancelPointerSession])

    const startPointerDrag = React.useCallback(
      (
        e: React.PointerEvent<HTMLDivElement>,
        targetIndex: number,
        fromThumb: boolean
      ) => {
        if (disabled) return

        if (
          thumbNodesRef.current.size !== values.length ||
          targetIndex < 0 ||
          targetIndex >= values.length
        ) {
          throw new Error(countMismatchMessage(values.length, thumbNodesRef.current.size))
        }

        const trackEl = trackRef.current
        if (!trackEl) {
          throw new Error('[Slider] Slider requires a Slider.Track component')
        }

        activePointerIdRef.current = e.pointerId
        activeDragIndexRef.current = targetIndex
        sessionLengthRef.current = values.length
        setActiveThumbIndex(targetIndex)
        setDraggingIndex(targetIndex)
        setFocusVisibleIndex(null)
        hasChangedInSessionRef.current = false

        const thumbNode = thumbNodesRef.current.get(targetIndex)
        if (thumbNode && document.activeElement !== thumbNode) {
          thumbNode.focus()
        }

        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}

        const rect = trackEl.getBoundingClientRect()
        const isHoriz = orientation === 'horizontal'
        const currentVal = values[targetIndex]
        const currentPercent = valueToPercent(currentVal, min, max)

        if (fromThumb) {
          let thumbCenter: number
          if (isHoriz) {
            thumbCenter = isRtl
              ? rect.right - (currentPercent / 100) * rect.width
              : rect.left + (currentPercent / 100) * rect.width
            grabOffsetRef.current = e.clientX - thumbCenter
          } else {
            thumbCenter = rect.bottom - (currentPercent / 100) * rect.height
            grabOffsetRef.current = e.clientY - thumbCenter
          }
          // Thumb presses never emit on their own; the session does.
        } else {
          grabOffsetRef.current = 0
          const percent = computePointerPercent(e.clientX, e.clientY)
          if (percent !== null) {
            const raw = min + percent * (max - min)
            if (requestThumbValue(targetIndex, raw)) {
              hasChangedInSessionRef.current = true
            }
          }
        }

        thumbNodesRef.current.get(targetIndex)?.focus()
      },
      [
        disabled,
        values,
        orientation,
        min,
        max,
        isRtl,
        computePointerPercent,
        requestThumbValue,
      ]
    )

    const handleThumbKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
        if (disabled) return
        if (e.ctrlKey || e.altKey || e.metaKey) return

        const {
          min: curMin,
          max: curMax,
          step: curStep,
          minStepsBetweenThumbs: curMinSteps,
          orientation: curOrientation,
          values: curValues,
        } = latestPropsRef.current

        if (
          thumbNodesRef.current.size !== curValues.length ||
          index < 0 ||
          index >= curValues.length
        ) {
          throw new Error(countMismatchMessage(curValues.length, thumbNodesRef.current.size))
        }

        const isHoriz = curOrientation === 'horizontal'
        const curVal = curValues[index]
        const bounds = getThumbBounds(curValues, index, curMin, curMax, curStep, curMinSteps)
        const pageStep = getPageStep(curMin, curMax, curStep)

        let targetVal: number | null = null

        // Horizontal RTL reverses Left/Right only; vertical ignores direction.
        if (isHoriz) {
          if (isRtl) {
            if (e.key === 'ArrowLeft') targetVal = stepValue(curVal, 1, curMin, curMax, curStep)
            else if (e.key === 'ArrowRight') targetVal = stepValue(curVal, -1, curMin, curMax, curStep)
            else if (e.key === 'ArrowUp') targetVal = stepValue(curVal, 1, curMin, curMax, curStep)
            else if (e.key === 'ArrowDown') targetVal = stepValue(curVal, -1, curMin, curMax, curStep)
          } else {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp')
              targetVal = stepValue(curVal, 1, curMin, curMax, curStep)
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
              targetVal = stepValue(curVal, -1, curMin, curMax, curStep)
          }
        } else {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight')
            targetVal = stepValue(curVal, 1, curMin, curMax, curStep)
          else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft')
            targetVal = stepValue(curVal, -1, curMin, curMax, curStep)
        }

        // Shift+Arrow paging is retained while FEATURES #3 is undecided; the
        // key session still keys on e.key, so a modifier release alone can
        // never end it.
        if (targetVal !== null && e.shiftKey) {
          const direction: 1 | -1 =
            e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : -1
          const rtlFlip = isHoriz && isRtl && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') ? -1 : 1
          targetVal = snapValueToStep(
            curVal + direction * rtlFlip * pageStep,
            curMin,
            curMax,
            curStep
          )
        }

        if (e.key === 'PageUp') {
          targetVal = snapValueToStep(curVal + pageStep, curMin, curMax, curStep)
        } else if (e.key === 'PageDown') {
          targetVal = snapValueToStep(curVal - pageStep, curMin, curMax, curStep)
        }

        if (e.key === 'Home') {
          targetVal = bounds.min
        } else if (e.key === 'End') {
          targetVal = bounds.max
        }

        if (targetVal === null) return

        setFocusVisibleIndex(index)
        setActiveThumbIndex(index)

        const clamped = Math.max(bounds.min, Math.min(bounds.max, targetVal))
        if (clamped !== curVal) {
          e.preventDefault()
          if (requestThumbValue(index, clamped)) {
            hasChangedInKeySessionRef.current = true
            activeKeyRef.current = e.key
          }
        } else {
          e.preventDefault()
        }
      },
      [disabled, isRtl, requestThumbValue]
    )

    const handleThumbKeyUp = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>, _index: number) => {
        if (disabled) return
        if (hasChangedInKeySessionRef.current && e.key === activeKeyRef.current) {
          hasChangedInKeySessionRef.current = false
          activeKeyRef.current = null
          const { onChangeEnd: curOnChangeEnd } = latestPropsRef.current
          curOnChangeEnd?.(lastRequestedValueRef.current)
        }
      },
      [disabled]
    )

    const handleThumbFocus = React.useCallback(
      (_e: React.FocusEvent<HTMLDivElement>, index: number) => {
        setActiveThumbIndex(index)
        if (activePointerIdRef.current === null && isFocusVisible()) {
          setFocusVisibleIndex(index)
        } else if (activePointerIdRef.current !== null) {
          setFocusVisibleIndex(null)
        }
      },
      []
    )

    const handleThumbBlur = React.useCallback(
      (_e: React.FocusEvent<HTMLDivElement>, index: number) => {
        setFocusVisibleIndex(current => (current === index ? null : current))
        if (hasChangedInKeySessionRef.current) {
          hasChangedInKeySessionRef.current = false
          activeKeyRef.current = null
        }
      },
      []
    )

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
        registerThumb,
        startPointerDrag,
        handleThumbKeyDown,
        handleThumbKeyUp,
        handleThumbFocus,
        handleThumbBlur,
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
        registerThumb,
        startPointerDrag,
        handleThumbKeyDown,
        handleThumbKeyUp,
        handleThumbFocus,
        handleThumbBlur,
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
                <SliderThumb key={i} index={i} />
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

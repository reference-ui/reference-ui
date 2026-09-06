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

export type SliderOrientation = 'horizontal' | 'vertical'
export type SliderValue = number | number[]

export type SliderProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'defaultValue'> & {
  value?: SliderValue
  defaultValue?: SliderValue
  min?: number
  max?: number
  step?: number
  minStepsBetweenThumbs?: number
  orientation?: SliderOrientation
  disabled?: boolean
  onChange?: (value: any) => void
  onChangeEnd?: (value: any) => void
}

interface SliderContextValue {
  values: number[]
  min: number
  max: number
  step: number
  minStepsBetweenThumbs: number
  orientation: SliderOrientation
  disabled: boolean
  draggingIndex: number | null
  focusVisibleIndex: number | null
  trackRef: React.RefObject<HTMLDivElement | null>
  updateThumbValue: (index: number, nextVal: number) => void
  commitThumbValue: (index: number, nextVal: number) => void
  setDraggingIndex: (index: number | null) => void
  setFocusVisibleIndex: (index: number | null) => void
  registerThumb: (index: number, node: HTMLDivElement | null) => void
}

const SliderContext = React.createContext<SliderContextValue | null>(null)

export type SliderTrackProps = PrimitiveProps<'div'>

export const SliderTrack = React.forwardRef<HTMLDivElement, SliderTrackProps>(
  function SliderTrack(
    {
      children,
      className,
      style,
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

export function SliderRange({
  className,
  style,
  ...props
}: SliderRangeProps) {
  const context = React.useContext(SliderContext)
  if (!context) return null

  const { values, min, max, orientation } = context
  const startVal = values.length > 1 ? Math.min(...values) : min
  const endVal = values.length > 1 ? Math.max(...values) : values[0] ?? min
  const range = max - min || 1

  const startPercent = Math.max(0, Math.min(100, ((startVal - min) / range) * 100))
  const endPercent = Math.max(0, Math.min(100, ((endVal - min) / range) * 100))
  const sizePercent = endPercent - startPercent

  const isHorizontal = orientation === 'horizontal'

  return (
    <Div
      data-reference-slider-range=""
      position="absolute"
      bg="ui.progress.bar.foreground"
      borderRadius="full"
      pointerEvents="none"
      className={className}
      style={{
        left: isHorizontal ? `${startPercent}%` : 0,
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
    step,
    minStepsBetweenThumbs,
    orientation,
    disabled,
    updateThumbValue,
    commitThumbValue,
    registerThumb,
    focusVisibleIndex,
    setFocusVisibleIndex,
  } = context
  const [localFocusVisible, setLocalFocusVisible] = React.useState(false)
  const isFocusVisibleManaged =
    focusVisibleIndex !== undefined
      ? focusVisibleIndex === index
      : localFocusVisible

  const val = values[index] ?? min
  const range = max - min || 1
  const percent = Math.max(0, Math.min(100, ((val - min) / range) * 100))
  const isHorizontal = orientation === 'horizontal'
  const isDraggingRef = React.useRef(false)
  const [isThumbPressed, setIsThumbPressed] = React.useState(false)
  const isDragging = context.draggingIndex === index
  const isActive = isDragging || isThumbPressed

  const setThumbRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      registerThumb(index, node)
    },
    [registerThumb, index]
  )

  const thumbMin = index > 0 && values.length > 1 ? values[index - 1] + minStepsBetweenThumbs * step : min
  const thumbMax = index < values.length - 1 && values.length > 1 ? values[index + 1] - minStepsBetweenThumbs * step : max

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled) return

    setFocusVisibleIndex(index)
    setLocalFocusVisible(true)

    const pageStep = Math.max(step, Math.ceil((max - min) / 10 / step) * step)
    const stepAmount = e.shiftKey ? pageStep : step

    let nextVal = val
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      nextVal = Math.min(thumbMax, val + stepAmount)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      nextVal = Math.max(thumbMin, val - stepAmount)
    } else if (e.key === 'Home') {
      nextVal = thumbMin
    } else if (e.key === 'End') {
      nextVal = thumbMax
    } else if (e.key === 'PageUp') {
      nextVal = Math.min(thumbMax, val + pageStep)
    } else if (e.key === 'PageDown') {
      nextVal = Math.max(thumbMin, val - pageStep)
    }

    if (nextVal !== val) {
      e.preventDefault()
      updateThumbValue(index, nextVal)
      commitThumbValue(index, nextVal)
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (e.defaultPrevented || disabled) return
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    isDraggingRef.current = true
    setIsThumbPressed(true)
    setFocusVisibleIndex(null)
    setLocalFocusVisible(false)
    context.setDraggingIndex(index)
    e.currentTarget.focus()
  }

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    props.onFocus?.(e)
    if (e.defaultPrevented) return

    if (!isDraggingRef.current && context.draggingIndex === null && isFocusVisible()) {
      setFocusVisibleIndex(index)
      setLocalFocusVisible(true)
    } else {
      setFocusVisibleIndex(null)
      setLocalFocusVisible(false)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    props.onBlur?.(e)
    if (e.defaultPrevented) return

    if (focusVisibleIndex === index) {
      setFocusVisibleIndex(null)
    }
    setLocalFocusVisible(false)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e)
    if (!isDraggingRef.current || disabled) return
    setFocusVisibleIndex(null)
    const trackEl = context.trackRef.current
    if (!trackEl) return

    const rect = trackEl.getBoundingClientRect()
    let nextPercent: number
    if (isHorizontal) {
      nextPercent = (e.clientX - rect.left) / rect.width
    } else {
      nextPercent = (rect.bottom - e.clientY) / rect.height
    }
    nextPercent = Math.max(0, Math.min(1, nextPercent))
    const rawVal = min + nextPercent * (max - min)
    updateThumbValue(index, rawVal)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(e)
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsThumbPressed(false)
    setFocusVisibleIndex(null)
    setLocalFocusVisible(false)
    context.setDraggingIndex(null)
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {}
    const trackEl = context.trackRef.current
    if (trackEl) {
      const rect = trackEl.getBoundingClientRect()
      let nextPercent: number
      if (isHorizontal) {
        nextPercent = (e.clientX - rect.left) / rect.width
      } else {
        nextPercent = (rect.bottom - e.clientY) / rect.height
      }
      nextPercent = Math.max(0, Math.min(1, nextPercent))
      const rawVal = min + nextPercent * (max - min)
      commitThumbValue(index, rawVal)
    }
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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
        width: isHorizontal ? sliderThumb.lengthPx : sliderThumb.crossPx,
        height: isHorizontal ? sliderThumb.crossPx : sliderThumb.lengthPx,
        borderRadius: sliderThumb.borderRadiusPx,
        boxShadow: isActive
          ? '0 0 0 4px color-mix(in oklch, var(--colors-ui-progress-bar-foreground, currentColor) 15.2%, transparent)'
          : undefined,
        outline: !isActive && isFocusVisibleManaged ? undefined : 'none',
        left: isHorizontal ? `${percent}%` : '50%',
        bottom: !isHorizontal ? `${percent}%` : undefined,
        top: isHorizontal ? '50%' : undefined,
        transform: isHorizontal ? 'translate(-50%, -50%)' : 'translate(-50%, 50%)',
        ['--reference-slider-thumb-position' as any]: `${percent}%`,
        ...style,
      }}
      {...props}
    />
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
      ...props
    },
    ref
  ) {
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<SliderValue>(defaultValue)
    const currentValue = isControlled ? valueProp : internalValue

    const values = React.useMemo(() => {
      if (Array.isArray(currentValue)) return currentValue
      return [typeof currentValue === 'number' ? currentValue : min]
    }, [currentValue, min])

    const trackRef = React.useRef<HTMLDivElement | null>(null)

    const updateThumbValue = React.useCallback(
      (index: number, nextVal: number) => {
        const thumbMin = index > 0 && values.length > 1 ? values[index - 1] + minStepsBetweenThumbs * step : min
        const thumbMax = index < values.length - 1 && values.length > 1 ? values[index + 1] - minStepsBetweenThumbs * step : max
        const clampedVal = Math.max(thumbMin, Math.min(thumbMax, Math.round(nextVal / step) * step))
        const nextValues = [...values]
        nextValues[index] = clampedVal

        const result = Array.isArray(currentValue) ? nextValues : clampedVal
        if (!isControlled) {
          setInternalValue(result)
        }
        onChange?.(result)
      },
      [values, currentValue, min, max, step, minStepsBetweenThumbs, isControlled, onChange]
    )

    const commitThumbValue = React.useCallback(
      (index: number, nextVal: number) => {
        const thumbMin = index > 0 && values.length > 1 ? values[index - 1] + minStepsBetweenThumbs * step : min
        const thumbMax = index < values.length - 1 && values.length > 1 ? values[index + 1] - minStepsBetweenThumbs * step : max
        const clampedVal = Math.max(thumbMin, Math.min(thumbMax, Math.round(nextVal / step) * step))
        const nextValues = [...values]
        nextValues[index] = clampedVal
        const result = Array.isArray(currentValue) ? nextValues : clampedVal
        onChangeEnd?.(result)
      },
      [values, currentValue, min, max, step, minStepsBetweenThumbs, onChangeEnd]
    )

    const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null)
    const [focusVisibleIndex, setFocusVisibleIndex] = React.useState<number | null>(null)
    const thumbNodesRef = React.useRef<Map<number, HTMLDivElement>>(new Map())

    const registerThumb = React.useCallback((index: number, node: HTMLDivElement | null) => {
      if (node) {
        thumbNodesRef.current.set(index, node)
      } else {
        thumbNodesRef.current.delete(index)
      }
    }, [])

    const contextValue = React.useMemo<SliderContextValue>(
      () => ({
        values,
        min,
        max,
        step,
        minStepsBetweenThumbs,
        orientation,
        disabled,
        draggingIndex,
        focusVisibleIndex,
        trackRef,
        updateThumbValue,
        commitThumbValue,
        setDraggingIndex,
        setFocusVisibleIndex,
        registerThumb,
      }),
      [values, min, max, step, minStepsBetweenThumbs, orientation, disabled, draggingIndex, focusVisibleIndex, updateThumbValue, commitThumbValue, registerThumb]
    )

    const isHorizontal = orientation === 'horizontal'
    const isDraggingRef = React.useRef(false)
    const activeThumbIndexRef = React.useRef(0)

    const getValueFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
      const trackEl = trackRef.current ?? e.currentTarget
      const rect = trackEl.getBoundingClientRect()
      let nextPercent: number
      if (isHorizontal) {
        nextPercent = (e.clientX - rect.left) / rect.width
      } else {
        nextPercent = (rect.bottom - e.clientY) / rect.height
      }
      nextPercent = Math.max(0, Math.min(1, nextPercent))
      return min + nextPercent * (max - min)
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      props.onPointerDown?.(e)
      if (e.defaultPrevented || disabled) return

      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {}
      isDraggingRef.current = true
      setFocusVisibleIndex(null)

      const rawVal = getValueFromPointer(e)
      let closestIndex = 0
      if (values.length > 1) {
        let minDiff = Infinity
        values.forEach((v, i) => {
          const diff = Math.abs(v - rawVal)
          if (diff < minDiff) {
            minDiff = diff
            closestIndex = i
          }
        })
      }
      activeThumbIndexRef.current = closestIndex
      setDraggingIndex(closestIndex)
      updateThumbValue(closestIndex, rawVal)
      commitThumbValue(closestIndex, rawVal)
      thumbNodesRef.current.get(closestIndex)?.focus()
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      props.onPointerMove?.(e)
      if (!isDraggingRef.current || disabled) return
      setFocusVisibleIndex(null)
      const rawVal = getValueFromPointer(e)
      updateThumbValue(activeThumbIndexRef.current, rawVal)
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      props.onPointerUp?.(e)
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setDraggingIndex(null)
      setFocusVisibleIndex(null)
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
      } catch {}
      const rawVal = getValueFromPointer(e)
      commitThumbValue(activeThumbIndexRef.current, rawVal)
      thumbNodesRef.current.get(activeThumbIndexRef.current)?.focus()
    }

    return (
      <SliderContext.Provider value={contextValue}>
        <Div
          ref={ref}
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          width={isHorizontal ? '100%' : '6r'}
          height={isHorizontal ? '6r' : '100%'}
          className={className}
          style={style}
          {...props}
        >
          {children ?? (
            <SliderTrack>
              <SliderRange />
              <SliderThumb />
            </SliderTrack>
          )}
        </Div>
      </SliderContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<SliderProps & React.RefAttributes<HTMLDivElement>> & {
  Track: typeof SliderTrack
  Range: typeof SliderRange
  Thumb: typeof SliderThumb
}

Slider.Track = SliderTrack
Slider.Range = SliderRange
Slider.Thumb = SliderThumb

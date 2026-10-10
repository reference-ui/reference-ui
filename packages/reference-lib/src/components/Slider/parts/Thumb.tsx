/**
 * Slider.Thumb: the draggable grip, one per value entry. It claims a mount
 * id at first render, reconciles it to DOM order through the registry, and
 * publishes clamped ARIA plus the focus-visible ring itself — the root owns
 * the drag and keyboard sessions the thumb's handlers invoke.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { focusRing, sliderThumb } from '../../../core/theme/primitives/shared'
import { SliderContext } from '../context'
import type { SliderThumbProps } from '../types'
import { getThumbBounds, valueToPercent } from '../math/slider-math'
import {
  resolveAriaValueText,
  resolveDefaultAriaLabel,
  resolveThumbZIndex,
} from '../interaction/thumb-model'

// Invisible WCAG 2.5.8 hit-area: the painted DSP fader cap stays 24x16
// (cross axis grows to 24 via the pseudo element, which paints nothing).
const thumbHitAreaHorizontal = {
  content: '""',
  position: 'absolute',
  inset: '-4px 0',
} as const
const thumbHitAreaVertical = {
  content: '""',
  position: 'absolute',
  inset: '0 -4px',
} as const

export const SliderThumb = React.forwardRef<HTMLDivElement, SliderThumbProps>(function SliderThumb(
  {
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
  }: SliderThumbProps,
  forwardedRef
) {
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
    claimThumbId,
    registerThumb,
    getThumbIndex,
    startPointerDrag,
    handleThumbKeyDown,
    handleThumbKeyUp,
    handleThumbFocus,
    handleThumbBlur,
    setFocusVisibleIndex,
  } = context
  // Auto mount-order identity: the claim order is the DOM order on first
  // paint and SSR; getThumbIndex reconciles to DOM order after commit.
  const [mountId] = React.useState(claimThumbId)
  const index = getThumbIndex(mountId)
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

  // Composed ref: registration must survive a consumer ref. (A plain
  // function component lets React 19 ref-as-prop overwrite registration
  // via the {...props} spread below, silently breaking interaction.)
  const setThumbRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      registerThumb(mountId, node)
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        ;(forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [registerThumb, mountId, forwardedRef]
  )

  // Out-of-range thumbs render global bounds so no ARIA attribute ever
  // contains NaN; the count mismatch itself throws when interaction begins.
  const inRange = index >= 0 && index < values.length
  const thumbBounds = inRange
    ? getThumbBounds(values, index, min, max, context.step, context.minStepsBetweenThumbs)
    : { min, max }
  // B-29: the render path clamps ARIA to the feasible window, exactly like
  // the visual position — a controlled value=999/max=24 exposes 24, never
  // a now/min/max triple AT would reject.
  const thumbMin = Math.max(min, Math.min(max, thumbBounds.min))
  const thumbMax = Math.max(min, Math.min(max, thumbBounds.max))
  const ariaNow = Math.max(thumbMin, Math.min(thumbMax, val))

  // The most recently active thumb paints on top so a direct stack press hits
  // the tie-rule winner; with no active thumb the lower index paints above.
  const zIndex = resolveThumbZIndex({ activeThumbIndex, index, thumbCount: values.length })

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

  const defaultAriaLabel = resolveDefaultAriaLabel({ thumbCount: values.length, index })

  const ariaValueText = resolveAriaValueText({
    authoredAriaValueText: props['aria-valuetext'],
    authoredValueText: valueText,
    authoredAriaNow: props['aria-valuenow'],
    formatValue,
    ariaNow,
  })

  return (
    <Div
      ref={setThumbRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={props['aria-label'] ?? defaultAriaLabel}
      aria-valuemin={thumbMin}
      aria-valuemax={thumbMax}
      aria-valuenow={ariaNow}
      aria-valuetext={ariaValueText}
      aria-orientation={orientation}
      aria-disabled={disabled ? true : undefined}
      data-reference-slider-thumb=""
      data-orientation={orientation}
      data-disabled={disabled ? '' : undefined}
      data-active={isActive ? '' : undefined}
      data-dragging={isDragging ? '' : undefined}
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
      _before={isHorizontal ? thumbHitAreaHorizontal : thumbHitAreaVertical}
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
})

SliderThumb.displayName = 'SliderThumb'

import * as React from 'react'
import { Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'

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
  orientation: SliderOrientation
  disabled: boolean
  updateThumbValue: (index: number, nextVal: number) => void
  commitThumbValue: (index: number, nextVal: number) => void
}

const SliderContext = React.createContext<SliderContextValue | null>(null)

export type SliderTrackProps = PrimitiveProps<'div'>

export function SliderTrack({
  children,
  className,
  style,
  ...props
}: SliderTrackProps) {
  const context = React.useContext(SliderContext)
  const orientation = context?.orientation ?? 'horizontal'

  return (
    <Div
      data-reference-slider-track=""
      position="relative"
      flexGrow={1}
      borderRadius="full"
      bg="colors.gray.200"
      height={orientation === 'horizontal' ? '1.5r' : '100%'}
      width={orientation === 'vertical' ? '1.5r' : '100%'}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Div>
  )
}

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
      className={className}
      style={{
        [isHorizontal ? 'left' : 'bottom']: `${startPercent}%`,
        [isHorizontal ? 'width' : 'height']: `${sizePercent}%`,
        [isHorizontal ? 'height' : 'width']: '100%',
        ...style,
      }}
      {...props}
    />
  )
}

export type SliderThumbProps = PrimitiveProps<'div'> & {
  index?: number
}

export function SliderThumb({
  index = 0,
  className,
  style,
  onKeyDown,
  ...props
}: SliderThumbProps) {
  const context = React.useContext(SliderContext)
  if (!context) return null

  const { values, min, max, step, orientation, disabled, updateThumbValue, commitThumbValue } = context
  const val = values[index] ?? min
  const range = max - min || 1
  const percent = Math.max(0, Math.min(100, ((val - min) / range) * 100))
  const isHorizontal = orientation === 'horizontal'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || disabled) return

    let nextVal = val
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      nextVal = Math.min(max, val + step)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      nextVal = Math.max(min, val - step)
    } else if (e.key === 'Home') {
      nextVal = min
    } else if (e.key === 'End') {
      nextVal = max
    } else if (e.key === 'PageUp') {
      nextVal = Math.min(max, val + step * 10)
    } else if (e.key === 'PageDown') {
      nextVal = Math.max(min, val - step * 10)
    }

    if (nextVal !== val) {
      e.preventDefault()
      updateThumbValue(index, nextVal)
      commitThumbValue(index, nextVal)
    }
  }

  return (
    <Div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={val}
      aria-orientation={orientation}
      data-disabled={disabled ? '' : undefined}
      onKeyDown={handleKeyDown}
      position="absolute"
      width="4.5r"
      height="4.5r"
      borderRadius="full"
      bg="ui.field.background"
      border="2px solid"
      borderColor="ui.progress.bar.foreground"
      boxShadow="0 1px 3px rgba(0,0,0,0.2)"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      touchAction="none"
      outline="none"
      _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
      className={className}
      style={{
        [isHorizontal ? 'left' : 'bottom']: `${percent}%`,
        transform: isHorizontal ? 'translateX(-50%)' : 'translateY(50%)',
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

    const updateThumbValue = React.useCallback(
      (index: number, nextVal: number) => {
        const clampedVal = Math.max(min, Math.min(max, Math.round(nextVal / step) * step))
        const nextValues = [...values]
        nextValues[index] = clampedVal

        const result = Array.isArray(currentValue) ? nextValues : clampedVal
        if (!isControlled) {
          setInternalValue(result)
        }
        onChange?.(result)
      },
      [values, currentValue, min, max, step, isControlled, onChange]
    )

    const commitThumbValue = React.useCallback(
      (index: number, nextVal: number) => {
        const clampedVal = Math.max(min, Math.min(max, Math.round(nextVal / step) * step))
        const nextValues = [...values]
        nextValues[index] = clampedVal
        const result = Array.isArray(currentValue) ? nextValues : clampedVal
        onChangeEnd?.(result)
      },
      [values, currentValue, min, max, step, onChangeEnd]
    )

    const contextValue = React.useMemo<SliderContextValue>(
      () => ({
        values,
        min,
        max,
        step,
        orientation,
        disabled,
        updateThumbValue,
        commitThumbValue,
      }),
      [values, min, max, step, orientation, disabled, updateThumbValue, commitThumbValue]
    )

    const isHorizontal = orientation === 'horizontal'

    return (
      <SliderContext.Provider value={contextValue}>
        <Div
          ref={ref}
          data-reference-slider=""
          data-orientation={orientation}
          data-disabled={disabled ? '' : undefined}
          position="relative"
          display="flex"
          alignItems="center"
          userSelect="none"
          touchAction="none"
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

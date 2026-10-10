/**
 * Slider's public contract: orientation and value shapes plus the prop types
 * for the root and every part. Kept free of JSX and logic so consumers, the
 * contract tests, and slider-math can import the shape without mounting
 * anything. The root re-exports every symbol defined here.
 */
import type { PrimitiveProps } from '@reference-ui/react'

export type SliderOrientation = 'horizontal' | 'vertical'
export type SliderValue = number | number[]

export type SliderProps<T extends SliderValue = SliderValue> = Omit<PrimitiveProps<'div'>, 'onChange' | 'defaultValue'> & {
  value: T
  min?: number
  max?: number
  step?: number
  minStepsBetweenThumbs?: number
  orientation?: SliderOrientation
  disabled?: boolean
  onChange?: (value: T) => void
  onChangeEnd?: (value: T) => void
}

export type SliderTrackProps = PrimitiveProps<'div'>

export type SliderRangeProps = PrimitiveProps<'div'>

export type SliderThumbProps = PrimitiveProps<'div'> & {
  valueText?: string
  formatValue?: (value: number) => string
}

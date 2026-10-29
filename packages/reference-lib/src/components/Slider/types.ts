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
  /** Required. The controlled value. An array gives one thumb per entry. */
  value: T
  /**
   * Lowest value.
   * @default 0
   */
  min?: number
  /**
   * Highest value.
   * @default 100
   */
  max?: number
  /**
   * Distance between values.
   * @default 1
   */
  step?: number
  /**
   * Smallest gap between neighbouring thumbs, in steps.
   * @default 0
   */
  minStepsBetweenThumbs?: number
  /**
   * Direction of the track.
   * @default 'horizontal'
   */
  orientation?: SliderOrientation
  /**
   * Stops all interaction and ends any drag in progress.
   * @default false
   */
  disabled?: boolean
  /** Called with every new value while dragging or stepping. */
  onChange?: (value: T) => void
  /** Called once, with the last value, when a drag or key press ends. */
  onChangeEnd?: (value: T) => void
}

export type SliderTrackProps = PrimitiveProps<'div'>

export type SliderRangeProps = PrimitiveProps<'div'>

export type SliderThumbProps = PrimitiveProps<'div'> & {
  /** Text screen readers announce instead of the number. */
  valueText?: string
  /** Builds that text from the value. */
  formatValue?: (value: number) => string
}

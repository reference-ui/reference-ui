/**
 * Splitter's public contract: orientation, the controlled value shape, the
 * separator ARIA triple, and the prop types for the root and every part.
 * Kept free of JSX and logic so consumers and the contract tests can import
 * the shape without mounting anything. The root re-exports every symbol
 * defined here.
 */
import type { PrimitiveProps } from '@reference-ui/react'

export type SplitterOrientation = 'horizontal' | 'vertical'

export type SplitterProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'display' | 'flexDirection'> & {
  orientation?: SplitterOrientation
  value: number[]
  onChange?: (value: number[]) => void
  onChangeEnd?: (value: number[]) => void
}

export interface SplitterSeparatorAria {
  valueNow: number
  valueMin: number
  valueMax: number
}

// 4a: minSize/maxSize stay excluded — deleted aliases, never CSS props.
export type SplitterPanelProps = Omit<
  PrimitiveProps<'div'>,
  'flexGrow' | 'flexShrink' | 'flexBasis' | 'flex' | 'minSize' | 'maxSize'
> & {
  min?: number | string
  max?: number | string
  collapsible?: boolean
  collapsedSize?: number
}

export interface SplitterHandleContextValue {
  orientation: SplitterOrientation
  isDragging: boolean
  isHovered: boolean
  isFocused: boolean
  isDisabled: boolean
}

export type SplitterThumbProps = PrimitiveProps<'div'> & {
  dots?: number
  dotHoverColor?: string
  dotActiveColor?: string
}

export type SplitterHandleProps = Omit<
  PrimitiveProps<'div'>,
  'flexGrow' | 'flexShrink' | 'flexBasis' | 'flex'
> & {
  disabled?: boolean
  withThumb?: boolean
}

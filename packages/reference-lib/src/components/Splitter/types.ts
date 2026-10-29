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
  /**
   * Lay Panels out in a row or a column.
   * @default 'horizontal'
   */
  orientation?: SplitterOrientation
  /** Required. Panel sizes as percentages, in order, summing to 100. */
  value: number[]
  /** Called with the new sizes as a Handle moves. */
  onChange?: (value: number[]) => void
  /** Called once when a drag or key press ends. */
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
  /** Smallest size: a percentage, or a CSS length. */
  min?: number | string
  /** Largest size: a percentage, or a CSS length. */
  max?: number | string
  /**
   * Allow the Panel to collapse.
   * @default false
   */
  collapsible?: boolean
  /**
   * Size in percent when collapsed.
   * @default 0
   */
  collapsedSize?: number
  /**
   * The Handle before it points at this id. Collapse memory is kept per id.
   * @default generated
   */
  id?: string
}

export interface SplitterHandleContextValue {
  orientation: SplitterOrientation
  isDragging: boolean
  isHovered: boolean
  isFocused: boolean
  isDisabled: boolean
}

export type SplitterThumbProps = PrimitiveProps<'div'> & {
  /**
   * Number of grip dots.
   * @default 3
   */
  dots?: number
  /** Dot colour while not dragged. */
  dotHoverColor?: string
  /** Dot colour while dragged. */
  dotActiveColor?: string
}

export type SplitterHandleProps = Omit<
  PrimitiveProps<'div'>,
  'flexGrow' | 'flexShrink' | 'flexBasis' | 'flex'
> & {
  /**
   * Stops the Handle from resizing. It stays focusable.
   * @default false
   */
  disabled?: boolean
  /**
   * Draw the grip.
   * @default true
   */
  withThumb?: boolean
}

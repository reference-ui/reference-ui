import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { DivProps } from '@reference-ui/react'
import { chipPaddingLg, chipPaddingSm } from '../tokens'

export type ChipSize = 'sm' | 'lg'

export type ChipProps = Omit<DivProps, 'size'> & {
  size?: ChipSize
}

const CHIP_PADDING: Record<ChipSize, string> = {
  sm: chipPaddingSm,
  lg: chipPaddingLg,
}

/**
 * A wrapper that owns `size`, the `@reference-ui/icons` shape in miniature: it
 * consumes the prop itself (inline padding) and forwards the rest to its `Div`,
 * so tracing publishes `Chip` with `size` in `jsxOwned`. A caller's `size` is
 * the chip's own vocabulary and must never become a style prop.
 */
export function Chip({ size = 'sm', style, ...rest }: ChipProps): React.ReactElement {
  return (
    <Div
      data-slot="chip"
      data-size={size}
      display="inline-block"
      style={{ padding: CHIP_PADDING[size], ...style }}
      {...rest}
    />
  )
}

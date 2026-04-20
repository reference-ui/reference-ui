/**
 * Box-pattern `size` prop: expand a single value into equal width and height.
 *
 * This keeps `<Div size="10r" />` and `box({ size: '10r' })` on the same
 * React-facing extension path as the other custom box props.
 *
 * Important: pattern transforms are serialized by `extendPatterns`, so this body
 * must stay self-contained and not close over imported helpers.
 */

import { extendPattern } from '../../../../api/patterns'

export interface SizeProp {
  size?: string | number
}

extendPattern({
  properties: {
    size: { type: 'string' },
  },
  transform(props: Record<string, unknown>) {
    const { size } = props

    if (size === undefined || (typeof size !== 'string' && typeof size !== 'number')) {
      return {}
    }

    return {
      width: size,
      height: size,
    }
  },
})
/**
 * Primitives — React components that read from @reference-ui/styled.
 * Scaffold: Div only. Full set will come from reference-core.
 */

import * as React from 'react'
import type { SystemStyleObject } from '@reference-ui/styled/types'
import { box } from '@reference-ui/styled/patterns/box'
import type { BoxProperties } from '@reference-ui/styled/patterns/box'

/** Div accepts HTML div attributes plus style props (padding, marginTop, bg, etc.) from the styled system. */
type DivProps = Omit<React.ComponentPropsWithoutRef<'div'>, keyof BoxProperties> &
  BoxProperties &
  SystemStyleObject

export const Div = React.forwardRef<HTMLDivElement, DivProps>((props, ref) => {
  const { className, children, ...rest } = props
  const boxClass = box(rest)
  const classes = [boxClass, className].filter(Boolean).join(' ').trim() || undefined
  return <div ref={ref} className={classes} {...rest}>{children}</div>
})

Div.displayName = 'Div'

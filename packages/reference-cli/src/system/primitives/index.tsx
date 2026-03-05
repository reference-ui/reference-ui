/**
 * Primitives — React components that read from @reference-ui/styled.
 * Scaffold: Div only. Full set will come from reference-core.
 */

import * as React from 'react'
import type { SystemStyleObject } from '@reference-ui/styled/types'
import { box } from '@reference-ui/styled/patterns/box'

/** Div accepts HTML div attributes plus style props (padding, marginTop, bg, etc.) from the styled system. */
type DivProps = React.ComponentPropsWithoutRef<'div'> & SystemStyleObject

export const Div = React.forwardRef<HTMLDivElement, DivProps>(
  (props, ref) => {
    const { className, ...rest } = props
    const boxClass = box({})
    const classes = [boxClass, className].filter(Boolean).join(' ').trim() || undefined
    return <div ref={ref} className={classes} {...rest} />
  }
)

Div.displayName = 'Div'

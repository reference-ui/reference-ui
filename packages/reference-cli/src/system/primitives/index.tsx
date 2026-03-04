/**
 * Primitives — React components that read from @reference-ui/styled.
 * Scaffold: Div only. Full set will come from reference-core.
 */

import * as React from 'react'
import { box } from '@reference-ui/styled/patterns/box'

export const Div = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  (props, ref) => {
    const { className, ...rest } = props
    const boxClass = box({})
    const classes = [boxClass, className].filter(Boolean).join(' ').trim() || undefined
    return <div ref={ref} className={classes} {...rest} />
  }
)

Div.displayName = 'Div'

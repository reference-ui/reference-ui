import * as React from 'react'
import { css } from '@reference-ui/styled/css'
import { splitCssProps } from '@reference-ui/styled/jsx'
import { box } from '@reference-ui/styled/patterns/box'

type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  color?: string
  css?: { color?: string }
  weight?: string
}

function joinClassName(...parts: Array<string | undefined>): string | undefined {
  const value = parts.filter(Boolean).join(' ').trim()
  return value || undefined
}

export function Panel(props: PanelProps) {
  const { className, ...rest } = props
  const [styleProps, elementProps] = splitCssProps(rest)
  const { css: cssProp, ...boxProps } = styleProps
  const classes = joinClassName(
    box(boxProps as Parameters<typeof box>[0]),
    cssProp ? css(cssProp as Parameters<typeof css>[0]) : undefined,
    className,
  )

  return <div className={classes} {...elementProps} />
}
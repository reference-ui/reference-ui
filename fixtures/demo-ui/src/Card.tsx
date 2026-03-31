import * as React from 'react'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export type CardProps = {
  /** Heading rendered at the top of the card. */
  title?: string
  footer?: React.ReactNode
  /** Inner spacing preset. */
  padding?: CardPadding
  /** Adds a drop shadow to lift the card off the page. */
  elevated?: boolean
  children: React.ReactNode
}

export function Card({
  title,
  footer,
  padding = 'md',
  elevated = false,
  children,
}: CardProps): React.ReactElement {
  return (
    <div data-elevated={elevated} data-padding={padding}>
      {title && <header>{title}</header>}
      <div>{children}</div>
      {footer && <footer>{footer}</footer>}
    </div>
  )
}

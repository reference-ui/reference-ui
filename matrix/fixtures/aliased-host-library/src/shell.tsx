/**
 * Aliased shell behind the fixture's badges: style props land on an
 * `as`-cast alias of `Div`, never a literal host, plus the `createBadge`
 * factory that closes `forwardRef` components over it. No `jsxElements`
 * roster — StyleTrace must follow the alias on its own (chain T16).
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { DivProps } from '@reference-ui/react'

export type BadgeShellProps = Omit<DivProps, 'size'> & {
  tone?: string
}

/**
 * Aliased shell: the fixture's `IconShell`. Style props land on this
 * `as`-cast alias, never on a literal `Div`, so the extractor must follow
 * the alias to attribute them. Dropping the alias drops the shell layout.
 */
const BadgeShell = Div as unknown as React.ForwardRefExoticComponent<
  React.PropsWithoutRef<BadgeShellProps> & React.RefAttributes<HTMLDivElement>
>

export function createBadge(label: string, displayName: string) {
  const Badge = React.forwardRef<HTMLDivElement, BadgeShellProps>(function BadgeInner(
    { tone = 'inherit', ...rest },
    ref
  ) {
    return (
      <BadgeShell
        ref={ref}
        data-slot="badge"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        lineHeight="0"
        flexShrink="0"
        color={tone}
        style={{ width: '1em', height: '1em', minWidth: '1em', minHeight: '1em' }}
        {...rest}
      >
        <span>{label}</span>
      </BadgeShell>
    )
  })
  Badge.displayName = displayName
  return Badge
}

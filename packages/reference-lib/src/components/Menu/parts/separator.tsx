/**
 * Menu.Separator: the one-pixel rule between menu sections. Takes
 * plain div props; never a roving stop, never focusable, purely the
 * visual break rows group around.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { MenuSeparatorProps } from '../types'

export const MenuSeparator: React.ForwardRefExoticComponent<
  MenuSeparatorProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, MenuSeparatorProps>(
  function MenuSeparator({ className, style, ...props }: MenuSeparatorProps, ref) {
    return (
      <Div
        role="separator"
        height="1px"
        bg="ui.hr.border"
        my="1r"
        className={className}
        style={style}
        {...props}
        ref={ref}
      />
    )
  }
)

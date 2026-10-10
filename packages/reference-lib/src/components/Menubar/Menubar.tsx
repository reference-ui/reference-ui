/**
 * Menubar root: controlled-only composition. Takes the bar value pair
 * plus loop, provides bar state over a horizontal RovingFocus row, and
 * assigns the Menu/Trigger/Content compounds. The only rendering root —
 * every part lives in parts/, every behavior in hooks/ or nav/.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { RovingFocus } from '../RovingFocus'
import { MenubarContext } from './context'
import { useMenubarState } from './hooks'
import type { MenubarProps } from './types'
import { MenubarMenu } from './parts/menu'
import { MenubarTrigger } from './parts/trigger'
import { MenubarContent } from './parts/content'

const MenubarRoot = React.forwardRef<HTMLDivElement, MenubarProps>(function MenubarRoot(
  { children, value, onChange, loop = false, ...props }: MenubarProps,
  ref
) {
  const { contextValue, rootNodeRef } = useMenubarState({ value, onChange, loop })

  const composedRootRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootNodeRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    },
    [ref]
  )

  return (
    <MenubarContext.Provider value={contextValue}>
      <RovingFocus.Root orientation="horizontal" loop={loop}>
        <Div
          role="menubar"
          display="flex"
          alignItems="center"
          gap="1r"
          {...props}
          ref={composedRootRef}
        >
          {children}
        </Div>
      </RovingFocus.Root>
    </MenubarContext.Provider>
  )
})

export const Menubar = MenubarRoot as React.ForwardRefExoticComponent<
  MenubarProps & React.RefAttributes<HTMLDivElement>
> & {
  Menu: typeof MenubarMenu
  Trigger: typeof MenubarTrigger
  Content: typeof MenubarContent
}

Menubar.Menu = MenubarMenu
Menubar.Trigger = MenubarTrigger
Menubar.Content = MenubarContent

export type {
  MenubarValue,
  MenubarProps,
  MenubarMenuProps,
  MenubarTriggerProps,
  MenubarContentProps,
} from './types'
export { MenubarMenu } from './parts/menu'
export { MenubarTrigger } from './parts/trigger'
export { MenubarContent } from './parts/content'

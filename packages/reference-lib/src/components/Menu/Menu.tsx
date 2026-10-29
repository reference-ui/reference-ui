/**
 * Menu root: the level dispatcher. Takes menu props and renders the
 * root Menu at top level or a submenu level when nested inside one,
 * then assigns the Item, Separator, Trigger, Content, LinkItem,
 * CheckboxItem, RadioGroup, and RadioItem compounds. Every level,
 * behavior, and rendering lives below in levels/, hooks/, focus/,
 * intent/, and parts/ — this file only routes and re-exports.
 */
import * as React from 'react'
import { useMenuLevel } from './context'
import { NestedMenu } from './parts/nested'
import { RootMenu } from './parts/root'
import { MenuCheckboxItem } from './parts/checkbox-item'
import { MenuContent } from './parts/content'
import { MenuItem } from './parts/item'
import { MenuLinkItem } from './parts/link-item'
import { MenuRadioGroup } from './parts/radio-group'
import { MenuRadioItem } from './parts/radio-item'
import { MenuSeparator } from './parts/separator'
import { MenuTrigger } from './parts/trigger'
import type { MenuProps } from './types'

// --- Dispatcher ------------------------------------------------------------

export const Menu = React.forwardRef<HTMLDivElement, MenuProps>(function Menu(props: MenuProps, ref) {
  const parentLevel = useMenuLevel()
  if (parentLevel) {
    const { open, onOpen, onDismiss, children } = props
    return (
      <NestedMenu open={open} onOpen={onOpen} onDismiss={onDismiss}>
        {children}
      </NestedMenu>
    )
  }
  return <RootMenu {...props} ref={ref} />
}) as React.ForwardRefExoticComponent<MenuProps & React.RefAttributes<HTMLDivElement>> & {
  Item: typeof MenuItem
  Separator: typeof MenuSeparator
  Trigger: typeof MenuTrigger
  Content: typeof MenuContent
  LinkItem: typeof MenuLinkItem
  CheckboxItem: typeof MenuCheckboxItem
  RadioGroup: typeof MenuRadioGroup
  RadioItem: typeof MenuRadioItem
}

Menu.Item = MenuItem
Menu.Separator = MenuSeparator
Menu.Trigger = MenuTrigger
Menu.Content = MenuContent
Menu.LinkItem = MenuLinkItem
Menu.CheckboxItem = MenuCheckboxItem
Menu.RadioGroup = MenuRadioGroup
Menu.RadioItem = MenuRadioItem

export type {
  MenuProps,
  MenuEntryStrategy,
  MenuTriggerProps,
  MenuContentProps,
  MenuItemProps,
  MenuCheckboxItemProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuLinkItemProps,
  MenuSeparatorProps,
  MenuTriggerKeys,
  MenuContextKeys,
} from './types'
export { useMenuTriggerKeys } from './hooks/use-menu-trigger-keys'
export { useMenuContextKeys } from './hooks/use-menu-context-keys'
export { MenuTrigger } from './parts/trigger'
export { MenuContent } from './parts/content'
export { MenuItem } from './parts/item'
export { MenuCheckboxItem } from './parts/checkbox-item'
export { MenuRadioGroup } from './parts/radio-group'
export { MenuRadioItem } from './parts/radio-item'
export { MenuLinkItem } from './parts/link-item'
export { MenuSeparator } from './parts/separator'

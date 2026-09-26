import * as React from 'react'
import { Div, Span, H3, H4, P } from '@reference-ui/react'
import { KeyboardArrowDownIcon } from '@reference-ui/icons'
import { Popover, type PopoverTriggerProps } from '../Popover'
import { Menu, useMenuTriggerKeys } from './index'
import { toast } from '../Toast'

// Popover.Trigger with Menu keyboard-entry wiring (ArrowDown/Enter/Space open
// on the first item, ArrowUp on the last; pointer opens focus the menu).
const EntryTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(function EntryTrigger(
  { children, onKeyDown, onClick, 'aria-haspopup': ariaHasPopup = 'menu', ...props }: PopoverTriggerProps,
  ref
) {
  const keys = useMenuTriggerKeys()
  const triggerProps = { ...props, ref: ref as React.Ref<HTMLButtonElement> }
  return (
    <Popover.Trigger
      onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(e)
        keys.onKeyDown(e)
      }}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        keys.onClick(e)
      }}
      {...triggerProps}
      aria-haspopup={ariaHasPopup}
    >
      {children}
    </Popover.Trigger>
  )
})

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Div
      p="5r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="lg"
      border="1px solid"
      borderColor="ui.dialog.border"
      boxShadow="0 2px 8px rgba(0,0,0,0.04)"
      display="flex"
      flexDirection="column"
      gap="4r"
    >
      <Div>
        <H4 fontSize="3.5r" fontWeight="600" m="0" color="design.text.base">
          {title}
        </H4>
        {subtitle && (
          <P fontSize="3r" color="design.text.light" mt="0.5r" mb="0">
            {subtitle}
          </P>
        )}
      </Div>
      {children}
    </Div>
  )
}

function MenuItemsList() {
  return (
    <Menu>
      <Menu.Item onClick={() => toast.show('Cut clicked')}>Cut</Menu.Item>
      <Menu.Item onClick={() => toast.show('Copy clicked')}>Copy</Menu.Item>
      <Menu.Item onClick={() => toast.show('Paste clicked')}>Paste</Menu.Item>
      <Menu.Separator />
      <Menu.Item disabled>Delete (Disabled)</Menu.Item>
    </Menu>
  )
}

export default {
  StandardDropdown: () => {
    return (
      <Div p="6r" maxW="200r">
        <SectionCard
          title="Standard Menu Dropdown"
          subtitle="Popover.Trigger uses native Button styling with zero-specificity default variant. Accessible keyboard navigation (ArrowDown/ArrowUp/Enter/Space to open, roving arrows, Tab/Escape to close)."
        >
          <Div display="flex" gap="4r" alignItems="center">
            <Popover>
              <EntryTrigger>
                <span>Actions</span>
                <KeyboardArrowDownIcon />
              </EntryTrigger>
              <Popover.Content placement="bottom-start">
                <MenuItemsList />
              </Popover.Content>
            </Popover>
          </Div>
        </SectionCard>
      </Div>
    )
  },

  TriggerVariants: () => {
    return (
      <Div p="6r" maxW="220r" display="flex" flexDirection="column" gap="5r">
        <Div>
          <H3 fontSize="5r" fontWeight="700" m="0" color="design.text.base">
            Menu Trigger Button Variants
          </H3>
          <P fontSize="3.5r" color="design.text.light" mt="1r" mb="0">
            Popover.Trigger directly inherits the Button primitive's variants without requiring custom styling overrides.
          </P>
        </Div>

        <SectionCard
          title="Variants (Default, Primary, Ghost)"
          subtitle="Click or use keyboard navigation (ArrowDown, ArrowUp, Enter, Space) on any variant"
        >
          <Div display="flex" gap="4r" alignItems="center" flexWrap="wrap">
            <Div display="flex" flexDirection="column" gap="1.5r" alignItems="flex-start">
              <Span fontSize="2.5r" color="design.text.light">
                Default Variant
              </Span>
              <Popover>
                <EntryTrigger>
                  <span>Options Menu</span>
                  <KeyboardArrowDownIcon />
                </EntryTrigger>
                <Popover.Content placement="bottom-start">
                  <MenuItemsList />
                </Popover.Content>
              </Popover>
            </Div>

            <Div display="flex" flexDirection="column" gap="1.5r" alignItems="flex-start">
              <Span fontSize="2.5r" color="design.text.light">
                Primary Variant
              </Span>
              <Popover>
                <EntryTrigger variant="primary">
                  <span>Create New</span>
                  <KeyboardArrowDownIcon />
                </EntryTrigger>
                <Popover.Content placement="bottom-start">
                  <MenuItemsList />
                </Popover.Content>
              </Popover>
            </Div>

            <Div display="flex" flexDirection="column" gap="1.5r" alignItems="flex-start">
              <Span fontSize="2.5r" color="design.text.light">
                Ghost Variant
              </Span>
              <Popover>
                <EntryTrigger variant="ghost">
                  <span>More Actions</span>
                  <KeyboardArrowDownIcon />
                </EntryTrigger>
                <Popover.Content placement="bottom-start">
                  <MenuItemsList />
                </Popover.Content>
              </Popover>
            </Div>
          </Div>
        </SectionCard>
      </Div>
    )
  },

  NestedSubmenu: () => {
    const [shareOpen, setShareOpen] = React.useState(false)
    return (
      <Div p="6r" maxW="200r">
        <SectionCard
          title="Nested Submenu"
          subtitle="Recursive Menu: Right/Enter/Space open, Left closes one level, hover intent opens after 100ms."
        >
          <Div display="flex" gap="4r" alignItems="center">
            <Popover>
              <EntryTrigger>
                <span>File</span>
                <KeyboardArrowDownIcon />
              </EntryTrigger>
              <Popover.Content placement="bottom-start">
                <Menu>
                  <Menu.Item onClick={() => toast.show('New clicked')}>New</Menu.Item>
                  <Menu.Item onClick={() => toast.show('Open clicked')}>Open</Menu.Item>
                  <Menu.Separator />
                  <Menu
                    open={shareOpen}
                    onOpen={() => setShareOpen(true)}
                    onDismiss={() => setShareOpen(false)}
                  >
                    <Menu.Trigger>Share</Menu.Trigger>
                    <Menu.Content>
                      <Menu.Item onClick={() => toast.show('Email clicked')}>Email</Menu.Item>
                      <Menu.Item onClick={() => toast.show('Copy link clicked')}>
                        Copy link
                      </Menu.Item>
                    </Menu.Content>
                  </Menu>
                </Menu>
              </Popover.Content>
            </Popover>
          </Div>
        </SectionCard>
      </Div>
    )
  },

  LinkItems: () => {
    return (
      <Div p="6r" maxW="200r">
        <SectionCard
          title="Link Items"
          subtitle="Real anchors with menuitem semantics: native navigation preserved, dismissed by default."
        >
          <Div display="flex" gap="4r" alignItems="center">
            <Popover>
              <EntryTrigger>
                <span>Docs</span>
                <KeyboardArrowDownIcon />
              </EntryTrigger>
              <Popover.Content placement="bottom-start">
                <Menu>
                  <Menu.LinkItem href="#getting-started">Getting started</Menu.LinkItem>
                  <Menu.LinkItem href="#api" target="_blank" rel="noreferrer">
                    API reference
                  </Menu.LinkItem>
                  <Menu.Separator />
                  <Menu.LinkItem href="#archived" disabled>
                    Archived (Disabled)
                  </Menu.LinkItem>
                </Menu>
              </Popover.Content>
            </Popover>
          </Div>
        </SectionCard>
      </Div>
    )
  },
}

import * as React from 'react'
import { Div, Span, H3, H4, P } from '@reference-ui/react'
import { KeyboardArrowDownIcon } from '@reference-ui/icons'
import { Menu } from './index'
import { toast } from '../Toast'

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
    <Menu.Content>
      <Menu.Item onClick={() => toast.show('Cut clicked')}>Cut</Menu.Item>
      <Menu.Item onClick={() => toast.show('Copy clicked')}>Copy</Menu.Item>
      <Menu.Item onClick={() => toast.show('Paste clicked')}>Paste</Menu.Item>
      <Menu.Separator />
      <Menu.Item disabled>Delete (Disabled)</Menu.Item>
    </Menu.Content>
  )
}

export default {
  StandardDropdown: () => {
    return (
      <Div p="6r" maxW="200r">
        <SectionCard
          title="Standard Menu Dropdown"
          subtitle="Menu.Trigger uses native Button styling with zero-specificity default variant. Accessible keyboard navigation (ArrowDown/ArrowUp/Enter/Space to open, roving arrows, Tab/Escape to close)."
        >
          <Div display="flex" gap="4r" alignItems="center">
            <Menu>
              <Menu.Trigger>
                <span>Actions</span>
                <KeyboardArrowDownIcon />
              </Menu.Trigger>
              <MenuItemsList />
            </Menu>
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
            Menu.Trigger directly inherits the Button primitive's variants without requiring custom styling overrides.
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
              <Menu>
                <Menu.Trigger>
                  <span>Options Menu</span>
                  <KeyboardArrowDownIcon />
                </Menu.Trigger>
                <MenuItemsList />
              </Menu>
            </Div>

            <Div display="flex" flexDirection="column" gap="1.5r" alignItems="flex-start">
              <Span fontSize="2.5r" color="design.text.light">
                Primary Variant
              </Span>
              <Menu>
                <Menu.Trigger variant="primary">
                  <span>Create New</span>
                  <KeyboardArrowDownIcon />
                </Menu.Trigger>
                <MenuItemsList />
              </Menu>
            </Div>

            <Div display="flex" flexDirection="column" gap="1.5r" alignItems="flex-start">
              <Span fontSize="2.5r" color="design.text.light">
                Ghost Variant
              </Span>
              <Menu>
                <Menu.Trigger variant="ghost">
                  <span>More Actions</span>
                  <KeyboardArrowDownIcon />
                </Menu.Trigger>
                <MenuItemsList />
              </Menu>
            </Div>
          </Div>
        </SectionCard>
      </Div>
    )
  },
}

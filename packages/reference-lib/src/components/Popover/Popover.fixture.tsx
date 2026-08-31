import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Popover } from './index'

export default {
  ClickToOpen: () => (
    <Div p="4r">
      <Popover>
        <Popover.Trigger
          px="3r"
          py="1.5r"
          borderRadius="sm"
          bg="ui.button.background"
          color="ui.button.foreground"
          border="1px solid"
          borderColor="ui.field.border"
          cursor="pointer"
        >
          Open popover
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            p="3.5r"
            bg="ui.dialog.background"
            color="ui.dialog.foreground"
            borderRadius="md"
            border="1px solid"
            borderColor="ui.dialog.border"
            boxShadow="0 4px 16px rgba(0,0,0,0.15)"
            placement="bottom-start"
            offset={8}
          >
            <Div display="flex" flexDirection="column" gap="2r">
              <Span fontWeight="600" fontSize="3.5r">
                Popover title
              </Span>
              <Span fontSize="3r" color="design.text.light">
                Non-isolating floating content anchored to the trigger.
              </Span>
              <Popover.Close
                px="2.5r"
                py="1r"
                borderRadius="sm"
                bg="colors.gray.100"
                border="1px solid"
                borderColor="ui.field.border"
                cursor="pointer"
                alignSelf="flex-start"
              >
                Close
              </Popover.Close>
            </Div>
            <Popover.Arrow />
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    </Div>
  ),
  HoverCard: () => (
    <Div p="4r">
      <Popover openOnHover openDelay={300} closeDelay={200}>
        <Popover.Trigger
          px="3r"
          py="1.5r"
          borderRadius="sm"
          bg="ui.button.background"
          color="ui.button.foreground"
          border="1px solid"
          borderColor="ui.field.border"
          cursor="pointer"
        >
          Hover for preview
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            p="3r"
            bg="ui.dialog.background"
            borderRadius="md"
            border="1px solid"
            borderColor="ui.dialog.border"
            boxShadow="0 4px 12px rgba(0,0,0,0.12)"
            placement="top"
            maxW="50r"
          >
            <Span fontSize="3r">
              Hover-opened popover with grace area for pointer travel.
            </Span>
            <Popover.Arrow />
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    </Div>
  ),
  Placements: () => (
    <Div display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="6r" p="8r">
      {(['top', 'right', 'bottom', 'left'] as const).map(placement => (
        <Popover key={placement}>
          <Popover.Trigger
            px="3r"
            py="1.5r"
            borderRadius="sm"
            bg="ui.button.background"
            border="1px solid"
            borderColor="ui.field.border"
            cursor="pointer"
          >
            {placement}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              p="2r"
              bg="ui.dialog.background"
              borderRadius="sm"
              border="1px solid"
              borderColor="ui.dialog.border"
              placement={placement}
              offset={8}
            >
              <Span fontSize="3r">placement=&quot;{placement}&quot;</Span>
            </Popover.Content>
          </Popover.Portal>
        </Popover>
      ))}
    </Div>
  ),
}

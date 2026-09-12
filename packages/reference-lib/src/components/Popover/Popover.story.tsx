import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Popover } from './index'

export const ClickToOpen = () => (
  <ReferenceLibrary>
    <Div p="4r" colorMode="dark">
      <Popover>
        <Popover.Trigger variant="primary">Open popover</Popover.Trigger>
        <Popover.Content
          p="3.5r"
          bg="ui.dialog.background"
          color="ui.dialog.foreground"
          borderRadius="md"
          border="1px solid"
          borderColor="ui.dialog.border"
          placement="bottom-start"
          offset={8}
        >
          <Span fontWeight="600" fontSize="3.5r">
            Popover title
          </Span>
        </Popover.Content>
      </Popover>
    </Div>
  </ReferenceLibrary>
)

export const HoverCard = () => (
  <ReferenceLibrary>
    <Div p="4r" colorMode="dark">
      <Popover openOnHover openDelay={300} closeDelay={200}>
        <Popover.Trigger variant="primary">Hover for preview</Popover.Trigger>
        <Popover.Content
          p="3r"
          bg="ui.dialog.background"
          borderRadius="md"
          border="1px solid"
          borderColor="ui.dialog.border"
          placement="top"
          maxW="50r"
        >
          <Span fontSize="3r">Hover-opened popover with grace area for pointer travel.</Span>
          <Popover.Arrow />
        </Popover.Content>
      </Popover>
    </Div>
  </ReferenceLibrary>
)

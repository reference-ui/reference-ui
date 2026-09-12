import * as React from 'react'
import { Div, Button, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Tooltip } from './index'

export const HoverTrigger = () => (
  <ReferenceLibrary>
    <Div p="6r" colorMode="dark">
      <Tooltip openDelay={100} closeDelay={100}>
        <Tooltip.Trigger>
          <Button variant="primary">Hover tooltip trigger</Button>
        </Tooltip.Trigger>
        <Tooltip.Content
          placement="top"
          offset={8}
          p="2r"
          bg="ui.dialog.background"
          color="ui.dialog.foreground"
          borderRadius="sm"
          border="1px solid"
          borderColor="ui.dialog.border"
        >
          <Span fontSize="3r">Helpful tooltip information</Span>
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip>
    </Div>
  </ReferenceLibrary>
)

export const KeyboardFocus = () => (
  <ReferenceLibrary>
    <Div p="6r" colorMode="dark">
      <Tooltip openDelay={0} closeDelay={100}>
        <Tooltip.Trigger>
          <Button variant="primary">Keyboard focus trigger</Button>
        </Tooltip.Trigger>
        <Tooltip.Content
          placement="bottom"
          offset={8}
          p="2r"
          bg="ui.dialog.background"
          color="ui.dialog.foreground"
          borderRadius="sm"
          border="1px solid"
          borderColor="ui.dialog.border"
        >
          <Span fontSize="3r">Appears on keyboard focus</Span>
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip>
    </Div>
  </ReferenceLibrary>
)

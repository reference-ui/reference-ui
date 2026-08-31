import * as React from 'react'
import { Div, Button } from '@reference-ui/react'
import { Tooltip } from './index'

export default {
  Top: () => (
    <Div p="8r">
      <Tooltip>
        <Tooltip.Trigger>
          <Button
            px="3r"
            py="1.5r"
            borderRadius="sm"
            bg="ui.button.background"
            color="ui.button.foreground"
            border="1px solid"
            borderColor="ui.field.border"
            cursor="pointer"
          >
            Hover me
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content placement="top">
            Helpful tooltip text
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip>
    </Div>
  ),
  Placements: () => (
    <Div display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="8r" p="10r">
      {(['top', 'right', 'bottom', 'left'] as const).map(placement => (
        <Tooltip key={placement}>
          <Tooltip.Trigger>
            <Button
              px="3r"
              py="1.5r"
              borderRadius="sm"
              bg="ui.button.background"
              border="1px solid"
              borderColor="ui.field.border"
              cursor="pointer"
            >
              {placement}
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content placement={placement}>
              Tooltip on {placement}
              <Tooltip.Arrow />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip>
      ))}
    </Div>
  ),
  FocusVisible: () => (
    <Div p="4r">
      <Tooltip openDelay={0}>
        <Tooltip.Trigger>
          <Button
            px="3r"
            py="1.5r"
            borderRadius="sm"
            bg="ui.button.background"
            border="1px solid"
            borderColor="ui.field.border"
            cursor="pointer"
          >
            Tab to focus
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content placement="bottom">
            Also visible on keyboard focus
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip>
    </Div>
  ),
}

import * as React from 'react'
import { Div, Button } from '@reference-ui/react'
import { Tooltip } from './index'

export default {
  Top: () => (
    <Div p="8r">
      <Tooltip>
        <Tooltip.Trigger>
          <Button variant="primary">
            Hover me
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content placement="top">
            Helpful tooltip text
            <Tooltip.Arrow />
          </Tooltip.Content>
      </Tooltip>
    </Div>
  ),
  Placements: () => (
    <Div display="grid" gridTemplateColumns="repeat(2, 1fr)" gap="8r" p="10r">
      {(['top', 'right', 'bottom', 'left'] as const).map(placement => (
        <Tooltip key={placement}>
          <Tooltip.Trigger>
            <Button>
              {placement}
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content placement={placement}>
              Tooltip on {placement}
              <Tooltip.Arrow />
            </Tooltip.Content>
        </Tooltip>
      ))}
    </Div>
  ),
  FocusVisible: () => (
    <Div p="4r">
      <Tooltip openDelay={0}>
        <Tooltip.Trigger>
          <Button variant="primary">
            Tab to focus
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content placement="bottom">
            Also visible on keyboard focus
            <Tooltip.Arrow />
          </Tooltip.Content>
      </Tooltip>
    </Div>
  ),
}

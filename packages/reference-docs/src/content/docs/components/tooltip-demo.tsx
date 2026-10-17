import { Button } from '@reference-ui/react'
import { Tooltip } from '@reference-ui/lib'

/** A tooltip describing a button; hover or focus the button to show it. */
export function TooltipDemo() {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Button>Save</Button>
      </Tooltip.Trigger>
      <Tooltip.Content>Save the document</Tooltip.Content>
    </Tooltip>
  )
}

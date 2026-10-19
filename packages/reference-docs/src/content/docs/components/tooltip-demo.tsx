import { Button, Div } from '@reference-ui/react'
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

const actions = [
  { label: 'Bold', tip: 'Bold (Ctrl+B)' },
  { label: 'Italic', tip: 'Italic (Ctrl+I)' },
  { label: 'Underline', tip: 'Underline (Ctrl+U)' },
]

/** Neighbouring tooltips: after the first one shows, the next opens at once. */
export function TooltipGroupDemo() {
  return (
    <Div display="flex" gap="2r">
      {actions.map(action => (
        <Tooltip key={action.label}>
          <Tooltip.Trigger>
            <Button>{action.label}</Button>
          </Tooltip.Trigger>
          <Tooltip.Content>{action.tip}</Tooltip.Content>
        </Tooltip>
      ))}
    </Div>
  )
}

import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Collapsible } from './index'

const triggerProps = {
  width: '100%' as const,
  textAlign: 'left' as const,
  justifyContent: 'flex-start' as const,
  bg: 'ui.field.background',
  color: 'ui.field.foreground',
  borderColor: 'ui.field.border',
}

export default {
  DefaultClosed: () => (
    <Div maxW="80r">
      <Collapsible>
        <Collapsible.Trigger {...triggerProps}>Show details</Collapsible.Trigger>
        <Collapsible.Content p="3r">
          <Span fontSize="3.5r" color="design.text.light">
            Collapsible content revealed on trigger click.
          </Span>
        </Collapsible.Content>
      </Collapsible>
    </Div>
  ),
  DefaultOpen: () => (
    <Div maxW="80r">
      <Collapsible defaultOpen>
        <Collapsible.Trigger {...triggerProps}>Hide details</Collapsible.Trigger>
        <Collapsible.Content p="3r">
          <Span fontSize="3.5r" color="design.text.light">
            This section starts open via defaultOpen.
          </Span>
        </Collapsible.Content>
      </Collapsible>
    </Div>
  ),
  Controlled: () => {
    const [open, setOpen] = React.useState(false)
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="2r">
        <Collapsible open={open} onChange={setOpen}>
          <Collapsible.Trigger {...triggerProps}>
            {open ? 'Collapse' : 'Expand'} controlled section
          </Collapsible.Trigger>
          <Collapsible.Content p="3r">
            <Span fontSize="3.5r" color="design.text.light">
              Open state is controlled externally.
            </Span>
          </Collapsible.Content>
        </Collapsible>
        <Span fontSize="3r" color="design.text.light">
          Open: {open ? 'yes' : 'no'}
        </Span>
      </Div>
    )
  },
}

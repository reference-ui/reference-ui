import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Collapsible } from './index'

export default {
  DefaultClosed: () => (
    <Div maxW="80r">
      <Collapsible>
        <Collapsible.Trigger
          px="3r"
          py="2r"
          width="100%"
          textAlign="left"
          bg="colors.gray.100"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="sm"
          cursor="pointer"
        >
          Show details
        </Collapsible.Trigger>
        <Collapsible.Content p="3r" bg="colors.gray.50" borderRadius="sm" mt="1r">
          <Span fontSize="3r">
            Collapsible content revealed on trigger click.
          </Span>
        </Collapsible.Content>
      </Collapsible>
    </Div>
  ),
  DefaultOpen: () => (
    <Div maxW="80r">
      <Collapsible defaultOpen>
        <Collapsible.Trigger
          px="3r"
          py="2r"
          width="100%"
          textAlign="left"
          bg="colors.gray.100"
          border="1px solid"
          borderColor="ui.field.border"
          borderRadius="sm"
          cursor="pointer"
        >
          Hide details
        </Collapsible.Trigger>
        <Collapsible.Content p="3r" bg="colors.gray.50" borderRadius="sm" mt="1r">
          <Span fontSize="3r">
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
        <Collapsible open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger
            px="3r"
            py="2r"
            width="100%"
            textAlign="left"
            bg="colors.gray.100"
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="sm"
            cursor="pointer"
          >
            {open ? 'Collapse' : 'Expand'} controlled section
          </Collapsible.Trigger>
          <Collapsible.Content p="3r" bg="colors.gray.50" borderRadius="sm" mt="1r">
            <Span fontSize="3r">Open state is controlled externally.</Span>
          </Collapsible.Content>
        </Collapsible>
        <Span fontSize="3r" color="design.text.light">Open: {open ? 'yes' : 'no'}</Span>
      </Div>
    )
  },
}

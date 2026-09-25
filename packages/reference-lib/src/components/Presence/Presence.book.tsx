import * as React from 'react'
import { Button, Div, Span } from '@reference-ui/react'
import { Presence } from './Presence'

export default {
  Default: () => {
    const [open, setOpen] = React.useState(true)

    return (
      <Div p="6r" display="flex" flexDirection="column" gap="4r" maxW="80r">
        <Div display="flex" alignItems="center" gap="3r">
          <Button onClick={() => setOpen(o => !o)}>
            {open ? 'Hide Content' : 'Show Content'}
          </Button>
          <Span fontSize="3r" color="design.text.light">
            State: {open ? 'open' : 'closed'}
          </Span>
        </Div>

        <Presence present={open}>
          <Div
            p="4r"
            borderRadius="md"
            border="1px solid"
            borderColor="ui.dialog.border"
            bg="ui.dialog.background"
            color="ui.dialog.foreground"
            data-state={open ? 'open' : 'closed'}
            style={{
              transition: 'opacity 300ms ease, transform 300ms ease',
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-10px)',
            }}
          >
            <Span fontSize="3.5r" fontWeight="500">
              Presence Managed Content
            </Span>
            <Div fontSize="3r" color="design.text.light" mt="1r">
              This panel smoothly animates exit before being unmounted from the DOM.
            </Div>
          </Div>
        </Presence>
      </Div>
    )
  },
}

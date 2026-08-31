import * as React from 'react'
import { Div, Button, H3, P } from '@reference-ui/react'
import { Overlay } from './index'

const triggerChrome = {
  px: '3r' as const,
  py: '1.5r' as const,
  borderRadius: 'sm' as const,
  bg: 'ui.button.background' as const,
  color: 'ui.button.foreground' as const,
  border: '1px solid' as const,
  borderColor: 'ui.field.border' as const,
  cursor: 'pointer' as const,
}

const dialogChrome = {
  p: '5r' as const,
  bg: 'ui.dialog.background' as const,
  color: 'ui.dialog.foreground' as const,
  borderRadius: 'lg' as const,
  border: '1px solid' as const,
  borderColor: 'ui.dialog.border' as const,
  boxShadow: '0 10px 40px rgba(0,0,0,0.25)' as const,
  minW: '70r' as const,
  zIndex: 50,
}

export default {
  Dialog: () => {
    const [open, setOpen] = React.useState(false)
    return (
      <Div>
        <Button {...triggerChrome} onClick={() => setOpen(true)}>
          Open dialog
        </Button>

        <Overlay open={open} onOpenChange={setOpen}>
          <Overlay.Backdrop bg="rgba(0,0,0,0.4)" zIndex={40} />
          <Overlay.Content
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            role="dialog"
            aria-modal="true"
            {...dialogChrome}
          >
            <H3 fontSize="4.5r" fontWeight="600" m="0">
              Confirm action
            </H3>
            <P fontSize="3r" color="design.text.light" mt="2r" mb="0">
              Modal overlay with backdrop and focus containment.
            </P>
            <Div display="flex" justifyContent="flex-end" gap="2r" mt="4r">
              <Button
                px="3r"
                py="1.5r"
                borderRadius="sm"
                bg="colors.gray.100"
                border="1px solid"
                borderColor="ui.field.border"
                cursor="pointer"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button {...triggerChrome} onClick={() => setOpen(false)}>
                Confirm
              </Button>
            </Div>
          </Overlay.Content>
        </Overlay>
      </Div>
    )
  },
  WithTrigger: () => {
    const [open, setOpen] = React.useState(false)
    return (
      <Overlay open={open} onOpenChange={setOpen}>
        <Overlay.Trigger {...triggerChrome}>Open via trigger</Overlay.Trigger>
        <Overlay.Backdrop bg="rgba(0,0,0,0.4)" zIndex={40} />
        <Overlay.Content
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          p="4r"
          bg="ui.dialog.background"
          borderRadius="md"
          border="1px solid"
          borderColor="ui.dialog.border"
          boxShadow="0 8px 24px rgba(0,0,0,0.2)"
          minW="60r"
          zIndex={50}
          role="dialog"
          aria-modal="true"
        >
          <P fontSize="3.5r" m="0">
            Opened using Overlay.Trigger
          </P>
        </Overlay.Content>
      </Overlay>
    )
  },
  Anchored: () => {
    const [open, setOpen] = React.useState(false)
    return (
      <Div p="8r">
        <Overlay open={open} onOpenChange={setOpen} isolation={false}>
          <Overlay.Trigger {...triggerChrome}>Open anchored</Overlay.Trigger>
          <Overlay.Content
            placement="bottom-start"
            offset={8}
            p="4r"
            bg="ui.dialog.background"
            color="ui.dialog.foreground"
            borderRadius="md"
            border="1px solid"
            borderColor="ui.dialog.border"
            boxShadow="0 8px 24px rgba(0,0,0,0.2)"
            zIndex={50}
          >
            <P fontSize="3.5r" m="0">
              Anchored to the trigger. Overlay writes position.
            </P>
          </Overlay.Content>
        </Overlay>
      </Div>
    )
  },
}

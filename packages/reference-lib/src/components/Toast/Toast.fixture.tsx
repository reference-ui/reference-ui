import * as React from 'react'
import { Div, Button } from '@reference-ui/react'
import { Toast, toast } from './index'

export default {
  Basic: () => (
    <Button
      px="3r"
      py="1.5r"
      borderRadius="sm"
      bg="ui.button.background"
      color="ui.button.foreground"
      border="1px solid"
      borderColor="ui.field.border"
      cursor="pointer"
      onClick={() => {
        toast.show(
          <Toast.Root>
            <Toast.Title>Changes saved</Toast.Title>
            <Toast.Description>Your settings were updated successfully.</Toast.Description>
          </Toast.Root>,
          { position: 'bottom-end' }
        )
      }}
    >
      Show toast
    </Button>
  ),
  WithAction: () => (
    <Div display="flex" gap="2r" flexWrap="wrap">
      <Button
        px="3r"
        py="1.5r"
        borderRadius="sm"
        bg="ui.button.background"
        color="ui.button.foreground"
        border="1px solid"
        borderColor="ui.field.border"
        cursor="pointer"
        onClick={() => {
          toast.show(
            <Toast.Root>
              <Toast.Title>Update available</Toast.Title>
              <Toast.Description>A new version of Reference UI is ready.</Toast.Description>
              <Toast.Action onClick={() => toast.dismissAll()}>Dismiss all</Toast.Action>
            </Toast.Root>,
            { position: 'top-center' }
          )
        }}
      >
        Top-center with action
      </Button>
      <Button
        px="3r"
        py="1.5r"
        borderRadius="sm"
        bg="ui.button.background"
        color="ui.button.foreground"
        border="1px solid"
        borderColor="ui.field.border"
        cursor="pointer"
        onClick={() => {
          toast.show(
            <Toast.Root>
              <Toast.Title>File uploaded</Toast.Title>
              <Toast.Description>design-tokens.json is ready to review.</Toast.Description>
              <Toast.Close onClick={() => toast.dismissAll()}>Close</Toast.Close>
            </Toast.Root>,
            { position: 'bottom-start' }
          )
        }}
      >
        Bottom-start with close
      </Button>
    </Div>
  ),
  DefinedToast: () => {
    const ProjectSavedToast = React.useMemo(
      () =>
        toast.define<{ name: string }>({
          duration: 4000,
          render: ({ name }) => (
            <Toast.Root>
              <Toast.Title>Project saved</Toast.Title>
              <Toast.Description>{name} was saved to disk.</Toast.Description>
            </Toast.Root>
          ),
        }),
      []
    )

    return (
      <Button
        px="3r"
        py="1.5r"
        borderRadius="sm"
        bg="ui.button.background"
        color="ui.button.foreground"
        border="1px solid"
        borderColor="ui.field.border"
        cursor="pointer"
        onClick={() => ProjectSavedToast({ name: 'reference-ui' })}
      >
        Show defined toast
      </Button>
    )
  },
}

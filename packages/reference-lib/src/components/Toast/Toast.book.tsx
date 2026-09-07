import * as React from 'react'
import { Div, Button } from '@reference-ui/react'
import { Toast, toast } from './index'

export default {
  Basic: () => (
    <Button
      variant="primary"
      onClick={() => {
        toast('Changes saved', {
          description: 'Your settings were updated successfully.',
          closeButton: true,
          position: 'bottom-end',
        })
      }}
    >
      Show toast
    </Button>
  ),
  Stacked: () => {
    const countRef = React.useRef(0)
    return (
      <Div display="flex" gap="2r" alignItems="center">
        <Button
          variant="primary"
          onClick={() => {
            countRef.current += 1
            toast(`Notification #${countRef.current}`, {
              description: 'Hover to expand the stack and click between toasts.',
              closeButton: true,
              position: 'bottom-end',
            })
          }}
        >
          Add to stack
        </Button>
        <Button
          onClick={() => toast.dismissAll()}
        >
          Dismiss all
        </Button>
      </Div>
    )
  },
  SonnerAPI: () => (
    <Div display="flex" gap="2r" flexWrap="wrap">
      <Button
        variant="primary"
        onClick={() => {
          toast.success('Project deployed', {
            description: 'Version 2.4.0 is now live in production.',
            closeButton: true,
          })
        }}
      >
        Success toast
      </Button>
      <Button
        onClick={() => {
          toast.error('Build failed', {
            description: 'Syntax error in components/Button.tsx:24.',
            closeButton: true,
          })
        }}
      >
        Error toast
      </Button>
      <Button
        onClick={() => {
          toast.info('Update available', {
            description: 'A newer version of Reference UI was published.',
            closeButton: true,
          })
        }}
      >
        Info toast
      </Button>
      <Button
        onClick={() => {
          toast.warning('Storage limit warning', {
            description: 'Your workspace is using 85% of allocated disk.',
            closeButton: true,
          })
        }}
      >
        Warning toast
      </Button>
    </Div>
  ),
  CustomToast: () => (
    <Button
      variant="primary"
      onClick={() => {
        toast.custom(
          (id) => (
            <Toast.Root
              border="1px solid"
              borderColor="design.text.base"
              p="4r"
            >
              <Div display="flex" alignItems="center" justifyContent="space-between">
                <Div display="flex" flexDirection="column" gap="0.5r">
                  <Toast.Title>Custom Toast Component</Toast.Title>
                  <Toast.Description>Rendered via toast.custom((id) =&gt; ...)</Toast.Description>
                </Div>
                <Toast.Close onClick={() => toast.dismiss(id)} />
              </Div>
            </Toast.Root>
          ),
          { position: 'bottom-end' }
        )
      }}
    >
      Show custom toast
    </Button>
  ),
  WithAction: () => (
    <Div display="flex" gap="2r" flexWrap="wrap">
      <Button
        variant="primary"
        onClick={() => {
          toast('Update ready to install', {
            description: 'Restart required to complete installation.',
            position: 'top-center',
            closeButton: true,
            action: {
              label: 'Restart now',
              onClick: () => alert('Restarting...'),
            },
            cancel: {
              label: 'Later',
              onClick: () => {},
            },
          })
        }}
      >
        Top-center with action
      </Button>
      <Button
        onClick={() => {
          toast('File uploaded', {
            description: 'design-tokens.json is ready to review.',
            position: 'bottom-start',
            closeButton: true,
          })
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
              <Div display="flex" alignItems="flex-start" justifyContent="space-between">
                <Div display="flex" flexDirection="column" gap="0.5r">
                  <Toast.Title>Project saved</Toast.Title>
                  <Toast.Description>{name} was saved to disk.</Toast.Description>
                </Div>
                <Toast.Close />
              </Div>
            </Toast.Root>
          ),
        }),
      []
    )

    return (
      <Button
        variant="primary"
        onClick={() => ProjectSavedToast({ name: 'reference-ui' })}
      >
        Show defined toast
      </Button>
    )
  },
}

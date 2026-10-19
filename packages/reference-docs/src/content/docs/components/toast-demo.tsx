import { Button, Div } from '@reference-ui/react'
import { ReferenceLibrary, toast } from '@reference-ui/lib'

function save() {
  return new Promise<{ name: string }>(resolve => {
    setTimeout(() => resolve({ name: 'Report' }), 1500)
  })
}

/**
 * A default, a typed and a promise toast. The docs app does not mount
 * ReferenceLibrary at its root, so the demo mounts one; in an application it
 * sits once near the root.
 */
export function ToastDemo() {
  return (
    <ReferenceLibrary>
      <Div display="flex" flexWrap="wrap" gap="2r">
        <Button
          variant="primary"
          onClick={() =>
            toast('Changes saved', {
              description: 'Your settings were updated.',
              closeButton: true,
            })
          }
        >
          Show toast
        </Button>
        <Button onClick={() => toast.success('Invite sent')}>Success</Button>
        <Button
          onClick={() =>
            toast.promise(save(), {
              loading: 'Saving report',
              success: data => `${data.name} saved`,
              error: 'Could not save the report',
            })
          }
        >
          Promise
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

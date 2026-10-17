import { Button } from '@reference-ui/react'
import { ReferenceLibrary, toast } from '@reference-ui/lib'

/**
 * Shows a toast. The docs app does not mount ReferenceLibrary at its root, so
 * the demo mounts one; in an application it sits once near the root.
 */
export function ToastDemo() {
  return (
    <ReferenceLibrary>
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
    </ReferenceLibrary>
  )
}

import * as React from 'react'
import { Toast, toast, ReferenceLibrary } from '@reference-ui/lib'

const simpleToast = toast.define<{ message: string; type?: 'info' | 'success' }>({
  duration: 5000,
  render: ({ message, type = 'info' }) => (
    <Toast.Root data-testid="defined-toast-root" data-type={type}>
      <Toast.Title data-testid="defined-toast-title">{message}</Toast.Title>
      <Toast.Close data-testid="btn-toast-dismiss">Dismiss</Toast.Close>
    </Toast.Root>
  ),
})

export function ToastFixture() {
  const [lastId, setLastId] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <div data-testid="toast-fixture-root">
        <h1>Toast Fixture</h1>

        <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
          <button
            type="button"
            data-testid="btn-show-defined-toast"
            onClick={() => {
              const id = simpleToast({ message: 'Project saved successfully!', type: 'success' })
              setLastId(id)
            }}
          >
            Show Defined Toast
          </button>

          <button
            type="button"
            data-testid="btn-update-toast"
            onClick={() => {
              if (lastId) {
                simpleToast.update(lastId, { message: 'Project synchronized with cloud!', type: 'success' })
              }
            }}
          >
            Update Toast
          </button>

          <button
            type="button"
            data-testid="btn-dismiss-toast"
            onClick={() => {
              if (lastId) {
                toast.dismiss(lastId)
              }
            }}
          >
            Dismiss Toast
          </button>

          <button
            type="button"
            data-testid="btn-dismiss-all"
            onClick={() => {
              toast.dismissAll()
            }}
          >
            Dismiss All
          </button>

          <button
            type="button"
            data-testid="btn-show-default-toast"
            onClick={() => {
              const id = toast('Settings updated', {
                description: 'Your profile settings were saved.',
                closeButton: true,
              })
              setLastId(id)
            }}
          >
            Show Default Toast
          </button>

          <button
            type="button"
            data-testid="btn-show-custom-toast"
            onClick={() => {
              const id = toast.custom(
                (toastId) => (
                  <Toast.Root data-testid="custom-toast-root">
                    <Toast.Title data-testid="custom-toast-title">Custom Layout</Toast.Title>
                    <Toast.Close data-testid="btn-custom-close">Close Custom</Toast.Close>
                  </Toast.Root>
                ),
                { duration: 5000 }
              )
              setLastId(id)
            }}
          >
            Show Custom Toast
          </button>

          <button
            type="button"
            data-testid="btn-add-stack-toasts"
            onClick={() => {
              toast('First notification', { description: 'First in stack', closeButton: true })
              toast('Second notification', { description: 'Second in stack', closeButton: true })
              toast('Third notification', { description: 'Third in stack', closeButton: true })
            }}
          >
            Add Stack Toasts
          </button>
        </div>
      </div>
    </ReferenceLibrary>
  )
}

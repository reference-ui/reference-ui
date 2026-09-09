import * as React from 'react'
import { Toast, toast, ReferenceLibrary, Overlay } from '@reference-ui/lib'

const simpleToast = toast.define<{ message: string; type?: 'info' | 'success' }>({
  duration: 5000,
  render: ({ message, type = 'info' }) => (
    <Toast.Root data-testid="defined-toast-root" data-type={type}>
      <Toast.Title data-testid="defined-toast-title">{message}</Toast.Title>
      <Toast.Close data-testid="btn-toast-dismiss">Dismiss</Toast.Close>
    </Toast.Root>
  ),
})

const dialogStyle: React.CSSProperties = {
  position: 'fixed',
  top: '20%',
  left: '20%',
  background: '#fff',
  color: '#111',
  padding: 24,
  border: '1px solid #ccc',
  minWidth: 280,
  zIndex: 20,
}

export function ToastFixture() {
  const fixture =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('fixture') : null

  if (fixture === 'Gate6') return <Gate6Fixture />
  if (fixture === 'HotkeyCustom') return <HotkeyCustomFixture />
  if (fixture === 'HotkeyOff') return <HotkeyOffFixture />

  return <BasicFixture />
}

function BasicFixture() {
  const [lastId, setLastId] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <div data-testid="toast-fixture-root">
        <h1>Toast Fixture</h1>

        <div style={{ display: 'flex', gap: '8px', margin: '16px 0', flexWrap: 'wrap' }}>
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
                () => (
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

function Gate6Fixture() {
  const [openA, setOpenA] = React.useState(false)
  const [openB, setOpenB] = React.useState(false)

  return (
    <ReferenceLibrary toaster={{ limit: 2 }}>
      <div data-testid="toast-fixture-root" style={{ padding: 24 }}>
        <h1>Toast Gate 6</h1>
        <button type="button" data-testid="btn-away">
          Away
        </button>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
          <button
            type="button"
            data-testid="btn-show-pause-toast"
            onClick={() => {
              toast('Overlay pause toast', {
                id: 'ov-pause',
                duration: 800,
                closeButton: true,
              })
            }}
          >
            Show pause toast
          </button>

          <button
            type="button"
            data-testid="btn-show-limit-a"
            onClick={() => toast('Limit A', { id: 'limit-a', duration: false, closeButton: true })}
          >
            Show A
          </button>
          <button
            type="button"
            data-testid="btn-show-limit-b"
            onClick={() => toast('Limit B', { id: 'limit-b', duration: false, closeButton: true })}
          >
            Show B
          </button>
          <button
            type="button"
            data-testid="btn-show-limit-c"
            onClick={() => toast('Limit C', { id: 'limit-c', duration: false, closeButton: true })}
          >
            Show C
          </button>
          <button
            type="button"
            data-testid="btn-dismiss-limit-a"
            onClick={() => toast.dismiss('limit-a')}
          >
            Dismiss A
          </button>

          <button
            type="button"
            data-testid="btn-show-swipe-toast"
            onClick={() => toast('Swipe me', { id: 'swipe', duration: false, closeButton: true })}
          >
            Show swipe toast
          </button>

          <button
            type="button"
            data-testid="btn-show-locked-toast"
            onClick={() =>
              toast('Locked toast', {
                id: 'locked',
                duration: false,
                dismissible: false,
                closeButton: true,
              })
            }
          >
            Show locked toast
          </button>

          <button
            type="button"
            data-testid="btn-show-locked-timed-toast"
            onClick={() =>
              toast('Locked timed toast', {
                id: 'locked-timed',
                duration: 600,
                dismissible: false,
                closeButton: true,
              })
            }
          >
            Show locked timed toast
          </button>

          <button
            type="button"
            data-testid="btn-show-autoclose-toast"
            onClick={() => {
              const log = ((window as unknown as { __toastAutoClose?: string[] }).__toastAutoClose ??=
                [])
              toast('Auto close', {
                id: 'auto',
                duration: 500,
                closeButton: true,
                onAutoClose: id => {
                  log.push(id)
                },
              })
            }}
          >
            Show auto-close toast
          </button>

          <button
            type="button"
            data-testid="btn-show-manual-autoclose-toast"
            onClick={() => {
              const log = ((window as unknown as { __toastAutoClose?: string[] }).__toastAutoClose ??=
                [])
              toast('Manual close', {
                id: 'manual',
                duration: false,
                closeButton: true,
                onAutoClose: id => {
                  log.push(id)
                },
              })
            }}
          >
            Show manual toast
          </button>

          <button
            type="button"
            data-testid="btn-dismiss-manual"
            onClick={() => toast.dismiss('manual')}
          >
            Dismiss manual
          </button>

          <button
            type="button"
            data-testid="btn-show-hotkey-toast"
            onClick={() => toast('Hotkey toast', { id: 'hotkey', duration: false, closeButton: true })}
          >
            Show hotkey toast
          </button>
        </div>

        <Overlay open={openA} onOpenChange={setOpenA} presence={false}>
          <Overlay.Trigger data-testid="btn-open-modal-a">Open A</Overlay.Trigger>
          <Overlay.Content data-testid="modal-a" role="dialog" style={dialogStyle}>
            <p>Modal A</p>
            <Overlay open={openB} onOpenChange={setOpenB} presence={false}>
              <Overlay.Trigger data-testid="btn-open-modal-b">Open B</Overlay.Trigger>
              <Overlay.Content
                data-testid="modal-b"
                role="dialog"
                style={{ ...dialogStyle, top: '35%', left: '35%' }}
              >
                <p>Modal B</p>
                <button type="button" data-testid="btn-close-modal-b" onClick={() => setOpenB(false)}>
                  Close B
                </button>
              </Overlay.Content>
            </Overlay>
            <button type="button" data-testid="btn-close-modal-a" onClick={() => setOpenA(false)}>
              Close A
            </button>
          </Overlay.Content>
        </Overlay>
      </div>
    </ReferenceLibrary>
  )
}

function HotkeyCustomFixture() {
  return (
    <ReferenceLibrary toaster={{ hotkey: ['shiftKey', 'KeyY'] }}>
      <div data-testid="toast-fixture-root" style={{ padding: 24 }}>
        <button
          type="button"
          data-testid="btn-show-hotkey-toast"
          onClick={() => toast('Custom hotkey', { id: 'hotkey', duration: false, closeButton: true })}
        >
          Show hotkey toast
        </button>
      </div>
    </ReferenceLibrary>
  )
}

function HotkeyOffFixture() {
  return (
    <ReferenceLibrary toaster={{ hotkey: false }}>
      <div data-testid="toast-fixture-root" style={{ padding: 24 }}>
        <button type="button" data-testid="btn-outside-focus">
          Outside
        </button>
        <button
          type="button"
          data-testid="btn-show-hotkey-toast"
          onClick={() => toast('No hotkey', { id: 'hotkey', duration: false, closeButton: true })}
        >
          Show hotkey toast
        </button>
      </div>
    </ReferenceLibrary>
  )
}

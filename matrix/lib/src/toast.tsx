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
  if (fixture === 'Gate7') return <Gate7Fixture />
  if (fixture === 'Gate7Dark') return <Gate7Fixture theme="dark" />
  if (fixture === 'Gate7Rich') return <Gate7Fixture richColors />
  if (fixture === 'Gate7Rtl') return <Gate7Fixture dir="rtl" />
  if (fixture === 'Gate7Style') return <Gate7StyleFixture />
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

function Gate7Fixture({
  theme,
  richColors,
  dir,
}: {
  theme?: 'light' | 'dark' | 'system'
  richColors?: boolean
  dir?: 'rtl' | 'ltr'
}) {
  return (
    <ReferenceLibrary toaster={{ theme, richColors, dir, offset: 24, gap: 14, closeButton: false }}>
      <div data-testid="toast-fixture-root" style={{ padding: 24 }}>
        <h1>Toast Gate 7</h1>
        <button type="button" data-testid="btn-away">
          Away
        </button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
          <button
            type="button"
            data-testid="btn-enter-bottom"
            onClick={() =>
              toast('Enter bottom', {
                id: 'enter-bottom',
                duration: false,
                position: 'bottom-end',
              })
            }
          >
            Enter bottom
          </button>
          <button
            type="button"
            data-testid="btn-enter-top"
            onClick={() =>
              toast('Enter top', {
                id: 'enter-top',
                duration: false,
                position: 'top-end',
              })
            }
          >
            Enter top
          </button>
          <button
            type="button"
            data-testid="btn-stack"
            onClick={() => {
              toast('Stack one', { id: 'stack-a', duration: false, description: 'First' })
              toast('Stack two', { id: 'stack-b', duration: false, description: 'Second' })
              toast('Stack three', { id: 'stack-c', duration: false, description: 'Third' })
            }}
          >
            Stack
          </button>
          <button
            type="button"
            data-testid="btn-expand-heights"
            onClick={() => {
              toast('Short', { id: 'short', duration: false, description: 'One line' })
              toast('Tall', {
                id: 'tall',
                duration: false,
                description: (
                  <span>
                    Line one
                    <br />
                    Line two
                    <br />
                    Line three
                  </span>
                ),
              })
            }}
          >
            Expand heights
          </button>
          <button
            type="button"
            data-testid="btn-exit"
            onClick={() => toast('Closeable', { id: 'exit', duration: false, closeButton: true })}
          >
            Exit toast
          </button>
          <button
            type="button"
            data-testid="btn-swipe"
            onClick={() => toast('Swipe physics', { id: 'swipe-g7', duration: false })}
          >
            Swipe toast
          </button>
          <button
            type="button"
            data-testid="btn-loading"
            onClick={() => toast.loading('Uploading', { id: 'loading' })}
          >
            Loading
          </button>
          <button
            type="button"
            data-testid="btn-promise"
            onClick={() => {
              toast.promise(
                new Promise(resolve => setTimeout(() => resolve('ok'), 200)),
                { loading: 'Saving', success: 'Saved' },
                { id: 'promise' }
              )
            }}
          >
            Promise
          </button>
          <button
            type="button"
            data-testid="btn-variants"
            onClick={() => {
              toast('Default', { id: 'card-default', duration: false })
              toast.success('Success', { id: 'card-success', duration: false, position: 'top-start' })
              toast.error('Error', { id: 'card-error', duration: false, position: 'top-center' })
              toast.warning('Warning', { id: 'card-warning', duration: false, position: 'bottom-start' })
              toast.info('Info', { id: 'card-info', duration: false, position: 'bottom-center' })
            }}
          >
            Variants
          </button>
          <button
            type="button"
            data-testid="btn-close"
            onClick={() => toast('With close', { id: 'close', duration: false, closeButton: true })}
          >
            Close button
          </button>
          <button
            type="button"
            data-testid="btn-action"
            onClick={() =>
              toast('Action toast', {
                id: 'action',
                duration: false,
                action: { label: 'Undo', onClick: () => {} },
                cancel: { label: 'Dismiss', onClick: () => {} },
              })
            }
          >
            Action
          </button>
          <button
            type="button"
            data-testid="btn-action-prevent"
            onClick={() =>
              toast('Keep me', {
                id: 'prevent',
                duration: false,
                action: {
                  label: 'Keep',
                  onClick: e => {
                    e.preventDefault()
                  },
                },
              })
            }
          >
            Prevent action
          </button>
          <button
            type="button"
            data-testid="btn-select"
            onClick={() =>
              toast('Selectable', {
                id: 'select',
                duration: false,
                description: 'Highlight this description to block swipe',
              })
            }
          >
            Selectable
          </button>
          <button
            type="button"
            data-testid="btn-invert"
            onClick={() => toast('Inverted', { id: 'invert', duration: false, invert: true })}
          >
            Invert
          </button>
          <button
            type="button"
            data-testid="btn-rich"
            onClick={() =>
              toast.success('Rich success', { id: 'rich', duration: false, richColors: true })
            }
          >
            Rich
          </button>
          <button
            type="button"
            data-testid="btn-custom"
            onClick={() =>
              toast.custom(
                () => (
                  <div data-testid="custom-g7" style={{ padding: 8, background: 'papayawhip' }}>
                    Custom only
                  </div>
                ),
                { id: 'custom-g7', duration: false }
              )
            }
          >
            Custom
          </button>
          <button
            type="button"
            data-testid="btn-node-action"
            onClick={() =>
              toast('Node action', {
                id: 'node-action',
                duration: false,
                action: <button type="button" data-testid="custom-action-node">Node</button>,
              })
            }
          >
            Node action
          </button>
          <button type="button" data-testid="btn-dismiss-all" onClick={() => toast.dismissAll()}>
            Dismiss all
          </button>
        </div>
      </div>
    </ReferenceLibrary>
  )
}

function Gate7StyleFixture() {
  return (
    <ReferenceLibrary
      toaster={{
        offset: 24,
        toastOptions: {
          classNames: { title: 'toaster-title', toast: 'toaster-toast' },
        },
      }}
    >
      <div data-testid="toast-fixture-root" style={{ padding: 24 }}>
        <button
          type="button"
          data-testid="btn-style"
          onClick={() =>
            toast('Styled', {
              id: 'styled',
              duration: false,
              className: 'toast-extra',
              style: { background: 'rgb(255, 0, 0)' },
            })
          }
        >
          Styled
        </button>
        <button
          type="button"
          data-testid="btn-unstyled"
          onClick={() =>
            toast('Unstyled', {
              id: 'unstyled',
              duration: false,
              unstyled: true,
            })
          }
        >
          Unstyled
        </button>
        <button
          type="button"
          data-testid="btn-classnames"
          onClick={() =>
            toast('Named', {
              id: 'classnames',
              duration: false,
              description: 'Desc',
              closeButton: true,
              action: { label: 'Go', onClick: () => {} },
              cancel: { label: 'No', onClick: () => {} },
              classNames: {
                toast: 'cn-toast',
                title: 'cn-title',
                description: 'cn-desc',
                closeButton: 'cn-close',
                actionButton: 'cn-action',
                cancelButton: 'cn-cancel',
              },
            })
          }
        >
          Classnames
        </button>
        <button
          type="button"
          data-testid="btn-button-style"
          onClick={() =>
            toast('Buttons', {
              id: 'button-style',
              duration: false,
              action: { label: 'Go', onClick: () => {} },
              cancel: { label: 'No', onClick: () => {} },
              actionButtonStyle: { background: 'rgb(0, 128, 0)' },
              cancelButtonStyle: { background: 'rgb(0, 0, 255)' },
            })
          }
        >
          Button style
        </button>
        <button
          type="button"
          data-testid="btn-offset"
          onClick={() => toast('Offset', { id: 'offset', duration: false, position: 'bottom-end' })}
        >
          Offset
        </button>
      </div>
    </ReferenceLibrary>
  )
}

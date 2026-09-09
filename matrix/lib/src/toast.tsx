import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Toast, toast, announce, ReferenceLibrary, Overlay } from '@reference-ui/lib'

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
  if (fixture === 'Harden') return <HardenFixture />
  if (fixture === 'HardenLimit') return <HardenLimitFixture />
  if (fixture === 'HardenPremount') return <HardenPremountFixture />
  if (fixture === 'HardenShadow') return <HardenShadowFixture />
  if (fixture === 'HardenStrict') return <HardenStrictFixture />
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

          <button
            type="button"
            data-testid="btn-comp-03"
            onClick={() => {
              toast('c3-a', { id: 'c3-a', position: 'top-start', duration: 8000, closeButton: true })
              toast('c3-b', { id: 'c3-b', position: 'bottom-end', duration: 8000, closeButton: true })
              toast('c3-c', { id: 'c3-c', position: 'top-start', duration: 8000, closeButton: true })
              toast('c3-d', { id: 'c3-d', position: 'bottom-end', duration: 8000, closeButton: true })
              toast('c3-e', { id: 'c3-e', position: 'top-start', duration: 8000, closeButton: true })
            }}
          >
            COMP-03 queue
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

function HardenFixture() {
  const [open, setOpen] = React.useState(false)
  const [originDisabled, setOriginDisabled] = React.useState(false)

  return (
    <ReferenceLibrary toaster={{ limit: 8, defaultDuration: 5000, defaultPosition: 'bottom-end' }}>
      <div data-testid="toast-fixture-root" style={{ padding: 24 }}>
        <h1>Toast Harden</h1>
        <button type="button" data-testid="btn-away">
          Away
        </button>
        <button
          type="button"
          data-testid="btn-show"
          id="show"
          disabled={originDisabled}
          onClick={() =>
            toast.custom(
              id => (
                <button type="button" data-testid="dismiss" onClick={() => toast.dismiss(id)}>
                  Dismiss from inside
                </button>
              ),
              { id: 'focus-restore', duration: false }
            )
          }
        >
          Show origin
        </button>
        <button type="button" data-testid="fallback-right">
          Fallback
        </button>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
          <button
            type="button"
            data-testid="btn-positions"
            onClick={() => {
              toast('top-start', { id: 'pos-a', position: 'top-start', duration: false })
              toast('top-start-2', { id: 'pos-a2', position: 'top-start', duration: false })
              toast('bottom-end', { id: 'pos-b', position: 'bottom-end', duration: false })
            }}
          >
            Positions
          </button>
          <button
            type="button"
            data-testid="btn-update-pos-a"
            onClick={() => toast.update('pos-a', 'top-start-updated')}
          >
            Update A
          </button>
          <button type="button" data-testid="btn-dismiss-pos-a" onClick={() => toast.dismiss('pos-a')}>
            Dismiss A
          </button>
          <button
            type="button"
            data-testid="btn-exit-item"
            onClick={() => toast('exit me', { id: 'upload:42', position: 'top-center', duration: false, closeButton: true })}
          >
            Exit identity
          </button>
          <button
            type="button"
            data-testid="btn-shapes"
            onClick={() => {
              toast.custom(() => 'Saved', { id: 'shape-string', duration: false, position: 'top-start' })
              toast.custom(
                () => (
                  <>
                    <span data-testid="frag-a">One</span>
                    <span data-testid="frag-b">Two</span>
                  </>
                ),
                { id: 'shape-frag', duration: false, position: 'top-center' }
              )
              toast.custom(
                () => (
                  <div>
                    <span data-testid="sib-a">Alpha</span>
                    <span role="status" data-testid="sib-status">
                      Status owned
                    </span>
                  </div>
                ),
                { id: 'shape-sibs', duration: false, position: 'top-end' }
              )
            }}
          >
            Shapes
          </button>
          <button
            type="button"
            data-testid="btn-interactive"
            onClick={() =>
              toast.custom(
                id => (
                  <form data-testid="toast-form">
                    <h2>Edit</h2>
                    <input data-testid="toast-input" defaultValue="" />
                    <button type="button" data-testid="toast-space">
                      Space
                    </button>
                    <button type="button" data-testid="toast-form-close" onClick={() => toast.dismiss(id)}>
                      Close
                    </button>
                  </form>
                ),
                { id: 'interactive', duration: false, announce: 'Draft was saved' }
              )
            }
          >
            Interactive
          </button>
          <button
            type="button"
            data-testid="btn-silent"
            onClick={() =>
              toast.custom(
                () => <div data-testid="silent-visual">Payment failed</div>,
                { id: 'silent', duration: false }
              )
            }
          >
            Silent visual
          </button>
          <button
            type="button"
            data-testid="btn-announce-polite"
            onClick={() => {
              announce('Project saved')
            }}
          >
            Announce polite
          </button>
          <button
            type="button"
            data-testid="btn-announce-both"
            onClick={() => {
              announce('Background sync complete', { politeness: 'polite' })
              announce('Session expired', { politeness: 'assertive' })
            }}
          >
            Announce both
          </button>
          <button
            type="button"
            data-testid="btn-job"
            onClick={() => toast('Started visual', { id: 'job', duration: false, announce: 'Started' })}
          >
            Job started
          </button>
          <button
            type="button"
            data-testid="btn-job-content"
            onClick={() => toast.update('job', 'Still going')}
          >
            Job content
          </button>
          <button
            type="button"
            data-testid="btn-job-finish"
            onClick={() => toast.update('job', 'Finished visual', { announce: 'Finished' })}
          >
            Job finish
          </button>
          <button type="button" data-testid="btn-job-dismiss" onClick={() => toast.dismiss('job')}>
            Job dismiss
          </button>
          <button
            type="button"
            data-testid="btn-untimed"
            onClick={() => toast('forever', { id: 'untimed', duration: false, closeButton: true })}
          >
            Untimed
          </button>
          <button
            type="button"
            data-testid="btn-zero"
            onClick={() => toast('zero', { id: 'zero', duration: 0, closeButton: true })}
          >
            Zero duration
          </button>
          <button
            type="button"
            data-testid="btn-timed"
            onClick={() => toast('timed', { id: 'timed', duration: 600, closeButton: true })}
          >
            Timed 600
          </button>
          <button
            type="button"
            data-testid="btn-style-child"
            onClick={() =>
              toast.custom(
                () => (
                  <div data-testid="scaled-child" style={{ transform: 'scale(2)' }}>
                    Keep transform
                  </div>
                ),
                { id: 'a', duration: false, position: 'bottom-start' }
              )
            }
          >
            Style child A
          </button>
          <button
            type="button"
            data-testid="btn-style-b"
            onClick={() => toast('b', { id: 'b', duration: false, position: 'bottom-start' })}
          >
            Style B
          </button>
          <button
            type="button"
            data-testid="btn-style-c"
            onClick={() => toast('c', { id: 'c', duration: false, position: 'bottom-start' })}
          >
            Style C
          </button>
          <button type="button" data-testid="btn-hide-origin" onClick={() => setOriginDisabled(true)}>
            Hide origin
          </button>
          <button type="button" data-testid="btn-dismiss-all" onClick={() => toast.dismissAll()}>
            Dismiss all
          </button>
          <button type="button" data-testid="btn-open-modal" onClick={() => setOpen(true)}>
            Open modal
          </button>
          <button
            type="button"
            data-testid="btn-time-leave"
            onClick={() => toast('leave me', { id: 'time-leave', duration: 1000, closeButton: true })}
          >
            TIME-05 leave
          </button>
          <button
            type="button"
            data-testid="btn-time-replace"
            onClick={() => toast('replace', { id: 'time-replace', duration: 5000, closeButton: true })}
          >
            TIME-13 show
          </button>
          <button
            type="button"
            data-testid="btn-time-replace-update"
            onClick={() => toast.update('time-replace', 'replaced', { duration: 800 })}
          >
            TIME-13 update
          </button>
          <button
            type="button"
            data-testid="btn-time-focus"
            onClick={() =>
              toast.custom(
                () => (
                  <div>
                    <input data-testid="time-focus-input" />
                    <button type="button" data-testid="time-focus-btn">
                      Inside
                    </button>
                  </div>
                ),
                { id: 'time-focus', duration: 5000 }
              )
            }
          >
            TIME-14 focus
          </button>
          <button
            type="button"
            data-testid="btn-close-fade"
            onClick={() => toast('fade', { id: 'close-fade', duration: false, closeButton: true })}
          >
            CLOSE-04 fade
          </button>
          <button
            type="button"
            data-testid="btn-close-anim"
            onClick={() => toast('anim', { id: 'close-anim', duration: false, closeButton: true })}
          >
            CLOSE-04 anim
          </button>
          <button
            type="button"
            data-testid="btn-close-zero"
            onClick={() => toast('zero-motion', { id: 'close-zero', duration: false, closeButton: true })}
          >
            CLOSE-04 zero
          </button>
          <button
            type="button"
            data-testid="btn-all-positions"
            onClick={() => {
              toast('top-start', { id: 'all-ts', position: 'top-start', duration: false })
              toast('top-center', { id: 'all-tc', position: 'top-center', duration: false })
              toast('top-end', { id: 'all-te', position: 'top-end', duration: false })
              toast('bottom-start', { id: 'all-bs', position: 'bottom-start', duration: false })
              toast('bottom-center', { id: 'all-bc', position: 'bottom-center', duration: false })
              toast('bottom-end', { id: 'all-be', position: 'bottom-end', duration: false })
            }}
          >
            All positions
          </button>
          <button
            type="button"
            data-testid="btn-env-race"
            onClick={() => {
              toast.dismiss('race')
              toast('race-fresh', { id: 'race', duration: 1000, closeButton: true })
            }}
          >
            ENV-04 race
          </button>
        </div>

        <style>{`
          [data-reference-toast-id="close-zero"],
          [data-reference-toast-id="close-zero"][data-exiting="true"],
          [data-reference-toast-id="close-zero"][data-state="closed"] {
            transition: none !important;
            animation: none !important;
          }
        `}</style>

        <Overlay open={open} onOpenChange={setOpen}>
          <Overlay.Trigger data-testid="btn-open-overlay">Open overlay</Overlay.Trigger>
          <Overlay.Content data-testid="harden-modal" role="dialog" style={dialogStyle}>
            <p>Modal</p>
            <input data-testid="modal-input" />
            <button type="button" data-testid="btn-close-overlay" onClick={() => setOpen(false)}>
              Close overlay
            </button>
          </Overlay.Content>
        </Overlay>
      </div>
    </ReferenceLibrary>
  )
}

function HardenLimitFixture() {
  return (
    <ReferenceLibrary toaster={{ limit: 1, defaultDuration: 5000 }}>
      <div data-testid="toast-fixture-root" style={{ padding: 24 }}>
        <button type="button" data-testid="btn-away">
          Away
        </button>
        <button
          type="button"
          data-testid="btn-limit-visible"
          onClick={() => toast('visible forever', { id: 'limit-visible', duration: false, closeButton: true })}
        >
          Visible
        </button>
        <button
          type="button"
          data-testid="btn-limit-waiter"
          onClick={() => toast('waiter 500', { id: 'limit-waiter', duration: 500, closeButton: true })}
        >
          Waiter
        </button>
        <button
          type="button"
          data-testid="btn-limit-release"
          onClick={() => toast.dismiss('limit-visible')}
        >
          Release
        </button>
      </div>
    </ReferenceLibrary>
  )
}

function HardenPremountFixture() {
  const [mounted, setMounted] = React.useState(false)
  return (
    <div data-testid="toast-fixture-root" style={{ padding: 24 }}>
      <button
        type="button"
        data-testid="btn-premount-queue"
        onClick={() => {
          toast('pre visual', { id: 'pre', announce: 'Saved', duration: false })
          announce('Ready')
        }}
      >
        Queue before mount
      </button>
      <button type="button" data-testid="btn-premount-mount" onClick={() => setMounted(true)}>
        Mount library
      </button>
      {mounted ? (
        <ReferenceLibrary>
          <span data-testid="premount-app">mounted</span>
        </ReferenceLibrary>
      ) : null}
    </div>
  )
}

function ShadowLibraryApp() {
  return (
    <ReferenceLibrary>
      <span data-testid="shadow-app">shadow app</span>
    </ReferenceLibrary>
  )
}

function HardenShadowFixture() {
  const hostRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    let mount = shadow.querySelector('[data-testid="shadow-react-root"]') as HTMLDivElement | null
    if (!mount) {
      mount = document.createElement('div')
      mount.setAttribute('data-testid', 'shadow-react-root')
      shadow.appendChild(mount)
    }
    const root = createRoot(mount)
    root.render(<ShadowLibraryApp />)
    return () => {
      root.unmount()
    }
  }, [])

  return (
    <div data-testid="toast-fixture-root" style={{ padding: 24 }}>
      <button
        type="button"
        data-testid="btn-shadow-show"
        onClick={() => toast('shadow toast', { id: 'shadow-toast', duration: false, closeButton: true })}
      >
        Show in shadow
      </button>
      <button
        type="button"
        data-testid="btn-shadow-update"
        onClick={() => toast.update('shadow-toast', 'shadow updated')}
      >
        Update
      </button>
      <button
        type="button"
        data-testid="btn-shadow-announce"
        onClick={() => announce('Shadow ready')}
      >
        Announce
      </button>
      <button
        type="button"
        data-testid="btn-shadow-dismiss"
        onClick={() => toast.dismiss('shadow-toast')}
      >
        Dismiss
      </button>
      <div ref={hostRef} data-testid="shadow-host" />
    </div>
  )
}

function HardenStrictInner() {
  React.useEffect(() => {
    toast('Saving', { id: 'compat', duration: 1000, announce: 'Ready' })
    toast.update('compat', 'Saved')
  }, [])

  return (
    <div data-testid="toast-fixture-root" style={{ padding: 24 }}>
      <button type="button" data-testid="btn-strict-update" onClick={() => toast.update('compat', 'Updated')}>
        Update
      </button>
      <button type="button" data-testid="btn-strict-dismiss" onClick={() => toast.dismiss('compat')}>
        Dismiss
      </button>
    </div>
  )
}

function HardenStrictFixture() {
  return (
    <React.StrictMode>
      <ReferenceLibrary>
        <HardenStrictInner />
      </ReferenceLibrary>
    </React.StrictMode>
  )
}

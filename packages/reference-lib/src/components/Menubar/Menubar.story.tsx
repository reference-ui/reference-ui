import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Menu } from '../Menu'
import { Menubar } from './index'

export const Basic = () => {
  const [action, setAction] = React.useState<string | null>(null)
  const [value, setValue] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menubar-fixture-root">
        <Div mb="4r">
          <button data-testid="menubar-outside" type="button">
            Outside
          </button>
        </Div>
        <Div mb="4r">
          <Menubar data-testid="menubar-root" value={value} onValueChange={setValue}>
            <Menubar.Menu value="file">
              <Menubar.Trigger data-testid="trigger-file">File</Menubar.Trigger>
              <Menubar.Content data-testid="content-file">
                <Menu.Item
                  data-testid="file-new"
                  onSelect={() => setAction('File>New')}
                >
                  New
                </Menu.Item>
                <Menu.Item
                  data-testid="file-open"
                  onSelect={() => setAction('File>Open')}
                >
                  Open
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                  data-testid="file-delete"
                  disabled
                  onSelect={() => setAction('File>Delete')}
                >
                  Delete
                </Menu.Item>
              </Menubar.Content>
            </Menubar.Menu>
            <Menubar.Menu value="edit">
              <Menubar.Trigger data-testid="trigger-edit">Edit</Menubar.Trigger>
              <Menubar.Content data-testid="content-edit">
                <Menu.Item
                  data-testid="edit-undo"
                  onSelect={() => setAction('Edit>Undo')}
                >
                  Undo
                </Menu.Item>
                <Menu.Item
                  data-testid="edit-redo"
                  onSelect={() => setAction('Edit>Redo')}
                >
                  Redo
                </Menu.Item>
              </Menubar.Content>
            </Menubar.Menu>
            <Menubar.Menu value="view">
              <Menubar.Trigger data-testid="trigger-view">View</Menubar.Trigger>
              <Menubar.Content data-testid="content-view">
                <Menu.Item
                  data-testid="view-zoom-in"
                  onSelect={() => setAction('View>ZoomIn')}
                >
                  Zoom In
                </Menu.Item>
                <Menu.Item
                  data-testid="view-zoom-out"
                  onSelect={() => setAction('View>ZoomOut')}
                >
                  Zoom Out
                </Menu.Item>
              </Menubar.Content>
            </Menubar.Menu>
          </Menubar>
        </Div>

        <Span data-testid="menubar-action-display" fontSize="3.5r" color="design.text.base">
          Last Action: {action ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Submenu = () => {
  const [value, setValue] = React.useState<string | null>(null)
  const [shareOpen, setShareOpen] = React.useState(false)
  const [moreOpen, setMoreOpen] = React.useState(false)
  const [subLogs, setSubLogs] = React.useState<string[]>([])
  const [action, setAction] = React.useState<string | null>(null)

  const log = (entry: string) => setSubLogs(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menubar-fixture-root">
        <Div mb="4r">
          <Menubar data-testid="menubar-root" value={value} onValueChange={setValue}>
            <Menubar.Menu value="file">
              <Menubar.Trigger data-testid="trigger-file">File</Menubar.Trigger>
              <Menubar.Content data-testid="content-file">
                <Menu.Item data-testid="file-new" onSelect={() => setAction('New')}>
                  New
                </Menu.Item>
                <Menu
                  open={shareOpen}
                  onOpen={() => {
                    log('share:onOpen')
                    setShareOpen(true)
                  }}
                  onDismiss={() => {
                    log('share:onDismiss')
                    setShareOpen(false)
                  }}
                >
                  <Menu.Trigger data-testid="file-share">Share</Menu.Trigger>
                  <Menu.Content data-testid="file-share-content">
                    <Menu.Item
                      data-testid="file-share-email"
                      onSelect={() => setAction('Email')}
                    >
                      Email
                    </Menu.Item>
                    <Menu
                      open={moreOpen}
                      onOpen={() => {
                        log('more:onOpen')
                        setMoreOpen(true)
                      }}
                      onDismiss={() => {
                        log('more:onDismiss')
                        setMoreOpen(false)
                      }}
                    >
                      <Menu.Trigger data-testid="file-share-more">More</Menu.Trigger>
                      <Menu.Content data-testid="file-share-more-content">
                        <Menu.Item
                          data-testid="file-share-deep"
                          onSelect={() => setAction('Deep')}
                        >
                          Deep link
                        </Menu.Item>
                      </Menu.Content>
                    </Menu>
                    <Menu.Item
                      data-testid="file-share-copy"
                      onSelect={() => setAction('Copy')}
                    >
                      Copy link
                    </Menu.Item>
                  </Menu.Content>
                </Menu>
              </Menubar.Content>
            </Menubar.Menu>
            <Menubar.Menu value="edit">
              <Menubar.Trigger data-testid="trigger-edit">Edit</Menubar.Trigger>
              <Menubar.Content data-testid="content-edit">
                <Menu.Item data-testid="edit-undo" onSelect={() => setAction('Undo')}>
                  Undo
                </Menu.Item>
              </Menubar.Content>
            </Menubar.Menu>
          </Menubar>
        </Div>

        <Span data-testid="menubar-sub-logs" fontSize="3.5r" color="design.text.base">
          Sub Logs: {subLogs.join(',')}
        </Span>
        <Span data-testid="menubar-action-display" fontSize="3.5r" color="design.text.base">
          Last Action: {action ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Controlled = () => {
  const [value, setValue] = React.useState<string | null>('file')
  const [reject, setReject] = React.useState(false)
  const [logs, setLogs] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menubar-fixture-root">
        <Div mb="4r">
          <button
            data-testid="btn-toggle-reject"
            type="button"
            onClick={() => setReject(v => !v)}
          >
            Toggle Reject
          </button>
          <Span data-testid="menubar-reject-display">
            Reject: {reject ? 'On' : 'Off'}
          </Span>
        </Div>
        <Div mb="4r">
          <Menubar
            data-testid="menubar-root"
            value={value}
            onValueChange={next => {
              setLogs(prev => [...prev, `request:${next ?? 'null'}`])
              if (!reject) setValue(next)
            }}
          >
            <Menubar.Menu value="file">
              <Menubar.Trigger data-testid="trigger-file">File</Menubar.Trigger>
              <Menubar.Content data-testid="content-file">
                <Menu.Item data-testid="file-new">New</Menu.Item>
              </Menubar.Content>
            </Menubar.Menu>
            <Menubar.Menu value="edit">
              <Menubar.Trigger data-testid="trigger-edit">Edit</Menubar.Trigger>
              <Menubar.Content data-testid="content-edit">
                <Menu.Item data-testid="edit-undo">Undo</Menu.Item>
              </Menubar.Content>
            </Menubar.Menu>
          </Menubar>
        </Div>

        <Span data-testid="menubar-value-display" fontSize="3.5r" color="design.text.base">
          Value: {value ?? 'None'}
        </Span>
        <Span data-testid="menubar-value-logs" fontSize="3.5r" color="design.text.base">
          Logs: {logs.join(',')}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Loop = () => {
  const [value, setValue] = React.useState<string | null>(null)
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menubar-fixture-root">
        <Menubar data-testid="menubar-root" loop value={value} onValueChange={setValue}>
          <Menubar.Menu value="file">
            <Menubar.Trigger data-testid="trigger-file">File</Menubar.Trigger>
            <Menubar.Content data-testid="content-file">
              <Menu.Item data-testid="file-new">New</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Menu value="edit">
            <Menubar.Trigger data-testid="trigger-edit">Edit</Menubar.Trigger>
            <Menubar.Content data-testid="content-edit">
              <Menu.Item data-testid="edit-undo">Undo</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </Menubar>
      </Div>
    </ReferenceLibrary>
  )
}

export const Rtl = () => {
  const [value, setValue] = React.useState<string | null>(null)
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" dir="rtl" data-testid="menubar-fixture-root">
        <Menubar data-testid="menubar-root" value={value} onValueChange={setValue}>
          <Menubar.Menu value="file">
            <Menubar.Trigger data-testid="trigger-file">File</Menubar.Trigger>
            <Menubar.Content data-testid="content-file">
              <Menu.Item data-testid="file-new">New</Menu.Item>
              <Menu.Item data-testid="file-open">Open</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Menu value="edit">
            <Menubar.Trigger data-testid="trigger-edit">Edit</Menubar.Trigger>
            <Menubar.Content data-testid="content-edit">
              <Menu.Item data-testid="edit-undo">Undo</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </Menubar>
      </Div>
    </ReferenceLibrary>
  )
}

export const Disabled = () => {
  const [value, setValue] = React.useState<string | null>(null)
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menubar-fixture-root">
        <Menubar data-testid="menubar-root" value={value} onValueChange={setValue}>
          <Menubar.Menu value="file">
            <Menubar.Trigger data-testid="trigger-file">File</Menubar.Trigger>
            <Menubar.Content data-testid="content-file">
              <Menu.Item data-testid="file-new">New</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Menu value="help">
            <Menubar.Trigger data-testid="trigger-help" disabled>
              Help
            </Menubar.Trigger>
            <Menubar.Content data-testid="content-help">
              <Menu.Item data-testid="help-about">About</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
          <Menubar.Menu value="edit">
            <Menubar.Trigger data-testid="trigger-edit">Edit</Menubar.Trigger>
            <Menubar.Content data-testid="content-edit">
              <Menu.Item data-testid="edit-undo">Undo</Menu.Item>
            </Menubar.Content>
          </Menubar.Menu>
        </Menubar>
      </Div>
    </ReferenceLibrary>
  )
}

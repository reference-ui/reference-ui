import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Popover, type PopoverTriggerProps } from '../Popover'
import { Menu, useMenuTriggerKeys } from './index'

// Popover.Trigger with Menu keyboard-entry wiring (ArrowDown/Enter/Space open
// on the first item, ArrowUp on the last; pointer opens focus the menu).
const EntryTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(function EntryTrigger(
  { children, onKeyDown, onClick, ...props }: PopoverTriggerProps,
  ref
) {
  const keys = useMenuTriggerKeys()
  const triggerProps = { ...props, ref: ref as React.Ref<HTMLButtonElement> }
  return (
    <Popover.Trigger
      onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(e)
        keys.onKeyDown(e)
      }}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        keys.onClick(e)
      }}
      {...triggerProps}
    >
      {children}
    </Popover.Trigger>
  )
})

export const Basic = () => {
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-menu-trigger">
              Open Actions
            </EntryTrigger>

            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-content">
                <Menu.Item
                  data-testid="menu-item-edit"
                  onSelect={() => setSelectedAction('Edit')}
                >
                  Edit Document
                </Menu.Item>
                <Menu.Item
                  data-testid="menu-item-duplicate"
                  onSelect={() => setSelectedAction('Duplicate')}
                >
                  Duplicate
                </Menu.Item>
                <Menu.Separator />
                <Menu.Item
                  data-testid="menu-item-delete"
                  onSelect={() => setSelectedAction('Delete')}
                >
                  Delete
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        <Span data-testid="menu-action-display" fontSize="3.5r" color="design.text.base">
          Last Action: {selectedAction ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Parity = () => {
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null)
  const [selectEvent, setSelectEvent] = React.useState<string>('none')
  const [openLogs, setOpenLogs] = React.useState<string[]>([])
  const [cancelAction, setCancelAction] = React.useState<string | null>(null)
  const [closeAction, setCloseAction] = React.useState<string | null>(null)
  const [refTags, setRefTags] = React.useState<string>('pending')

  const [dynamicItems, setDynamicItems] = React.useState(['alpha', 'bravo', 'charlie'])
  const [bravoDisabled, setBravoDisabled] = React.useState(false)
  const [bravoLabel, setBravoLabel] = React.useState('bravo')

  const [controlledOpen, setControlledOpen] = React.useState(false)
  const [controlledReject, setControlledReject] = React.useState(false)
  const [controlledLogs, setControlledLogs] = React.useState<string[]>([])

  const triggerProbeRef = React.useRef<HTMLButtonElement | null>(null)
  const [triggerProbeTag, setTriggerProbeTag] = React.useState('?')

  React.useEffect(() => {
    setTriggerProbeTag(triggerProbeRef.current?.tagName ?? 'null')
  }, [])

  const recordSelect = (label: string) => (event: Event) => {
    const key = (event as KeyboardEvent).key
    const detail = (event as MouseEvent).detail
    setSelectedAction(label)
    setSelectEvent(`${event.type}:${key ?? detail ?? ''}:${event.defaultPrevented}`)
  }

  const reportRefTags = (node: HTMLElement | null, slot: string) => {
    if (!node) return
    setRefTags(prev => {
      const parts = prev === 'pending' ? [] : prev.split('|')
      const next = [...parts.filter(p => !p.startsWith(`${slot}:`)), `${slot}:${node.tagName}`]
      return next.join('|')
    })
  }

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        {/* Main menu: roles, roving, typeahead, activation */}
        <Div mb="4r">
          <Popover onOpenChange={next => setOpenLogs(prev => [...prev, String(next)])}>
            <EntryTrigger
              data-testid="btn-menu-trigger"
              ref={node => {
                triggerProbeRef.current = node
                reportRefTags(node, 'trigger')
              }}
            >
              Open Actions
            </EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu
                data-testid="menu-content"
                data-probe="content"
                ref={node => {
                  reportRefTags(node, 'content')
                }}
              >
                <Menu.Item
                  data-testid="menu-item-edit"
                  data-probe="item"
                  className="menu-probe-class"
                  onSelect={recordSelect('Edit')}
                  ref={node => {
                    reportRefTags(node, 'item')
                  }}
                >
                  Edit Document
                </Menu.Item>
                <Menu.Item
                  data-testid="menu-item-duplicate"
                  textValue="Zulu"
                  onSelect={recordSelect('Duplicate')}
                >
                  Duplicate
                </Menu.Item>
                <Menu.Separator
                  data-testid="menu-separator-1"
                  ref={node => {
                    reportRefTags(node, 'separator')
                  }}
                />
                <Menu.Item
                  data-testid="menu-item-delete"
                  disabled
                  onSelect={recordSelect('Delete')}
                >
                  Delete
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* Cancel menu: consumer cancellation */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-cancel-trigger">Open Cancel</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-content-cancel">
                <Menu.Item
                  data-testid="menu-item-native-cancel"
                  onClick={e => e.preventDefault()}
                  onSelect={() => setCancelAction('NativeCancel')}
                >
                  Native Cancel
                </Menu.Item>
                <Menu.Item
                  data-testid="menu-item-select-cancel"
                  onSelect={e => {
                    e.preventDefault()
                    setCancelAction('SelectCancel')
                  }}
                >
                  Select Cancel
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* Close-policy menu */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-close-trigger">Open Close</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-content-close">
                <Menu.Item
                  data-testid="menu-item-default-close"
                  onSelect={() => setCloseAction('DefaultClose')}
                >
                  Default Close
                </Menu.Item>
                <Menu.Item
                  data-testid="menu-item-stay-open"
                  closeOnSelect={false}
                  onSelect={() => setCloseAction('StayOpen')}
                >
                  Stay Open
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* Dynamic menu (mutators live inside content: outside presses dismiss) */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-dynamic-trigger">Open Dynamic</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-content-dynamic">
                {dynamicItems.map(item => (
                  <Menu.Item
                    key={item}
                    data-testid={`dynamic-item-${item}`}
                    disabled={item === 'bravo' && bravoDisabled}
                    onSelect={() => setSelectedAction(`dyn:${item === 'bravo' ? bravoLabel : item}`)}
                  >
                    {item === 'bravo' ? bravoLabel : item}
                  </Menu.Item>
                ))}
                <button
                  data-testid="btn-mutate-items"
                  type="button"
                  onClick={() => {
                    setDynamicItems(['charlie', 'bravo', 'delta'])
                    setBravoDisabled(true)
                  }}
                >
                  Mutate Items
                </button>
                <button
                  data-testid="btn-rename-items"
                  type="button"
                  onClick={() => setBravoLabel('bravo!')}
                >
                  Rename Bravo
                </button>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* Controlled menu */}
        <Div mb="4r">
          <button
            data-testid="btn-controlled-close"
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setControlledOpen(false)}
          >
            Programmatic Close
          </button>
          <button
            data-testid="btn-controlled-reject"
            type="button"
            onClick={() => setControlledReject(v => !v)}
          >
            Toggle Reject
          </button>
          <Popover
            open={controlledOpen}
            onOpenChange={next => {
              setControlledLogs(prev => [...prev, `request:${next}`])
              if (!controlledReject) setControlledOpen(next)
            }}
          >
            <EntryTrigger data-testid="btn-controlled-trigger">Open Controlled</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-content-controlled">
                <Menu.Item data-testid="controlled-item-1">Controlled Item</Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
          <Span data-testid="menu-controlled-display">
            Controlled: {controlledOpen ? 'Open' : 'Closed'}
          </Span>
        </Div>

        {/* Empty + all-disabled menus */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-empty-trigger">Open Empty</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-content-empty" />
            </Popover.Content>
          </Popover>
          <Popover>
            <EntryTrigger data-testid="btn-disabled-trigger">Open Disabled</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-content-disabled">
                <Menu.Item data-testid="disabled-item-1" disabled>
                  Off One
                </Menu.Item>
                <Menu.Item data-testid="disabled-item-2" disabled>
                  Off Two
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* Second menu for ID uniqueness */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-second-trigger">Open Second</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-content-second">
                <Menu.Item data-testid="second-item-1">Second Item</Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* Typeahead menu */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-type-trigger">Open Typeahead</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-content-type">
                <Menu.Item data-testid="menu-item-apple">Apple</Menu.Item>
                <Menu.Item data-testid="menu-item-anchor">Anchor</Menu.Item>
                <Menu.Item data-testid="menu-item-apricot">Apricot</Menu.Item>
                <Menu.Item data-testid="menu-item-banana">Banana</Menu.Item>
                <Menu.Item data-testid="menu-item-eclair">Éclair</Menu.Item>
                <Menu.Item data-testid="menu-item-aubergine" disabled>
                  Aubergine
                </Menu.Item>
                <Menu.Item data-testid="menu-item-notes">
                  Notes <input data-testid="menu-type-input" aria-label="note search" />
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* Tab section MUST stay last: tab-before/after adjacency for CLOSE-05 */}
        <Div mb="4r">
          <button data-testid="tab-before" type="button">
            Before
          </button>
          <Popover>
            <EntryTrigger data-testid="btn-tab-trigger">Open Tab</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-content-tab">
                <Menu.Item data-testid="tab-item-1">Tab One</Menu.Item>
                <Menu.Item data-testid="tab-item-2">Tab Two</Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
          <button data-testid="tab-after" type="button">
            After
          </button>
        </Div>

        <Span data-testid="menu-action-display" fontSize="3.5r" color="design.text.base">
          Last Action: {selectedAction ?? 'None'}
        </Span>
        <Span data-testid="menu-select-event" fontSize="3.5r" color="design.text.base">
          Select Event: {selectEvent}
        </Span>
        <Span data-testid="menu-open-logs" fontSize="3.5r" color="design.text.base">
          Open Logs: {openLogs.join(',')}
        </Span>
        <Span data-testid="menu-cancel-display" fontSize="3.5r" color="design.text.base">
          Cancel Action: {cancelAction ?? 'None'}
        </Span>
        <Span data-testid="menu-close-display" fontSize="3.5r" color="design.text.base">
          Close Action: {closeAction ?? 'None'}
        </Span>
        <Span data-testid="menu-controlled-logs" fontSize="3.5r" color="design.text.base">
          Controlled Logs: {controlledLogs.join(',')}
        </Span>
        <Span data-testid="menu-ref-display" fontSize="3.5r" color="design.text.base">
          Refs: {refTags}
        </Span>
        <Span data-testid="menu-trigger-probe-display" fontSize="3.5r" color="design.text.base">
          Trigger Probe: {triggerProbeTag}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Submenu = () => {
  const [shareOpen, setShareOpen] = React.useState(false)
  const [moreOpen, setMoreOpen] = React.useState(false)
  const [subLogs, setSubLogs] = React.useState<string[]>([])
  const [rootLogs, setRootLogs] = React.useState<string[]>([])
  const [action, setAction] = React.useState<string | null>(null)

  const log = (entry: string) => setSubLogs(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        <Div mb="4r">
          <button data-testid="sub-outside" type="button">
            Outside
          </button>
          <Popover onOpenChange={next => setRootLogs(prev => [...prev, String(next)])}>
            <EntryTrigger data-testid="btn-sub-trigger">Open Submenu</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-sub-root">
                <Menu.Item
                  data-testid="menu-sub-item-new"
                  onSelect={() => setAction('New')}
                >
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
                  <Menu.Trigger data-testid="menu-sub-trigger">Share</Menu.Trigger>
                  <Menu.Content data-testid="menu-sub-content">
                    <Menu.Item
                      data-testid="menu-sub-item-email"
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
                      <Menu.Trigger data-testid="menu-sub-trigger-l2">More</Menu.Trigger>
                      <Menu.Content data-testid="menu-sub-content-l2">
                        <Menu.Item
                          data-testid="menu-sub-item-deep"
                          onSelect={() => setAction('Deep')}
                        >
                          Deep link
                        </Menu.Item>
                      </Menu.Content>
                    </Menu>
                    <Menu.Item
                      data-testid="menu-sub-item-copy"
                      onSelect={() => setAction('Copy')}
                    >
                      Copy link
                    </Menu.Item>
                  </Menu.Content>
                </Menu>
                <Menu
                  onOpen={() => log('omitted:onOpen')}
                  onDismiss={() => log('omitted:onDismiss')}
                >
                  <Menu.Trigger data-testid="menu-sub-trigger-omitted">
                    Omitted
                  </Menu.Trigger>
                  <Menu.Content data-testid="menu-sub-content-omitted">
                    <Menu.Item data-testid="menu-sub-item-omitted">
                      Never mounted
                    </Menu.Item>
                  </Menu.Content>
                </Menu>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        <Span data-testid="menu-sub-action" fontSize="3.5r" color="design.text.base">
          Sub Action: {action ?? 'None'}
        </Span>
        <Span data-testid="menu-sub-logs" fontSize="3.5r" color="design.text.base">
          Sub Logs: {subLogs.join(',')}
        </Span>
        <Span data-testid="menu-sub-root-logs" fontSize="3.5r" color="design.text.base">
          Sub Root Logs: {rootLogs.join(',')}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Links = () => {
  const [action, setAction] = React.useState<string | null>(null)
  const [selectEvent, setSelectEvent] = React.useState<string>('none')
  const [openLogs, setOpenLogs] = React.useState<string[]>([])

  const recordSelect = (label: string) => (event: Event) => {
    setAction(label)
    setSelectEvent(`${event.type}:${(event as MouseEvent).detail ?? ''}:${event.defaultPrevented}`)
  }

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        <Div mb="4r">
          <Popover onOpenChange={next => setOpenLogs(prev => [...prev, String(next)])}>
            <EntryTrigger data-testid="btn-link-trigger">Open Links</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-link-root">
                <Menu.LinkItem
                  data-testid="menu-link-help"
                  href="#help-section"
                  onSelect={recordSelect('Help')}
                >
                  Help
                </Menu.LinkItem>
                <Menu.LinkItem
                  data-testid="menu-link-download"
                  href="#dl-section"
                  download="report.csv"
                  onSelect={recordSelect('Download')}
                >
                  Download
                </Menu.LinkItem>
                <Menu.LinkItem
                  data-testid="menu-link-blank"
                  href="#blank-section"
                  target="_blank"
                  rel="noreferrer"
                  onSelect={recordSelect('Blank')}
                >
                  Blank
                </Menu.LinkItem>
                <Menu.LinkItem
                  data-testid="menu-link-stay"
                  href="#stay-section"
                  closeOnSelect={false}
                  onSelect={recordSelect('Stay')}
                >
                  Stay open
                </Menu.LinkItem>
                <Menu.LinkItem
                  data-testid="menu-link-disabled"
                  href="#nope-section"
                  disabled
                  onSelect={recordSelect('Disabled')}
                >
                  Disabled
                </Menu.LinkItem>
                <Menu.Item
                  data-testid="menu-link-plain"
                  onSelect={recordSelect('Plain')}
                >
                  Plain
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        <div id="help-section" />
        <div id="stay-section" />

        <Span data-testid="menu-link-action" fontSize="3.5r" color="design.text.base">
          Link Action: {action ?? 'None'}
        </Span>
        <Span data-testid="menu-link-select-event" fontSize="3.5r" color="design.text.base">
          Link Select Event: {selectEvent}
        </Span>
        <Span data-testid="menu-link-open-logs" fontSize="3.5r" color="design.text.base">
          Link Open Logs: {openLogs.join(',')}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

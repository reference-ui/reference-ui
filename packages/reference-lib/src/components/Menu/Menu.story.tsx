import * as React from 'react'
import { createPortal } from 'react-dom'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Popover, type PopoverTriggerProps } from '../Popover'
import { Overlay } from '../Overlay'
import { Menu, useMenuContextKeys, useMenuTriggerKeys } from './index'

// Popover.Trigger with Menu keyboard-entry wiring (ArrowDown/Enter/Space open
// on the first item, ArrowUp on the last; pointer opens focus the menu).
const EntryTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(function EntryTrigger(
  { children, onKeyDown, onClick, 'aria-haspopup': ariaHasPopup = 'menu', ...props }: PopoverTriggerProps,
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
      aria-haspopup={ariaHasPopup}
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
            <Popover.Content placement="bottom-start" aria-label="Actions">
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
                    {/* Inert inside-chrome: composed inside path that selects
                        nothing (CLOSE-02: background/trigger/chrome presses). */}
                    <div data-testid="menu-sub-pad" style={{ height: 16 }} />
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
  const [nestedOpen, setNestedOpen] = React.useState(false)
  const [nestedLogs, setNestedLogs] = React.useState<string[]>([])
  const [nestedRootLogs, setNestedRootLogs] = React.useState<string[]>([])

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
                  data-testid="menu-link-cancel"
                  href="#cancel-section"
                  onSelect={e => {
                    e.preventDefault()
                    setAction('CancelObserved')
                  }}
                >
                  Cancel
                </Menu.LinkItem>
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

        {/* LINK-06: target/download links inside a nested submenu. */}
        <Div mb="4r">
          <Popover onOpenChange={next => setNestedRootLogs(prev => [...prev, String(next)])}>
            <EntryTrigger data-testid="btn-link-nested-trigger">Open Nested Links</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-link-nested-root">
                <Menu.Item data-testid="menu-link-nested-plain">Plain</Menu.Item>
                <Menu
                  open={nestedOpen}
                  onOpen={() => {
                    setNestedLogs(prev => [...prev, 'nested:onOpen'])
                    setNestedOpen(true)
                  }}
                  onDismiss={() => {
                    setNestedLogs(prev => [...prev, 'nested:onDismiss'])
                    setNestedOpen(false)
                  }}
                >
                  <Menu.Trigger data-testid="menu-link-nested-trigger">
                    More links
                  </Menu.Trigger>
                  <Menu.Content data-testid="menu-link-nested-content">
                    <Menu.LinkItem
                      data-testid="menu-link-nested-blank"
                      href="#nested-blank"
                      target="_blank"
                      rel="noreferrer"
                      onSelect={recordSelect('NestedBlank')}
                    >
                      Nested blank
                    </Menu.LinkItem>
                    <Menu.LinkItem
                      data-testid="menu-link-nested-download"
                      href="#nested-dl"
                      download="nested.csv"
                      onSelect={recordSelect('NestedDownload')}
                    >
                      Nested download
                    </Menu.LinkItem>
                  </Menu.Content>
                </Menu>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        <div id="help-section" />
        <div id="stay-section" />
        <div id="nested-dl" />

        <Span data-testid="menu-link-nested-logs" fontSize="3.5r" color="design.text.base">
          Nested Logs: {nestedLogs.join(',')}
        </Span>
        <Span data-testid="menu-link-nested-root-logs" fontSize="3.5r" color="design.text.base">
          Nested Root Logs: {nestedRootLogs.join(',')}
        </Span>
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

function ShadowMenuInner() {
  const [shareOpen, setShareOpen] = React.useState(false)
  const [subLogs, setSubLogs] = React.useState<string[]>([])
  const [rootLogs, setRootLogs] = React.useState<string[]>([])
  const [action, setAction] = React.useState<string | null>(null)

  return (
    <div data-testid="menu-shadow-inner">
      <Popover onOpenChange={next => setRootLogs(prev => [...prev, String(next)])}>
        <EntryTrigger data-testid="btn-shadow-trigger">Open Shadow</EntryTrigger>
        <Popover.Content placement="bottom-start">
          <Menu data-testid="menu-shadow-content">
            <Menu.Item
              data-testid="menu-shadow-item-edit"
              onSelect={() => setAction('Edit')}
            >
              Edit Document
            </Menu.Item>
            <Menu.Item
              data-testid="menu-shadow-item-duplicate"
              textValue="Zulu"
              onSelect={() => setAction('Duplicate')}
            >
              Duplicate
            </Menu.Item>
            {/* Inert inside-pad: composed inside path that selects nothing.
                Inline style survives the unstyled shadow root. */}
            <div data-testid="menu-shadow-pad" style={{ height: 20 }} />
            <Menu
              open={shareOpen}
              onOpen={() => {
                setSubLogs(prev => [...prev, 'share:onOpen'])
                setShareOpen(true)
              }}
              onDismiss={() => {
                setSubLogs(prev => [...prev, 'share:onDismiss'])
                setShareOpen(false)
              }}
            >
              <Menu.Trigger data-testid="menu-shadow-sub-trigger">Share</Menu.Trigger>
              <Menu.Content data-testid="menu-shadow-sub-content">
                <Menu.Item
                  data-testid="menu-shadow-sub-item-email"
                  onSelect={() => setAction('Email')}
                >
                  Email
                </Menu.Item>
                <Menu.Item
                  data-testid="menu-shadow-sub-item-copy"
                  onSelect={() => setAction('Copy')}
                >
                  Copy link
                </Menu.Item>
              </Menu.Content>
            </Menu>
          </Menu>
        </Popover.Content>
      </Popover>

      <Span data-testid="menu-shadow-action" fontSize="3.5r" color="design.text.base">
        Shadow Action: {action ?? 'None'}
      </Span>
      <Span data-testid="menu-shadow-sub-logs" fontSize="3.5r" color="design.text.base">
        Sub Logs: {subLogs.join(',')}
      </Span>
      <Span data-testid="menu-shadow-root-logs" fontSize="3.5r" color="design.text.base">
        Sub Root Logs: {rootLogs.join(',')}
      </Span>
    </div>
  )
}

export const Choice = () => {
  const [grid, setGrid] = React.useState(false)
  const [guides, setGuides] = React.useState(true)
  const [sort, setSort] = React.useState<string | null>('name')
  const [changeLogs, setChangeLogs] = React.useState<string[]>([])
  const [selectLogs, setSelectLogs] = React.useState<string[]>([])
  const [openLogs, setOpenLogs] = React.useState<string[]>([])
  const [closeLogs, setCloseLogs] = React.useState<string[]>([])
  const [aliasLogs, setAliasLogs] = React.useState<string[]>([])
  const [cancelAction, setCancelAction] = React.useState<string | null>(null)

  const logChange = (label: string) => (next: unknown) => {
    setChangeLogs(prev => [...prev, `${label}:${String(next)}`])
  }
  const logSelect = (label: string) => (event: Event) => {
    const key = (event as KeyboardEvent).key
    const detail = (event as MouseEvent).detail
    setSelectLogs(prev => [...prev, `${label}:${event.type}:${key ?? detail ?? ''}`])
  }

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        {/* Main choice menu: controlled toggles + sort group + plain item */}
        <Div mb="4r">
          <Popover onOpenChange={next => setOpenLogs(prev => [...prev, String(next)])}>
            <EntryTrigger data-testid="btn-choice-trigger">Open Choice</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-choice-root">
                <Menu.CheckboxItem
                  data-testid="choice-grid"
                  checked={grid}
                  onChange={next => {
                    logChange('grid')(next)
                    setGrid(next)
                  }}
                  onSelect={logSelect('grid')}
                >
                  Show grid
                </Menu.CheckboxItem>
                <Menu.CheckboxItem
                  data-testid="choice-guides"
                  checked={guides}
                  onChange={next => {
                    logChange('guides')(next)
                    setGuides(next)
                  }}
                  onSelect={logSelect('guides')}
                >
                  Show guides
                </Menu.CheckboxItem>
                <Menu.CheckboxItem
                  data-testid="choice-mixed"
                  checked="mixed"
                  onChange={logChange('mixed')}
                  onSelect={logSelect('mixed')}
                >
                  Mixed state
                </Menu.CheckboxItem>
                <Menu.Separator />
                <Menu.RadioGroup
                  data-testid="choice-sort-group"
                  aria-label="Sort by"
                  value={sort}
                  onChange={next => {
                    logChange('sort')(next)
                    setSort(next)
                  }}
                >
                  <Menu.RadioItem
                    data-testid="choice-sort-name"
                    value="name"
                    onSelect={logSelect('sort-name')}
                  >
                    Name
                  </Menu.RadioItem>
                  <Menu.RadioItem
                    data-testid="choice-sort-date"
                    value="date"
                    onSelect={logSelect('sort-date')}
                  >
                    Date
                  </Menu.RadioItem>
                  <Menu.RadioItem data-testid="choice-sort-size" value="size" disabled>
                    Size
                  </Menu.RadioItem>
                </Menu.RadioGroup>
                <Menu.Separator />
                <Menu.Item
                  data-testid="choice-plain"
                  onSelect={logSelect('plain')}
                >
                  Plain action
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* Close-policy menu: explicit closeOnSelect=true choices */}
        <Div mb="4r">
          <Popover onOpenChange={next => setCloseLogs(prev => [...prev, String(next)])}>
            <EntryTrigger data-testid="btn-choice-close-trigger">Open Choice Close</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-choice-close-root">
                <Menu.CheckboxItem
                  data-testid="choice-close-check"
                  checked={false}
                  onChange={logChange('close-check')}
                  closeOnSelect
                >
                  Closing check
                </Menu.CheckboxItem>
                <Menu.RadioGroup
                  aria-label="Close group"
                  value="a"
                  onChange={logChange('close-radio')}
                >
                  <Menu.RadioItem data-testid="choice-close-radio" value="b" closeOnSelect>
                    Closing radio
                  </Menu.RadioItem>
                </Menu.RadioGroup>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* Cancel menu: native + select cancellation */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-choice-cancel-trigger">Open Choice Cancel</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-choice-cancel-root">
                <Menu.CheckboxItem
                  data-testid="choice-cancel-native"
                  checked={false}
                  onClick={e => e.preventDefault()}
                  onChange={() => setCancelAction('NativeCancel')}
                >
                  Native Cancel
                </Menu.CheckboxItem>
                <Menu.CheckboxItem
                  data-testid="choice-cancel-select"
                  checked={false}
                  onSelect={e => {
                    e.preventDefault()
                    setCancelAction('SelectCancel')
                  }}
                  onChange={() => setCancelAction('SelectChange')}
                >
                  Select Cancel
                </Menu.CheckboxItem>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* Alias menu: W-28 onCheckedChange/onValueChange naming */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-choice-alias-trigger">Open Choice Alias</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-choice-alias-root">
                <Menu.CheckboxItem
                  data-testid="choice-alias-check"
                  checked={false}
                  onCheckedChange={next => setAliasLogs(prev => [...prev, `alias-check:${next}`])}
                >
                  Alias check
                </Menu.CheckboxItem>
                <Menu.RadioGroup
                  aria-label="Alias group"
                  value="a"
                  onValueChange={next => setAliasLogs(prev => [...prev, `alias-radio:${next}`])}
                >
                  <Menu.RadioItem data-testid="choice-alias-radio" value="b">
                    Alias radio
                  </Menu.RadioItem>
                </Menu.RadioGroup>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        <Span data-testid="menu-choice-change-logs" fontSize="3.5r" color="design.text.base">
          Choice Changes: {changeLogs.join(',')}
        </Span>
        <Span data-testid="menu-choice-select-logs" fontSize="3.5r" color="design.text.base">
          Choice Selects: {selectLogs.join(',')}
        </Span>
        <Span data-testid="menu-choice-open-logs" fontSize="3.5r" color="design.text.base">
          Choice Open Logs: {openLogs.join(',')}
        </Span>
        <Span data-testid="menu-choice-close-logs" fontSize="3.5r" color="design.text.base">
          Choice Close Logs: {closeLogs.join(',')}
        </Span>
        <Span data-testid="menu-choice-alias-logs" fontSize="3.5r" color="design.text.base">
          Choice Alias Logs: {aliasLogs.join(',')}
        </Span>
        <Span data-testid="menu-choice-cancel-display" fontSize="3.5r" color="design.text.base">
          Choice Cancel: {cancelAction ?? 'None'}
        </Span>
        <Span data-testid="menu-choice-state" fontSize="3.5r" color="design.text.base">
          Choice State: grid={String(grid)},guides={String(guides)},sort={String(sort)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Adjacent = () => {
  const [fileLogs, setFileLogs] = React.useState<string[]>([])
  const [editLogs, setEditLogs] = React.useState<string[]>([])
  const [action, setAction] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        {/* Two adjacent menus, no Menubar: baseline outside-dismiss must
            compose — pressing Edit while File is open closes File. */}
        <Div mb="4r" display="flex" gap="2r">
          <Popover onOpenChange={next => setFileLogs(prev => [...prev, String(next)])}>
            <EntryTrigger data-testid="btn-file-trigger">File</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-file-root">
                <Menu.Item
                  data-testid="menu-file-new"
                  onSelect={() => setAction('New')}
                >
                  New
                </Menu.Item>
                <Menu.Item
                  data-testid="menu-file-open"
                  onSelect={() => setAction('Open')}
                >
                  Open
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
          <Popover onOpenChange={next => setEditLogs(prev => [...prev, String(next)])}>
            <EntryTrigger data-testid="btn-edit-trigger">Edit</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-edit-root">
                <Menu.Item
                  data-testid="menu-edit-cut"
                  onSelect={() => setAction('Cut')}
                >
                  Cut
                </Menu.Item>
                <Menu.Item
                  data-testid="menu-edit-copy"
                  onSelect={() => setAction('Copy')}
                >
                  Copy
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        <Span data-testid="menu-adjacent-action" fontSize="3.5r" color="design.text.base">
          Adjacent Action: {action ?? 'None'}
        </Span>
        <Span data-testid="menu-adjacent-file-logs" fontSize="3.5r" color="design.text.base">
          File Logs: {fileLogs.join(',')}
        </Span>
        <Span data-testid="menu-adjacent-edit-logs" fontSize="3.5r" color="design.text.base">
          Edit Logs: {editLogs.join(',')}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Shadow = () => {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const [shadow, setShadow] = React.useState<ShadowRoot | null>(null)

  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (host.shadowRoot) {
      setShadow(host.shadowRoot)
      return
    }
    setShadow(host.attachShadow({ mode: 'open' }))
  }, [])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        <button data-testid="btn-shadow-outside" type="button">
          Outside
        </button>
        <div ref={hostRef} data-testid="menu-shadow-host" />
        {shadow ? createPortal(<ShadowMenuInner />, shadow) : null}
      </Div>
    </ReferenceLibrary>
  )
}

export const SubmenuRtl = () => {
  const [shareOpen, setShareOpen] = React.useState(false)
  const [logs, setLogs] = React.useState<string[]>([])
  const [action, setAction] = React.useState<string | null>(null)
  const log = (entry: string) => setLogs(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <div dir="rtl">
        <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
          <Popover>
            <EntryTrigger data-testid="btn-rtl-trigger">Open RTL</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-rtl-root">
                <Menu.Item
                  data-testid="menu-rtl-item-new"
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
                  <Menu.Trigger data-testid="menu-rtl-trigger">Share</Menu.Trigger>
                  <Menu.Content data-testid="menu-rtl-content">
                    <Menu.Item
                      data-testid="menu-rtl-item-email"
                      onSelect={() => setAction('Email')}
                    >
                      Email
                    </Menu.Item>
                    <Menu.Item
                      data-testid="menu-rtl-item-copy"
                      onSelect={() => setAction('Copy')}
                    >
                      Copy link
                    </Menu.Item>
                  </Menu.Content>
                </Menu>
              </Menu>
            </Popover.Content>
          </Popover>

          <Span data-testid="menu-rtl-action" fontSize="3.5r" color="design.text.base">
            RTL Action: {action ?? 'None'}
          </Span>
          <Span data-testid="menu-rtl-logs" fontSize="3.5r" color="design.text.base">
            RTL Logs: {logs.join(',')}
          </Span>
        </Div>
      </div>
    </ReferenceLibrary>
  )
}

export const SubmenuProbe = () => {
  const [rejectLogs, setRejectLogs] = React.useState<string[]>([])
  const [cancelLogs, setCancelLogs] = React.useState<string[]>([])
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [disabledLogs, setDisabledLogs] = React.useState<string[]>([])
  const [disabledOpen, setDisabledOpen] = React.useState(false)
  const [removeOpen, setRemoveOpen] = React.useState(false)
  const [removeLogs, setRemoveLogs] = React.useState<string[]>([])
  const [showTrigger, setShowTrigger] = React.useState(true)
  const [triggerDisabled, setTriggerDisabled] = React.useState(false)
  const [dynOpen, setDynOpen] = React.useState(false)
  const [dynPresent, setDynPresent] = React.useState(true)
  const [dynParent, setDynParent] = React.useState<'a' | 'b'>('a')
  const [dynLogs, setDynLogs] = React.useState<string[]>([])
  const [triggerId, setTriggerId] = React.useState('probe-id-trigger-v1')
  const [idOpen, setIdOpen] = React.useState(false)
  const [idLogs, setIdLogs] = React.useState<string[]>([])
  const [explicitOpen, setExplicitOpen] = React.useState(false)
  const [flipOpen, setFlipOpen] = React.useState(false)
  const [flipLogs, setFlipLogs] = React.useState<string[]>([])
  const [extOpen, setExtOpen] = React.useState(false)
  const [extShareOpen, setExtShareOpen] = React.useState(false)
  const [extLogs, setExtLogs] = React.useState<string[]>([])

  const dynMenu =
    dynPresent ? (
      <Menu
        open={dynOpen}
        onOpen={() => {
          setDynLogs(prev => [...prev, 'dyn:onOpen'])
          setDynOpen(true)
        }}
        onDismiss={() => {
          setDynLogs(prev => [...prev, 'dyn:onDismiss'])
          setDynOpen(false)
        }}
      >
        <Menu.Trigger data-testid="probe-dyn-trigger">Dyn</Menu.Trigger>
        <Menu.Content data-testid="probe-dyn-content">
          <Menu.Item data-testid="probe-dyn-item">Dyn Item</Menu.Item>
        </Menu.Content>
      </Menu>
    ) : null

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        {/* SUBKEY-06: rejected open + rejected close stay visibly controlled. */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-probe-reject-trigger">Open Reject</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-probe-reject-root">
                <Menu
                  open={false}
                  onOpen={() => setRejectLogs(prev => [...prev, 'reject-open:onOpen'])}
                  onDismiss={() => setRejectLogs(prev => [...prev, 'reject-open:onDismiss'])}
                >
                  <Menu.Trigger data-testid="probe-reject-open-trigger">
                    Reject Open
                  </Menu.Trigger>
                  <Menu.Content data-testid="probe-reject-open-content">
                    <Menu.Item>Never mounted</Menu.Item>
                  </Menu.Content>
                </Menu>
                <Menu
                  open
                  onOpen={() => setRejectLogs(prev => [...prev, 'reject-close:onOpen'])}
                  onDismiss={() => setRejectLogs(prev => [...prev, 'reject-close:onDismiss'])}
                >
                  <Menu.Trigger data-testid="probe-reject-close-trigger">
                    Reject Close
                  </Menu.Trigger>
                  <Menu.Content data-testid="probe-reject-close-content">
                    <Menu.Item data-testid="probe-reject-close-item">Pinned</Menu.Item>
                  </Menu.Content>
                </Menu>
              </Menu>
            </Popover.Content>
          </Popover>
          <Span data-testid="menu-probe-reject-logs" fontSize="3.5r" color="design.text.base">
            Reject Logs: {rejectLogs.join(',')}
          </Span>
        </Div>

        {/* SUBKEY-07: consumer key cancellation wins before submenu defaults. */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-probe-cancel-trigger">Open Cancel</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-probe-cancel-root">
                <Menu
                  open={cancelOpen}
                  onOpen={() => {
                    setCancelLogs(prev => [...prev, 'cancel:onOpen'])
                    setCancelOpen(true)
                  }}
                  onDismiss={() => {
                    setCancelLogs(prev => [...prev, 'cancel:onDismiss'])
                    setCancelOpen(false)
                  }}
                >
                  <Menu.Trigger
                    data-testid="probe-cancel-trigger"
                    onKeyDown={e => {
                      setCancelLogs(prev => [...prev, 'trigger:cancelled'])
                      e.preventDefault()
                    }}
                  >
                    Cancel Keys
                  </Menu.Trigger>
                  <Menu.Content data-testid="probe-cancel-content">
                    <Menu.Item
                      data-testid="probe-cancel-item"
                      onKeyDown={e => {
                        setCancelLogs(prev => [...prev, 'item:cancelled'])
                        e.preventDefault()
                      }}
                    >
                      Cancel Child
                    </Menu.Item>
                    <Menu.Item data-testid="probe-cancel-item-2">Sibling</Menu.Item>
                  </Menu.Content>
                </Menu>
              </Menu>
            </Popover.Content>
          </Popover>
          <Span data-testid="menu-probe-cancel-logs" fontSize="3.5r" color="design.text.base">
            Cancel Logs: {cancelLogs.join(',')}
          </Span>
        </Div>

        {/* SUBKEY-08: disabled triggers stay inert, even externally open. */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-probe-disabled-trigger">
              Open Disabled
            </EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-probe-disabled-root">
                <Menu.Item data-testid="probe-disabled-sibling">Sibling</Menu.Item>
                <Menu
                  open={disabledOpen}
                  onOpen={() => {
                    setDisabledLogs(prev => [...prev, 'disabled:onOpen'])
                    setDisabledOpen(true)
                  }}
                  onDismiss={() => {
                    setDisabledLogs(prev => [...prev, 'disabled:onDismiss'])
                    setDisabledOpen(false)
                  }}
                >
                  <Menu.Trigger data-testid="probe-disabled-trigger" disabled>
                    Disabled Sub
                  </Menu.Trigger>
                  <Menu.Content data-testid="probe-disabled-content">
                    <Menu.Item>Never mounted</Menu.Item>
                  </Menu.Content>
                </Menu>
                <Menu
                  open
                  onOpen={() => setDisabledLogs(prev => [...prev, 'ext:onOpen'])}
                  onDismiss={() => setDisabledLogs(prev => [...prev, 'ext:onDismiss'])}
                >
                  <Menu.Trigger data-testid="probe-disabled-ext-trigger" disabled>
                    Externally Open
                  </Menu.Trigger>
                  <Menu.Content data-testid="probe-disabled-ext-content">
                    <Menu.Item data-testid="probe-disabled-ext-item">Pinned</Menu.Item>
                  </Menu.Content>
                </Menu>
              </Menu>
            </Popover.Content>
          </Popover>
          <Span data-testid="menu-probe-disabled-logs" fontSize="3.5r" color="design.text.base">
            Disabled Logs: {disabledLogs.join(',')}
          </Span>
        </Div>

        {/* CLOSE-06: trigger removed or disabled before close falls back live. */}
        <Div mb="4r">
          <button data-testid="btn-probe-remove-hide" type="button" onClick={() => setShowTrigger(false)}>
            Hide trigger
          </button>
          <button
            data-testid="btn-probe-remove-disable"
            type="button"
            onClick={() => setTriggerDisabled(true)}
          >
            Disable trigger
          </button>
          <Popover>
            <EntryTrigger data-testid="btn-probe-remove-trigger">Open Remove</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-probe-remove-root">
                <Menu.Item data-testid="probe-remove-first">First</Menu.Item>
                <Menu
                  open={removeOpen}
                  onOpen={() => {
                    setRemoveLogs(prev => [...prev, 'remove:onOpen'])
                    setRemoveOpen(true)
                  }}
                  onDismiss={() => {
                    setRemoveLogs(prev => [...prev, 'remove:onDismiss'])
                    setRemoveOpen(false)
                  }}
                >
                  {showTrigger ? (
                    <Menu.Trigger data-testid="probe-remove-trigger" disabled={triggerDisabled}>
                      Vanishing
                    </Menu.Trigger>
                  ) : null}
                  <Menu.Content data-testid="probe-remove-content">
                    <Menu.Item data-testid="probe-remove-item">Child</Menu.Item>
                  </Menu.Content>
                </Menu>
                <Menu.Item data-testid="probe-remove-last">Last</Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
          <Span data-testid="menu-probe-remove-logs" fontSize="3.5r" color="design.text.base">
            Remove Logs: {removeLogs.join(',')}
          </Span>
        </Div>

        {/* DYNAMIC-02: open submenu removed or reparented cleans ownership. */}
        <Div mb="4r">
          <button data-testid="btn-probe-dyn-remove" type="button" onClick={() => setDynPresent(false)}>
            Remove submenu
          </button>
          <button
            data-testid="btn-probe-dyn-move"
            type="button"
            onClick={() => setDynParent(prev => (prev === 'a' ? 'b' : 'a'))}
          >
            Move submenu
          </button>
          <Popover>
            <EntryTrigger data-testid="btn-probe-dyn-trigger-a">Open Dyn A</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-probe-dyn-root-a">
                <Menu.Item data-testid="probe-dyn-item-a1">A One</Menu.Item>
                {dynParent === 'a' ? dynMenu : null}
              </Menu>
            </Popover.Content>
          </Popover>
          <Popover>
            <EntryTrigger data-testid="btn-probe-dyn-trigger-b">Open Dyn B</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-probe-dyn-root-b">
                <Menu.Item data-testid="probe-dyn-item-b1">B One</Menu.Item>
                {dynParent === 'b' ? dynMenu : null}
              </Menu>
            </Popover.Content>
          </Popover>
          <Span data-testid="menu-probe-dyn-logs" fontSize="3.5r" color="design.text.base">
            Dyn Logs: {dynLogs.join(',')}
          </Span>
          <Span data-testid="menu-probe-dyn-parent" fontSize="3.5r" color="design.text.base">
            Dyn Parent: {dynParent}
          </Span>
        </Div>

        {/* DYNAMIC-04: trigger id change keeps one live relationship. */}
        <Div mb="4r">
          <button
            data-testid="btn-probe-id-change"
            type="button"
            onClick={() => setTriggerId('probe-id-trigger-v2')}
          >
            Change trigger id
          </button>
          <Popover>
            <EntryTrigger data-testid="btn-probe-id-trigger">Open Id</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-probe-id-root">
                <Menu
                  open={idOpen}
                  onOpen={() => {
                    setIdLogs(prev => [...prev, 'idsub:onOpen'])
                    setIdOpen(true)
                  }}
                  onDismiss={() => {
                    setIdLogs(prev => [...prev, 'idsub:onDismiss'])
                    setIdOpen(false)
                  }}
                >
                  <Menu.Trigger data-testid="probe-id-trigger" id={triggerId}>
                    Renaming
                  </Menu.Trigger>
                  <Menu.Content data-testid="probe-id-content">
                    <Menu.Item data-testid="probe-id-item">Child</Menu.Item>
                  </Menu.Content>
                </Menu>
              </Menu>
            </Popover.Content>
          </Popover>
          <Span data-testid="menu-probe-id-logs" fontSize="3.5r" color="design.text.base">
            Id Logs: {idLogs.join(',')}
          </Span>
        </Div>

        {/* DOM-10: explicit placement/offset/collision + consumer transform. */}
        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-probe-explicit-trigger">
              Open Explicit
            </EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-probe-explicit-root">
                <Menu
                  open={explicitOpen}
                  onOpen={() => setExplicitOpen(true)}
                  onDismiss={() => setExplicitOpen(false)}
                >
                  <Menu.Trigger data-testid="probe-explicit-trigger">Placed</Menu.Trigger>
                  <Menu.Content
                    data-testid="probe-explicit-content"
                    placement="bottom-start"
                    offset={12}
                    collisionPadding={16}
                    style={{ transform: 'translateX(4px)' }}
                  >
                    <Menu.Item data-testid="probe-explicit-item">Child</Menu.Item>
                  </Menu.Content>
                </Menu>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        {/* INTENT-06: right-edge menu forces a left collision flip. */}
        <Div mb="4r" style={{ position: 'fixed', right: 8, top: 120 }}>
          <Popover>
            <EntryTrigger data-testid="btn-probe-flip-trigger">Open Flip</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-probe-flip-root">
                <Menu
                  open={flipOpen}
                  onOpen={() => {
                    setFlipLogs(prev => [...prev, 'flip:onOpen'])
                    setFlipOpen(true)
                  }}
                  onDismiss={() => {
                    setFlipLogs(prev => [...prev, 'flip:onDismiss'])
                    setFlipOpen(false)
                  }}
                >
                  <Menu.Trigger data-testid="probe-flip-trigger">Flip</Menu.Trigger>
                  <Menu.Content data-testid="probe-flip-content">
                    <Menu.Item data-testid="probe-flip-item">Child</Menu.Item>
                  </Menu.Content>
                </Menu>
              </Menu>
            </Popover.Content>
          </Popover>
          <Span data-testid="menu-probe-flip-logs" fontSize="3.5r" color="design.text.base">
            Flip Logs: {flipLogs.join(',')}
          </Span>
        </Div>

        {/* CLOSE-09: unregistered extension overlay stops later mouse events. */}
        <Div mb="4r">
          <button
            data-testid="probe-extension"
            type="button"
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            Extension
          </button>
          <Popover open={extOpen} onOpenChange={setExtOpen}>
            <EntryTrigger data-testid="btn-probe-ext-trigger">Open Ext</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-probe-ext-root">
                <Menu.Item data-testid="probe-ext-item">Root Item</Menu.Item>
                <Menu
                  open={extShareOpen}
                  onOpen={() => {
                    setExtLogs(prev => [...prev, 'share:onOpen'])
                    setExtShareOpen(true)
                  }}
                  onDismiss={() => {
                    setExtLogs(prev => [...prev, 'share:onDismiss'])
                    setExtShareOpen(false)
                  }}
                >
                  <Menu.Trigger data-testid="probe-ext-trigger">Share</Menu.Trigger>
                  <Menu.Content data-testid="probe-ext-content">
                    <Menu.Item data-testid="probe-ext-sub-item">Email</Menu.Item>
                  </Menu.Content>
                </Menu>
              </Menu>
            </Popover.Content>
          </Popover>
          <Span data-testid="menu-probe-ext-logs" fontSize="3.5r" color="design.text.base">
            Ext Logs: {extLogs.join(',')}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const ChoiceDynamic = () => {
  const [checks, setChecks] = React.useState([
    { id: 'alpha', label: 'Alpha' },
    { id: 'beta', label: 'Beta' },
  ])
  const [checked, setChecked] = React.useState<Record<string, boolean>>({ alpha: false, beta: true })
  const [sort, setSort] = React.useState<string | null>('name')
  const [sortRadios, setSortRadios] = React.useState(['name', 'date'])
  const [viewRadios, setViewRadios] = React.useState<string[]>([])
  const [disabledId, setDisabledId] = React.useState<string | null>(null)
  const [changeLogs, setChangeLogs] = React.useState<string[]>([])
  const [selectLogs, setSelectLogs] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        <Div mb="4r" display="flex" gap="2r">
          <button
            data-testid="btn-dyn-add-check"
            type="button"
            onClick={() => setChecks(prev => [...prev, { id: 'gamma', label: 'Gamma' }])}
          >
            Add Gamma
          </button>
          <button
            data-testid="btn-dyn-remove-check"
            type="button"
            onClick={() => setChecks(prev => prev.slice(1))}
          >
            Remove first
          </button>
          <button
            data-testid="btn-dyn-reverse-radios"
            type="button"
            onClick={() => setSortRadios(prev => [...prev].reverse())}
          >
            Reverse radios
          </button>
          <button
            data-testid="btn-dyn-move-radio"
            type="button"
            onClick={() => {
              setSortRadios(prev => prev.filter(v => v !== 'date'))
              setViewRadios(prev => (prev.includes('date') ? prev : [...prev, 'date']))
            }}
          >
            Move date to View
          </button>
          <button
            data-testid="btn-dyn-disable-beta"
            type="button"
            onClick={() => setDisabledId('beta')}
          >
            Disable Beta
          </button>
        </Div>

        <Div mb="4r">
          <Popover>
            <EntryTrigger data-testid="btn-dyn-choice-trigger">Open Dynamic</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-dyn-choice-root">
                {checks.map(check => (
                  <Menu.CheckboxItem
                    key={check.id}
                    data-testid={`dyn-check-${check.id}`}
                    checked={checked[check.id] ?? false}
                    disabled={disabledId === check.id}
                    onChange={next => {
                      setChangeLogs(prev => [...prev, `${check.id}:${String(next)}`])
                      setChecked(prev => ({ ...prev, [check.id]: next }))
                    }}
                    onSelect={() => setSelectLogs(prev => [...prev, check.id])}
                  >
                    {check.label}
                  </Menu.CheckboxItem>
                ))}
                <Menu.RadioGroup
                  data-testid="dyn-sort-group"
                  aria-label="Sort by"
                  value={sort}
                  onChange={next => {
                    setChangeLogs(prev => [...prev, `sort:${next}`])
                    setSort(next)
                  }}
                >
                  {sortRadios.map(value => (
                    <Menu.RadioItem
                      key={value}
                      data-testid={`dyn-radio-${value}`}
                      value={value}
                      onSelect={() => setSelectLogs(prev => [...prev, `radio:${value}`])}
                    >
                      {value}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
                <Menu.RadioGroup data-testid="dyn-view-group" aria-label="View as" value={null}>
                  {viewRadios.map(value => (
                    <Menu.RadioItem key={value} data-testid={`dyn-radio-${value}`} value={value}>
                      {value}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        <Span data-testid="menu-dyn-choice-change-logs" fontSize="3.5r" color="design.text.base">
          Dyn Changes: {changeLogs.join(',')}
        </Span>
        <Span data-testid="menu-dyn-choice-select-logs" fontSize="3.5r" color="design.text.base">
          Dyn Selects: {selectLogs.join(',')}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const LinksDynamic = () => {
  const [links, setLinks] = React.useState([
    { id: 'docs', href: '#old-section', label: 'Old docs' },
    { id: 'api', href: '#api-section', label: 'Api' },
  ])
  const [disabledId, setDisabledId] = React.useState<string | null>(null)
  const [stayOpen, setStayOpen] = React.useState(false)
  const [action, setAction] = React.useState<string | null>(null)
  const [openLogs, setOpenLogs] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        <Div mb="4r" display="flex" gap="2r">
          <button
            data-testid="btn-dyn-link-retarget"
            type="button"
            onClick={() =>
              setLinks(prev =>
                prev.map(link =>
                  link.id === 'docs'
                    ? { ...link, href: '#new-section', label: 'New docs' }
                    : link
                )
              )
            }
          >
            Retarget docs
          </button>
          <button
            data-testid="btn-dyn-link-disable"
            type="button"
            onClick={() => setDisabledId('docs')}
          >
            Disable docs
          </button>
          <button
            data-testid="btn-dyn-link-stay"
            type="button"
            onClick={() => setStayOpen(true)}
          >
            Docs stay open
          </button>
          <button
            data-testid="btn-dyn-link-reorder"
            type="button"
            onClick={() => setLinks(prev => [...prev].reverse())}
          >
            Reorder
          </button>
          <button
            data-testid="btn-dyn-link-remove"
            type="button"
            onClick={() => setLinks(prev => prev.filter(link => link.id !== 'api'))}
          >
            Remove api
          </button>
        </Div>

        <Div mb="4r">
          <Popover onOpenChange={next => setOpenLogs(prev => [...prev, String(next)])}>
            <EntryTrigger data-testid="btn-dyn-link-trigger">Open Dynamic Links</EntryTrigger>
            <Popover.Content placement="bottom-start">
              <Menu data-testid="menu-dyn-link-root">
                {links.map(link => (
                  <Menu.LinkItem
                    key={link.id}
                    data-testid={`dyn-link-${link.id}`}
                    href={link.href}
                    disabled={disabledId === link.id}
                    closeOnSelect={link.id === 'docs' ? !stayOpen : true}
                    onSelect={() => setAction(link.id)}
                  >
                    {link.label}
                  </Menu.LinkItem>
                ))}
              </Menu>
            </Popover.Content>
          </Popover>
        </Div>

        <div id="new-section" />
        <div id="api-section" />

        <Span data-testid="menu-dyn-link-action" fontSize="3.5r" color="design.text.base">
          Dyn Link Action: {action ?? 'None'}
        </Span>
        <Span data-testid="menu-dyn-link-open-logs" fontSize="3.5r" color="design.text.base">
          Dyn Link Open Logs: {openLogs.join(',')}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const ContextMenu = () => {
  const [open, setOpen] = React.useState(false)
  const [anchor, setAnchor] = React.useState<{ x: number; y: number } | null>(null)
  const [shareOpen, setShareOpen] = React.useState(false)
  const [logs, setLogs] = React.useState<string[]>([])
  const [action, setAction] = React.useState<string | null>(null)
  const keys = useMenuContextKeys()
  const log = (entry: string) => setLogs(prev => [...prev, entry])

  const openAt = (point: { x: number; y: number }) => {
    // A repeated source gesture closes stale submenus and reopens only root.
    setShareOpen(false)
    setAnchor(point)
    setOpen(true)
  }

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="menu-fixture-root">
        <button data-testid="ctx-outside" type="button">
          Outside
        </button>
        <div
          data-testid="ctx-target"
          tabIndex={0}
          role="button"
          aria-label="Canvas"
          style={{ padding: 24, border: '1px dashed currentColor' }}
          onContextMenu={e => {
            // Entry plants only on closed→open transitions: a repeated
            // gesture batches dismiss+reopen without unmounting, so planting
            // then would leak into the next unrelated open.
            if (!open) keys.onContextMenu(e)
            e.preventDefault()
            log('ctx:gesture')
            openAt({ x: e.clientX, y: e.clientY })
          }}
          onKeyDown={e => {
            if (!open) keys.onKeyDown(e)
            if (e.key !== 'ContextMenu' && !(e.shiftKey && (e.key === 'F10' || e.key === 'f10'))) {
              return
            }
            e.preventDefault()
            const rect = e.currentTarget.getBoundingClientRect()
            log('ctx:gesture')
            openAt({ x: rect.left + 8, y: rect.bottom - 8 })
          }}
          onClick={e => {
            // Primary click never opens a context menu.
            log(`ctx:click:${e.detail}`)
          }}
        >
          Right-click me
        </div>

        <Overlay
          open={open}
          onOpen={() => log('root:onOpen')}
          onDismiss={() => {
            log('root:onDismiss')
            setOpen(false)
          }}
          anchor={anchor ?? undefined}
        >
          <Overlay.Content placement="bottom-start">
            <Menu data-testid="menu-ctx-root">
              <Menu.Item data-testid="menu-ctx-item-edit" onSelect={() => setAction('Edit')}>
                Edit
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
                <Menu.Trigger data-testid="menu-ctx-trigger">Share</Menu.Trigger>
                <Menu.Content data-testid="menu-ctx-content">
                  <Menu.Item data-testid="menu-ctx-item-email" onSelect={() => setAction('Email')}>
                    Email
                  </Menu.Item>
                </Menu.Content>
              </Menu>
            </Menu>
          </Overlay.Content>
        </Overlay>

        <Span data-testid="menu-ctx-action" fontSize="3.5r" color="design.text.base">
          Ctx Action: {action ?? 'None'}
        </Span>
        <Span data-testid="menu-ctx-logs" fontSize="3.5r" color="design.text.base">
          Ctx Logs: {logs.join(',')}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

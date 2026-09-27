import * as React from 'react'
import { createPortal } from 'react-dom'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Popover, type PopoverTriggerProps } from '../Popover'
import { Menu, useMenuTriggerKeys } from './index'

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

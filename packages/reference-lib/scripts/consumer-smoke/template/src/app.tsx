import * as React from 'react'
import {
  AbcIcon,
  Accordion,
  announce,
  Calendar,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  createSlotCacheKey,
  DateField,
  Field,
  FocusLock,
  Listbox,
  Menu,
  NumberField,
  Overlay,
  Popover,
  Portal,
  Presence,
  Reference,
  ReferenceLibrary,
  resolveSlotVisibility,
  RovingFocus,
  Slider,
  Splitter,
  Switch,
  Tab,
  TabPanel,
  Tabs,
  TabsList,
  ToastHost,
  Tooltip,
  Tree,
  toast,
} from '@reference-ui/lib'
import { Button, Div, H1, Label, P, Span } from '@reference-ui/lib/primitives'
import {
  B11AccordionArrows,
  B11Menu,
  B11Presence,
  B11Splitter,
  B11TreeAutodetect,
  B11TreeExpander,
} from './b11'

/** Isolates one mount: a crash becomes a labeled fallback, never a cascade. */
class MountBoundary extends React.Component<
  { id: string; children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null }
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
  render() {
    if (this.state.error) {
      return (
        <div data-testid={`${this.id}-failed`}>
          MOUNT-FAILED {this.id}: {this.state.error}
        </div>
      )
    }
    return this.props.children
  }
  private get id() {
    return this.props.id
  }
}

function Mount({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section data-testid={`mount-${id}`} style={{ margin: '8px 0' }}>
      <MountBoundary id={`mount-${id}`}>{children}</MountBoundary>
    </section>
  )
}

export function App() {
  const [accordion, setAccordion] = React.useState<string | string[] | null>('a')
  const [treeValue, setTreeValue] = React.useState<string | null>(null)
  const [treeExpanded, setTreeExpanded] = React.useState<string[]>(['t-branch'])
  const [listbox, setListbox] = React.useState<string | null>('lb1')
  const [slider, setSlider] = React.useState<number | number[]>(50)
  const [splitter, setSplitter] = React.useState<number[]>([50, 50])
  const [sw, setSw] = React.useState(false)
  const [tab, setTab] = React.useState('one')
  const [overlayOpen, setOverlayOpen] = React.useState(false)

  React.useEffect(() => {
    // announce() flushSyncs: real consumers call it from event handlers, so
    // escape the mount commit the way a handler would (a bare call here trips
    // React's flushSync-in-lifecycle warning and would fail the gate).
    const timer = setTimeout(() => announce('smoke-announce-marker'), 50)
    toast.success('smoke-toast-marker')
    ;(window as any).__SMOKE_MOUNTED__ = true
    return () => clearTimeout(timer)
  }, [])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="120r" data-testid="mount-referencelibrary">
        <H1 fontSize="5r">consumer smoke</H1>

        <Mount id="accordion">
          <Accordion value={accordion} onChange={setAccordion} expansion="single">
            <Accordion.Item id="a">
              <Accordion.Trigger data-testid="smoke-acc-trigger">First</Accordion.Trigger>
              <Accordion.Content>first content</Accordion.Content>
            </Accordion.Item>
            <Accordion.Item id="b">
              <Accordion.Trigger>Second</Accordion.Trigger>
              <Accordion.Content>second content</Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </Mount>

        <Mount id="announcer">
          <div data-testid="announcer-host">announcer fires in effect</div>
        </Mount>

        <Mount id="calendar">
          <Calendar value="2026-10-15" locale="en-US" onChange={() => {}} />
        </Mount>

        <Mount id="collapsible">
          <Collapsible defaultOpen>
            <CollapsibleTrigger>toggle</CollapsibleTrigger>
            <CollapsibleContent>collapsible body</CollapsibleContent>
          </Collapsible>
        </Mount>

        <Mount id="combobox">
          <Combobox value="b" defaultInputValue="Bravo" onChange={() => {}}>
            <Combobox.Input aria-label="combo" />
            <Combobox.Popover>
              <Listbox>
                <Listbox.Option value="a">Alpha</Listbox.Option>
                <Listbox.Option value="b">Bravo</Listbox.Option>
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Mount>

        <Mount id="datefield">
          <DateField value="2026-10-20" locale="en-US" onChange={() => {}} />
        </Mount>

        <Mount id="field">
          <Field>
            <input placeholder="field input" aria-label="field input" />
          </Field>
        </Mount>

        <Mount id="focuslock">
          {/* Disabled: an always-active trap would fight the probe's own focus
              assertions (arrows check). Still proves mount + silent render. */}
          <FocusLock disabled>
            <div>
              <button type="button">lock first</button>
              <button type="button">lock last</button>
            </div>
          </FocusLock>
        </Mount>

        <Mount id="listbox">
          <Listbox selection="single" value={listbox} onChange={setListbox} aria-label="smoke list">
            <Listbox.Option value="lb1" textValue="one">
              One
            </Listbox.Option>
            <Listbox.Option value="lb2" textValue="two">
              Two
            </Listbox.Option>
          </Listbox>
        </Mount>

        <Mount id="menu">
          <Popover>
            <Popover.Trigger>menu trigger</Popover.Trigger>
            <Popover.Content>
              <Menu>
                <Menu.Item textValue="item one" onSelect={() => {}}>
                  Item one
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </Mount>

        <Mount id="numberfield">
          <NumberField value={3} locale="en-US" min={0} max={10} onChange={() => {}}>
            <NumberField.Group>
              <NumberField.Decrement aria-label="Down" />
              <NumberField.Input aria-label="number" />
              <NumberField.Increment aria-label="Up" />
            </NumberField.Group>
          </NumberField>
        </Mount>

        <Mount id="overlay">
          <button type="button" data-testid="smoke-overlay-open" onClick={() => setOverlayOpen(true)}>
            open smoke overlay
          </button>
          <Overlay open={overlayOpen} onDismiss={() => setOverlayOpen(false)}>
            <Overlay.Backdrop style={{ background: 'rgba(0,0,0,0.3)' }} />
            <Overlay.Content
              role="dialog"
              aria-label="smoke dialog"
              data-testid="smoke-overlay-content"
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ pointerEvents: 'auto', background: 'white', padding: 16 }}>
                <P>overlay content</P>
                <button
                  type="button"
                  data-testid="smoke-overlay-close"
                  onClick={() => setOverlayOpen(false)}
                >
                  close smoke overlay
                </button>
              </div>
            </Overlay.Content>
          </Overlay>
        </Mount>

        <Mount id="popover">
          <Popover open={false} onOpen={() => {}} onDismiss={() => {}}>
            <Popover.Trigger>popover trigger</Popover.Trigger>
            <Popover.Content>popover body</Popover.Content>
          </Popover>
        </Mount>

        <Mount id="portal">
          <Portal>
            <div data-testid="portal-content">portalled</div>
          </Portal>
        </Mount>

        <Mount id="presence">
          <Presence present>
            <div data-testid="presence-content">present content</div>
          </Presence>
        </Mount>

        <Mount id="reference">
          <Reference name="AccordionProps" />
        </Mount>

        <Mount id="rovingfocus">
          <RovingFocus.Root orientation="horizontal" loop>
            <div role="toolbar" aria-label="smoke toolbar">
              <RovingFocus.Item id="rf-a" textValue="A">
                <button type="button">A</button>
              </RovingFocus.Item>
              <RovingFocus.Item id="rf-b" textValue="B">
                <button type="button">B</button>
              </RovingFocus.Item>
            </div>
          </RovingFocus.Root>
        </Mount>

        <Mount id="slider">
          <Slider value={slider} onChange={setSlider} min={0} max={100} aria-label="smoke slider">
            <Slider.Track>
              <Slider.Range />
              <Slider.Thumb aria-label="thumb" />
            </Slider.Track>
          </Slider>
        </Mount>

        <Mount id="slot">
          <div data-testid="slot-result">
            {resolveSlotVisibility({ visible: true })}:{createSlotCacheKey([])}
          </div>
        </Mount>

        <Mount id="splitter">
          <div style={{ width: 600 }}>
            <Splitter value={splitter} onChange={setSplitter}>
              <Splitter.Panel index={0} minSize={10} maxSize={90}>
                <div>panel zero</div>
              </Splitter.Panel>
              <Splitter.Handle index={0} aria-label="resize" />
              <Splitter.Panel index={1} minSize={10}>
                <div>panel one</div>
              </Splitter.Panel>
            </Splitter>
          </div>
        </Mount>

        <Mount id="switch">
          <Switch checked={sw} onChange={setSw} aria-label="smoke switch">
            <Switch.Thumb />
          </Switch>
        </Mount>

        <Mount id="tabs">
          <Tabs value={tab} onChange={setTab}>
            <TabsList aria-label="smoke tabs">
              <Tab value="one">One</Tab>
              <Tab value="two">Two</Tab>
            </TabsList>
            <TabPanel value="one">panel one</TabPanel>
            <TabPanel value="two">panel two</TabPanel>
          </Tabs>
        </Mount>

        <Mount id="toast">
          <ToastHost />
        </Mount>

        <Mount id="tooltip">
          <Tooltip>
            <Tooltip.Trigger>
              <Button type="button">hover me</Button>
            </Tooltip.Trigger>
            <Tooltip.Content placement="top">tip body</Tooltip.Content>
          </Tooltip>
        </Mount>

        <Mount id="tree">
          <Tree
            value={treeValue}
            onChange={setTreeValue}
            expanded={treeExpanded}
            onExpandedChange={setTreeExpanded}
            aria-label="smoke tree"
          >
            <Tree.Item id="t-branch" isBranch data-testid="tree-item-t-branch">
              <span>
                <Tree.Expander itemId="t-branch" aria-label="Toggle branch" />
                <span>Branch</span>
              </span>
              <Tree.Group>
                <Tree.Item id="t-leaf" data-testid="tree-item-t-leaf">
                  <span>Leaf</span>
                </Tree.Item>
              </Tree.Group>
            </Tree.Item>
          </Tree>
        </Mount>

        <Mount id="icon">
          <AbcIcon data-testid="smoke-icon" />
        </Mount>

        <Mount id="primitives">
          <Div data-testid="primitives-box">
            <Span>span text</Span> <Label>label text</Label>{' '}
            <Button type="button">primitive button</Button>
          </Div>
        </Mount>

        <section data-testid="b11-fixtures">
          <B11TreeAutodetect />
          <B11AccordionArrows />
          <B11Splitter />
          <B11Menu />
          <B11TreeExpander />
          <B11Presence />
        </section>
      </Div>
    </ReferenceLibrary>
  )
}

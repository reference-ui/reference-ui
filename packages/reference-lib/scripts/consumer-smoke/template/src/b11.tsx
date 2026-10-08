import * as React from 'react'
import {
  Accordion,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Menu,
  Popover,
  Presence,
  Splitter,
  Tree,
} from '@reference-ui/lib'

/** B-11: Tree branch WITHOUT isBranch auto-detects via its Group child. */
export function B11TreeAutodetect() {
  return (
    <div data-testid="b11-tree-autodetect">
      <Tree aria-label="b11 autodetect tree" value={null} onChange={() => {}}>
        <Tree.Item id="b11-parent">
          <span>b11 parent label</span>
          <Tree.Group>
            <Tree.Item id="b11-child">
              <span>b11 child label</span>
            </Tree.Item>
          </Tree.Group>
        </Tree.Item>
      </Tree>
    </div>
  )
}

/** B-11: nested Collapsible trigger inside Accordion content (arrow scope). */
export function B11AccordionArrows() {
  const [value, setValue] = React.useState<string | string[] | null>('sec1')
  return (
    <div data-testid="b11-accordion-arrows">
      <Accordion value={value} onChange={setValue} expansion="single">
        <Accordion.Item id="sec1">
          <Accordion.Trigger data-testid="b11-acc-trigger-0">Section one</Accordion.Trigger>
          <Accordion.Content>
            <Collapsible defaultOpen>
              <CollapsibleTrigger data-testid="b11-nested-collapsible-trigger">
                Nested options
              </CollapsibleTrigger>
              <CollapsibleContent>nested body</CollapsibleContent>
            </Collapsible>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item id="sec2">
          <Accordion.Trigger data-testid="b11-acc-trigger-1">Section two</Accordion.Trigger>
          <Accordion.Content>second body</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  )
}

/** B-11: degenerate value on 2 panels must fail FAST, never silently collapse. */
export function B11Splitter() {
  return (
    <div data-testid="b11-splitter">
      <ErrorCatcher fallbackTestId="b11-splitter-caught" label="b11-splitter">
        <div style={{ width: 600 }}>
          {/* 3 values, 2 panels: src throws structurally; stale dist rendered ~13px. */}
          <Splitter value={[10, 10, 80]}>
            <Splitter.Panel index={0}>
              <div>degenerate panel zero</div>
            </Splitter.Panel>
            <Splitter.Handle index={0} aria-label="b11 resize" />
            <Splitter.Panel index={1}>
              <div>degenerate panel one</div>
            </Splitter.Panel>
          </Splitter>
        </div>
      </ErrorCatcher>
    </div>
  )
}

class ErrorCatcher extends React.Component<
  { fallbackTestId: string; label: string; children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null }
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
  render() {
    if (this.state.error) {
      return <div data-testid={this.props.fallbackTestId}>{this.state.error}</div>
    }
    return this.props.children
  }
}

/** B-11: textValue must not leak to the DOM; onSelect must receive an event. */
export function B11Menu() {
  // Starts closed: an open menu's dismiss-restore steals focus from the
  // accordion-arrows check running earlier in the probe. The probe reopens
  // deterministically before the menu checks.
  const [open, setOpen] = React.useState(false)
  return (
    <div data-testid="b11-menu">
      <button type="button" data-testid="b11-menu-open" onClick={() => setOpen(true)}>
        open b11 menu
      </button>
      <Popover open={open} onOpen={() => setOpen(true)} onDismiss={() => setOpen(false)}>
        <Popover.Trigger>b11 menu trigger</Popover.Trigger>
        <Popover.Content data-testid="b11-menu-content">
          <Menu>
            <Menu.Item
              textValue="B11-UNIQUE-TEXTVALUE"
              onSelect={(event: unknown) => {
                ;(window as any).__B11_MENU_EVENT__ = event ? 'event' : 'null'
              }}
            >
              B11 Item
            </Menu.Item>
          </Menu>
        </Popover.Content>
      </Popover>
    </div>
  )
}

/** B-11: Tree Expander button must not carry aria-hidden. */
export function B11TreeExpander() {
  return (
    <div data-testid="b11-tree-expander-scope">
      <Tree aria-label="b11 expander tree" value={null} onChange={() => {}} expanded={['b11-exp-branch']}>
        <Tree.Item id="b11-exp-branch" isBranch>
          <span>
            <Tree.Expander itemId="b11-exp-branch" aria-label="B11 expander" />
            <span>b11 branch label</span>
          </span>
          <Tree.Group>
            <Tree.Item id="b11-exp-leaf">
              <span>b11 leaf label</span>
            </Tree.Item>
          </Tree.Group>
        </Tree.Item>
      </Tree>
    </div>
  )
}

/**
 * B-11: Presence wrapping a (closed) nested overlay must RECOVER on
 * false→true. Tolerates the open B-01 exit wedge by design: after hide we
 * assert nothing (the wedge keeps it mounted); after re-show the content
 * must be visible again. Stale dist bricked here (vanished, never recovered).
 */
export function B11Presence() {
  const [present, setPresent] = React.useState(true)
  return (
    <div data-testid="b11-presence">
      <button type="button" data-testid="b11-presence-hide" onClick={() => setPresent(false)}>
        hide
      </button>
      <button type="button" data-testid="b11-presence-show" onClick={() => setPresent(true)}>
        show
      </button>
      <Presence present={present}>
        <div data-testid="b11-presence-content">
          b11 presence body
          <Popover open={false} onOpen={() => {}} onDismiss={() => {}}>
            <Popover.Trigger>nested trigger</Popover.Trigger>
            <Popover.Content>nested body</Popover.Content>
          </Popover>
        </div>
      </Presence>
    </div>
  )
}

import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Accordion } from '../Accordion'
import { Collapsible } from './index'
import { dividerContent, dividerTrigger } from '../disclosureChrome'

export const Basic = () => {
  const [open, setOpen] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" maxW="100r" data-testid="collapsible-fixture-root">
        <Collapsible open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger {...dividerTrigger} data-testid="btn-collapsible-trigger">
            Toggle Details
          </Collapsible.Trigger>
          <Collapsible.Content
            {...dividerContent}
            data-testid="collapsible-content"
          >
            <Span fontSize="3.5r" color="design.text.light" data-testid="collapsible-text">
              Detailed collapsible content.
            </Span>
          </Collapsible.Content>
        </Collapsible>
      </Div>
    </ReferenceLibrary>
  )
}

export const DefaultOpen = () => {
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" maxW="100r" data-testid="collapsible-default-open-root">
        <Collapsible defaultOpen>
          <Collapsible.Trigger {...dividerTrigger} data-testid="btn-default-open-trigger">
            Hide details
          </Collapsible.Trigger>
          <Collapsible.Content
            {...dividerContent}
            data-testid="default-open-content"
          >
            <Span fontSize="3.5r" color="design.text.light">
              This section starts open via defaultOpen.
            </Span>
          </Collapsible.Content>
        </Collapsible>
      </Div>
    </ReferenceLibrary>
  )
}

// Quarantine-port fixtures below. Probe controls are plain buttons (not the
// component under test); programmatic close buttons keep focus where it is so
// focus-evacuation cases observe the component, not the click.
const keepFocusOnMouseDown = (e: React.MouseEvent) => {
  e.preventDefault()
}

// CO-DOM-01: transparent root — siblings stay adjacent with no wrapper.
export const NoWrapper = () => {
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="nowrap-root">
        <Div data-testid="nowrap-container">
          <Span data-testid="nowrap-before">before</Span>
          <Collapsible open={true} onChange={() => {}}>
            <Collapsible.Trigger data-testid="nowrap-trigger">Toggle</Collapsible.Trigger>
            <Collapsible.Content data-testid="nowrap-content">Details</Collapsible.Content>
          </Collapsible>
          <Span data-testid="nowrap-after">after</Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

// CO-ACT-01/03: controlled closed, parent ignores toggle requests.
export const ControlledClosed = () => {
  const [log, setLog] = React.useState<boolean[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="probe-closed-root">
        <Collapsible open={false} onChange={next => setLog(prev => [...prev, next])}>
          <Collapsible.Trigger data-testid="probe-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="probe-content">Details</Collapsible.Content>
        </Collapsible>
        <Div data-testid="probe-log">{JSON.stringify(log)}</Div>
        <button data-testid="probe-reset" onClick={() => setLog([])}>
          Reset
        </button>
      </Div>
    </ReferenceLibrary>
  )
}

// CO-COMP-01: controlled closed, parent follows; plain disclosure + adjacent input.
export const FollowClosed = () => {
  const [open, setOpen] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="follow-root">
        <Collapsible open={open} onChange={setOpen}>
          <Collapsible.Trigger data-testid="follow-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="follow-content">Details</Collapsible.Content>
        </Collapsible>
        <input data-testid="follow-adjacent-input" aria-label="adjacent" />
      </Div>
    </ReferenceLibrary>
  )
}

// CO-DOM-03, CO-ACT-02, CO-PRES-01/04/07, CO-COMP-02: controlled open with
// programmatic open/close and a focusable input inside Content.
export const ControlledOpen = () => {
  const [open, setOpen] = React.useState(true)
  const [log, setLog] = React.useState<boolean[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="probe-open-root">
        <Collapsible
          open={open}
          onChange={next => {
            setLog(prev => [...prev, next])
          }}
        >
          <Collapsible.Trigger data-testid="probe-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="probe-content">
            <Span data-testid="probe-text">Detailed content.</Span>
            <input data-testid="probe-input" aria-label="inside" />
          </Collapsible.Content>
        </Collapsible>
        <Div data-testid="probe-log">{JSON.stringify(log)}</Div>
        <button data-testid="probe-set-open" onMouseDown={keepFocusOnMouseDown} onClick={() => setOpen(true)}>
          Set open
        </button>
        <button data-testid="probe-close" onMouseDown={keepFocusOnMouseDown} onClick={() => setOpen(false)}>
          Set closed
        </button>
      </Div>
    </ReferenceLibrary>
  )
}

// CO-DOM-04: forged consumer state attributes must lose to managed ones.
export const ForgedState = () => {
  const [open, setOpen] = React.useState(true)
  const [disabled, setDisabled] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="forged-root">
        <Collapsible open={open} onChange={setOpen} disabled={disabled}>
          <Collapsible.Trigger
            data-testid="forged-trigger"
            data-state="forged"
            data-unrelated="keep-me-trigger"
          >
            Toggle
          </Collapsible.Trigger>
          <Collapsible.Content
            data-testid="forged-content"
            data-state="forged"
            data-disabled="forged"
            data-unrelated="keep-me-content"
          >
            Details
          </Collapsible.Content>
        </Collapsible>
        <button data-testid="forged-close" onClick={() => setOpen(false)}>
          Close
        </button>
        <button data-testid="forged-open" onClick={() => setOpen(true)}>
          Open
        </button>
        <button data-testid="forged-disable" onClick={() => setDisabled(true)}>
          Disable
        </button>
      </Div>
    </ReferenceLibrary>
  )
}

// CO-PRES-02: exit with a child that emits its own end events.
export const ExitChild = () => {
  const [open, setOpen] = React.useState(true)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="exit-root">
        <Collapsible open={open} onChange={setOpen}>
          <Collapsible.Trigger data-testid="exit-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="exit-content">
            <Span data-testid="exit-child">child</Span>
          </Collapsible.Content>
        </Collapsible>
        <button data-testid="exit-close" onClick={() => setOpen(false)}>
          Close
        </button>
      </Div>
    </ReferenceLibrary>
  )
}

// CO-PRES-08: exiting content isolates its interactive descendants.
export const Isolation = () => {
  const [open, setOpen] = React.useState(true)
  const [clicks, setClicks] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="iso-root">
        <Collapsible open={open} onChange={setOpen}>
          <Collapsible.Trigger data-testid="iso-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="iso-content">
            <a data-testid="iso-link" href="#iso">
              link
            </a>
            <button data-testid="iso-btn" onClick={() => setClicks(c => c + 1)}>
              child button
            </button>
          </Collapsible.Content>
        </Collapsible>
        <Div data-testid="iso-clicks">{String(clicks)}</Div>
        <button data-testid="iso-close" onMouseDown={keepFocusOnMouseDown} onClick={() => setOpen(false)}>
          Close
        </button>
        <button data-testid="iso-reopen" onMouseDown={keepFocusOnMouseDown} onClick={() => setOpen(true)}>
          Reopen
        </button>
      </Div>
    </ReferenceLibrary>
  )
}

// CO-PRES-07 (fallback): disabled trigger cannot receive evacuated focus.
export const FocusFallback = () => {
  const [open, setOpen] = React.useState(true)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="fb-root">
        <Collapsible open={open} onChange={setOpen} disabled={true}>
          <Collapsible.Trigger data-testid="fb-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="fb-content">
            <input data-testid="fb-input" aria-label="inside" />
          </Collapsible.Content>
        </Collapsible>
        <button data-testid="fb-close" onMouseDown={keepFocusOnMouseDown} onClick={() => setOpen(false)}>
          Close
        </button>
      </Div>
    </ReferenceLibrary>
  )
}

// CO-SIZE-01 (exact): the collapse engine forces border-box, so the authored
// 120px width + 3px padding + 2px border measure a 120px border box.
export const SizeExact = () => {
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="size-root">
        <Collapsible open={true} onChange={() => {}}>
          <Collapsible.Trigger data-testid="size-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content
            data-testid="size-content"
            style={{ width: '120px', padding: '3px', border: '2px solid', boxSizing: 'content-box' }}
          >
            <Div style={{ height: '40px' }}>120px content-box</Div>
          </Collapsible.Content>
        </Collapsible>
      </Div>
    </ReferenceLibrary>
  )
}

// CO-SIZE-02: fixed open size must survive into the exit as published vars.
export const SizeSnapshot = () => {
  const [open, setOpen] = React.useState(true)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="snap-root">
        <Collapsible open={open} onChange={setOpen}>
          <Collapsible.Trigger data-testid="snap-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content data-testid="snap-content" style={{ width: '160px' }}>
            <Div style={{ height: '64px' }}>160x64</Div>
          </Collapsible.Content>
        </Collapsible>
        <button data-testid="snap-close" onClick={() => setOpen(false)}>
          Close
        </button>
      </Div>
    </ReferenceLibrary>
  )
}

// CO-SIZE-03: open measurements refresh on resize; app custom props untouched.
export const Resizable = () => {
  const [open, setOpen] = React.useState(true)
  const [big, setBig] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="resize-root">
        <Collapsible open={open} onChange={setOpen}>
          <Collapsible.Trigger data-testid="resize-trigger">Toggle</Collapsible.Trigger>
          <Collapsible.Content
            data-testid="resize-content"
            style={{ width: big ? '180px' : '100px', '--product-density': 'compact' } as React.CSSProperties}
          >
            <Div style={{ height: big ? '70px' : '40px' }}>resizable</Div>
          </Collapsible.Content>
        </Collapsible>
        <button data-testid="resize-btn" onClick={() => setBig(true)}>
          Resize
        </button>
      </Div>
    </ReferenceLibrary>
  )
}

// CO-COMP-03: standalone inner disclosure inside an accordion item.
export const AccordionNest = () => {
  const [value, setValue] = React.useState<string | string[] | null>('item-1')
  const [innerOpen, setInnerOpen] = React.useState(false)
  const [innerLog, setInnerLog] = React.useState<boolean[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="nest-root">
        <Accordion expansion="single" value={value} onChange={setValue}>
          <Accordion.Item id="item-1">
            <Collapsible.Trigger data-testid="nest-acc-trigger-1">Item 1</Collapsible.Trigger>
            <Collapsible.Content data-testid="nest-acc-content-1">
              <Collapsible
                open={innerOpen}
                onChange={next => {
                  setInnerLog(prev => [...prev, next])
                  setInnerOpen(next)
                }}
              >
                <Collapsible.Trigger data-testid="nest-inner-trigger">Inner</Collapsible.Trigger>
                <Collapsible.Content data-testid="nest-inner-content">Inner details</Collapsible.Content>
              </Collapsible>
              <Div data-testid="nest-inner-log">{JSON.stringify(innerLog)}</Div>
            </Collapsible.Content>
          </Accordion.Item>
          <Accordion.Item id="item-2">
            <Collapsible.Trigger data-testid="nest-acc-trigger-2">Item 2</Collapsible.Trigger>
            <Collapsible.Content data-testid="nest-acc-content-2">Item 2 details</Collapsible.Content>
          </Accordion.Item>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

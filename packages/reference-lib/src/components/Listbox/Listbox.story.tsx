import * as React from 'react'
import { createPortal } from 'react-dom'
import { Div, Span, Button } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Listbox } from './index'
import { Popover } from '../Popover'
import { Combobox } from '../Combobox'

export const Basic = () => {
  const [value, setValue] = React.useState<string | null>('apple')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="listbox-fixture-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="test-listbox"
            value={value}
            onChange={setValue}
          >
            <Listbox.Option value="apple" data-testid="opt-apple">
              Apple
            </Listbox.Option>
            <Listbox.Option value="banana" data-testid="opt-banana">
              Banana
            </Listbox.Option>
            <Listbox.Option value="cherry" data-testid="opt-cherry">
              Cherry
            </Listbox.Option>
            <Listbox.Option value="durian" data-testid="opt-disabled" disabled>
              Durian (disabled)
            </Listbox.Option>
          </Listbox>
        </Div>

        <Span data-testid="listbox-value-display" fontSize="3.5r" color="design.text.base">
          Selected: {value ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Multiple = () => {
  const [value, setValue] = React.useState<string[]>(['email'])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="listbox-multi-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="test-listbox-multi"
            selection="multiple"
            value={value}
            onChange={setValue}
          >
            <Listbox.Option value="email" data-testid="opt-m-email">
              Email notifications
            </Listbox.Option>
            <Listbox.Option value="sms" data-testid="opt-m-sms">
              SMS alerts
            </Listbox.Option>
            <Listbox.Option value="push" data-testid="opt-m-push">
              Push notifications
            </Listbox.Option>
          </Listbox>
        </Div>

        <Span data-testid="listbox-multi-value-display" fontSize="3.5r" color="design.text.base">
          Selected: {value.length ? value.join(', ') : 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Sections = () => {
  const [value, setValue] = React.useState<string | null>('react')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="listbox-sections-root" maxW="80r">
        <Div width="60r">
          <Listbox value={value} onChange={setValue}>
            <Listbox.Section title="Frontend">
              <Listbox.Option value="react" data-testid="opt-s-react">
                React
              </Listbox.Option>
              <Listbox.Option value="vue" data-testid="opt-s-vue">
                Vue
              </Listbox.Option>
            </Listbox.Section>
            <Listbox.Section title="Backend">
              <Listbox.Option value="node" data-testid="opt-s-node">
                Node.js
              </Listbox.Option>
              <Listbox.Option value="go" data-testid="opt-s-go">
                Go
              </Listbox.Option>
            </Listbox.Section>
          </Listbox>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const Modes = () => {
  const [singleVal, setSingleVal] = React.useState<string | null>('alpha')
  const [multiVal, setMultiVal] = React.useState<string[]>(['alpha'])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="modes-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox data-testid="modes-single" selection="single" value={singleVal} onChange={setSingleVal}>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Div>
        <Div width="60r">
          <Listbox
            data-testid="modes-multiple"
            selection="multiple"
            value={multiVal}
            onChange={setMultiVal}
          >
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const ControlledMirror = () => {
  const [value, setValue] = React.useState<string | null>('bravo')
  const [calls, setCalls] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="mirror-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button data-testid="mirror-set-charlie" onClick={() => setValue('charlie')}>
            Set charlie
          </button>
          <Listbox data-testid="mirror-listbox" value={value} onChange={() => setCalls(c => c + 1)}>
            <Listbox.Option value="alpha" data-testid="mirror-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="mirror-bravo">
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="mirror-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="mirror-calls" fontSize="3.5r" color="design.text.base">
          {calls}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const RequestLog = () => {
  const [calls, setCalls] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="req-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="req-listbox"
            value="alpha"
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <Listbox.Option value="alpha" data-testid="req-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="req-bravo">
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="req-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="req-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const RovingTab = () => {
  const [value, setValue] = React.useState<string | null>('charlie')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="roving-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button data-testid="roving-set-null" onClick={() => setValue(null)}>
            Set null
          </button>
          <button data-testid="roving-set-charlie" onClick={() => setValue('charlie')}>
            Set charlie
          </button>
          <Listbox data-testid="roving-listbox" value={value} onChange={setValue}>
            <Listbox.Option value="alpha" data-testid="roving-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" disabled data-testid="roving-bravo">
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="roving-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const Horizontal = () => {
  const [value, setValue] = React.useState<string | null>('bravo')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="horiz-root" maxW="120r">
        <Listbox
          data-testid="horiz-listbox"
          orientation="horizontal"
          value={value}
          onChange={setValue}
        >
          <Listbox.Option value="alpha" data-testid="horiz-alpha">
            Alpha
          </Listbox.Option>
          <Listbox.Option value="bravo" data-testid="horiz-bravo">
            Bravo
          </Listbox.Option>
          <Listbox.Option value="charlie" data-testid="horiz-charlie">
            Charlie
          </Listbox.Option>
        </Listbox>
      </Div>
    </ReferenceLibrary>
  )
}

export const HorizontalRTL = () => {
  const [value, setValue] = React.useState<string | null>('bravo')
  const [rtl, setRtl] = React.useState(true)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="rtl-root" maxW="120r">
        <div dir={rtl ? 'rtl' : 'ltr'} data-testid="rtl-dir-wrapper">
          <button data-testid="rtl-toggle-ltr" onClick={() => setRtl(false)}>
            Switch to LTR
          </button>
          <Listbox data-testid="rtl-listbox" orientation="horizontal" value={value} onChange={setValue}>
            <Listbox.Option value="alpha" data-testid="rtl-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="rtl-bravo">
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="rtl-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </div>
      </Div>
    </ReferenceLibrary>
  )
}

export const Typeahead = () => {
  const [value, setValue] = React.useState<string | null>(null)
  const [calls, setCalls] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="type-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="type-listbox"
            value={value}
            onChange={val => {
              setValue(val as string)
              setCalls(prev => [...prev, val as string])
            }}
          >
            <Listbox.Option value="apple" data-testid="type-apple">
              Apple
            </Listbox.Option>
            <Listbox.Option value="apricot" disabled data-testid="type-apricot">
              Apricot
            </Listbox.Option>
            <Listbox.Option value="avocado" data-testid="type-avocado">
              Avocado
            </Listbox.Option>
            <Listbox.Option value="banana" data-testid="type-banana">
              Banana
            </Listbox.Option>
            <Listbox.Option value="new-york" data-testid="type-ny">
              New York
            </Listbox.Option>
            <Listbox.Option value="new-jersey" data-testid="type-nj">
              New Jersey
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="type-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Cancel = () => {
  const [value, setValue] = React.useState<string | null>('alpha')
  const [log, setLog] = React.useState<string[]>([])
  const [calls, setCalls] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="cancel-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="cancel-listbox"
            value={value}
            onChange={() => {
              setValue('bravo')
              setCalls(c => c + 1)
            }}
          >
            <Listbox.Option value="alpha" data-testid="cancel-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option
              value="bravo"
              data-testid="cancel-bravo"
              onClick={e => {
                setLog(prev => [...prev, 'consumer-click'])
                e.preventDefault()
              }}
              onKeyDown={e => {
                setLog(prev => [...prev, `consumer-keydown-${e.key}`])
                e.preventDefault()
              }}
            >
              Bravo
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="cancel-calls" fontSize="3.5r" color="design.text.base">
          {calls}
        </Span>
        <Span data-testid="cancel-log" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(log)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const Defaults = () => {
  const [calls, setCalls] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="defaults-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox data-testid="defaults-listbox" onChange={val => setCalls(prev => [...prev, val as string])}>
            <Listbox.Option value="alpha" data-testid="defaults-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="defaults-bravo">
              Bravo
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="defaults-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const MultiUnknown = () => {
  const [calls, setCalls] = React.useState<string[][]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="multi-unknown-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="mu-listbox"
            selection="multiple"
            value={['unknown-2', 'charlie', 'alpha', 'charlie', 'unknown-1']}
            onChange={val => setCalls(prev => [...prev, val as string[]])}
          >
            <Listbox.Option value="alpha" data-testid="mu-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="mu-bravo">
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="mu-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="mu-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const ZeroValues = () => {
  const [value, setValue] = React.useState<string | null>('alpha')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="zero-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button data-testid="zero-set-empty" onClick={() => setValue('')}>
            Select Empty
          </button>
          <button data-testid="zero-set-zero" onClick={() => setValue('0')}>
            Select Zero
          </button>
          <Listbox data-testid="zero-listbox" value={value} onChange={setValue}>
            <Listbox.Option value="" data-testid="zero-opt-empty">
              Empty String
            </Listbox.Option>
            <Listbox.Option value="0" data-testid="zero-opt-zero">
              Zero String
            </Listbox.Option>
            <Listbox.Option value="alpha" data-testid="zero-opt-alpha">
              Alpha
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="zero-val" fontSize="3.5r" color="design.text.base">
          {value}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const DynamicOrder = () => {
  const [items, setItems] = React.useState(['alpha', 'bravo', 'charlie'])
  const [value, setValue] = React.useState<string | null>('bravo')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="dyn-order-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button
            data-testid="dyn-insert-delta"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setItems(['alpha', 'delta', 'bravo', 'charlie'])}
          >
            Insert Delta
          </button>
          <button
            data-testid="dyn-reorder-charlie"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setItems(['alpha', 'delta', 'charlie', 'bravo'])}
          >
            Reorder Charlie Before Bravo
          </button>
          <Listbox data-testid="dyn-order-listbox" value={value} onChange={setValue}>
            {items.map(item => (
              <Listbox.Option key={item} value={item} data-testid={`dyn-${item}`}>
                {item}
              </Listbox.Option>
            ))}
          </Listbox>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const DynamicRemove = () => {
  const [items, setItems] = React.useState([
    { val: 'alpha', dis: false },
    { val: 'bravo', dis: false },
    { val: 'charlie', dis: true },
    { val: 'delta', dis: false },
  ])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="dyn-remove-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button
            data-testid="dyn-remove-bravo"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setItems(prev => prev.filter(i => i.val !== 'bravo'))}
          >
            Remove Bravo
          </button>
          <Listbox data-testid="dyn-remove-listbox">
            {items.map(item => (
              <Listbox.Option
                key={item.val}
                value={item.val}
                disabled={item.dis}
                data-testid={`dynr-${item.val}`}
              >
                {item.val}
              </Listbox.Option>
            ))}
          </Listbox>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const Virtual = () => {
  const [logicalItems] = React.useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      value: `item-${i}`,
      textValue: i === 37 ? 'Zulu' : `Item ${i}`,
      disabled: i === 0 || i === 49,
    }))
  )
  const [range, setRange] = React.useState({ start: 20, end: 25 })
  const [scrollLog, setScrollLog] = React.useState<number[]>([])
  const [value, setValue] = React.useState<string | null>(null)

  const adapter = React.useMemo(
    () => ({
      items: logicalItems,
      scrollToIndex: (idx: number) => {
        setScrollLog(prev => [...prev, idx])
      },
    }),
    [logicalItems]
  )

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="virt-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button data-testid="virt-mount-0-4" onClick={() => setRange({ start: 0, end: 4 })}>
            Mount 0..4
          </button>
          <button data-testid="virt-mount-5-10" onClick={() => setRange({ start: 5, end: 10 })}>
            Mount 5..10
          </button>
          <button data-testid="virt-mount-35-40" onClick={() => setRange({ start: 35, end: 40 })}>
            Mount 35..40
          </button>
          <button data-testid="virt-mount-45-49" onClick={() => setRange({ start: 45, end: 49 })}>
            Mount 45..49
          </button>
          <button data-testid="virt-set-37" onClick={() => setValue('item-37')}>
            Set item-37
          </button>
          <Listbox data-testid="virt-listbox" virtual={adapter} value={value} onChange={setValue}>
            {Array.from({ length: range.end - range.start + 1 }, (_, idx) => {
              const itemIndex = range.start + idx
              const item = logicalItems[itemIndex]
              if (!item) return null
              return (
                <Listbox.Option
                  key={item.value}
                  value={item.value}
                  index={itemIndex}
                  disabled={item.disabled}
                  textValue={item.textValue}
                  data-testid={`virt-opt-${itemIndex}`}
                >
                  {item.textValue}
                </Listbox.Option>
              )
            })}
          </Listbox>
        </Div>
        <Span data-testid="virt-scroll-log" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(scrollLog)}
        </Span>
        <Span data-testid="virt-value" fontSize="3.5r" color="design.text.base">
          {value ?? 'null'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const RowActions = () => {
  const [value, setValue] = React.useState<string[]>(['events'])
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="rowactions-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="rowactions-listbox"
            selection="multiple"
            value={value}
            onChange={v => {
              push(`change:${JSON.stringify(v)}`)
              setValue(v)
            }}
          >
            <Listbox.Option value="events" data-testid="row-opt-events">
              <Span flex="1">Events</Span>
              <Popover>
                <Popover.Trigger data-testid="row-trigger-events" aria-label="Row actions">
                  ⋯
                </Popover.Trigger>
                <Popover.Content data-testid="row-popover-events">
                  <Button data-testid="row-action-pin" onClick={() => push('action:pin')}>
                    Pin
                  </Button>
                </Popover.Content>
              </Popover>
            </Listbox.Option>
            <Listbox.Option value="alerts" data-testid="row-opt-alerts">
              Alerts
            </Listbox.Option>
          </Listbox>
        </Div>

        <Span data-testid="rowactions-value-display" fontSize="3.5r" color="design.text.base">
          Selected: {value.length ? value.join(', ') : 'None'}
        </Span>
        <Div data-testid="rowactions-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

// ---------------------------------------------------------------------------
// Finish-line P2A fixtures (one per gap case; shared CaptureBoundary below)
// ---------------------------------------------------------------------------

class CaptureBoundary extends React.Component<{
  testid: string
  children: React.ReactNode
  onReset?: () => void
}> {
  state: { message: string | null } = { message: null }
  static getDerivedStateFromError(error: Error) {
    return { message: error.message }
  }
  render() {
    if (this.state.message) {
      return (
        <Div data-testid={this.props.testid} p="2r">
          {this.state.message}
        </Div>
      )
    }
    return this.props.children
  }
}

// LB-DOM-04: enabled alpha/charlie around disabled bravo, request log.
export const DisabledPaths = () => {
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="dis-root" maxW="80r">
        <button data-testid="dis-before">Before</button>
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="dis-listbox"
            value="alpha"
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <Listbox.Option value="alpha" data-testid="dis-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" disabled data-testid="dis-bravo">
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="dis-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="dis-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-DOM-05: native root/option contracts per orientation.
export const NativeProps = () => {
  const vRootRef = React.useRef<HTMLDivElement | null>(null)
  const hRootRef = React.useRef<HTMLDivElement | null>(null)
  const vOptRef = React.useRef<HTMLDivElement | null>(null)
  const [vEvents, setVEvents] = React.useState<string[]>([])
  const [report, setReport] = React.useState('')
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="nat-root" maxW="120r">
        <button
          data-testid="nat-report"
          onMouseDown={e => e.preventDefault()}
          onClick={() =>
            setReport(
              JSON.stringify({
                vRoot: vRootRef.current?.constructor?.name ?? null,
                vRootTag: vRootRef.current?.tagName ?? null,
                hRoot: hRootRef.current?.constructor?.name ?? null,
                vOpt: vOptRef.current?.constructor?.name ?? null,
                vOptTag: vOptRef.current?.tagName ?? null,
              })
            )
          }
        >
          Report refs
        </button>
        <Div width="60r" mb="4r">
          <Listbox
            ref={vRootRef}
            data-testid="nat-vertical"
            data-consumer="v-root"
            className="consumer-vertical"
            style={{ borderWidth: 3 }}
            onClick={() => setVEvents(prev => [...prev, 'root-click'])}
          >
            <Listbox.Option
              ref={vOptRef}
              value="alpha"
              data-testid="nat-v-alpha"
              data-consumer="v-opt"
              className="consumer-opt"
              style={{ borderWidth: 5 }}
            >
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="nat-v-bravo">
              Bravo
            </Listbox.Option>
          </Listbox>
        </Div>
        <Div width="120r" mb="4r">
          <Listbox
            ref={hRootRef}
            data-testid="nat-horizontal"
            orientation="horizontal"
            data-consumer="h-root"
            className="consumer-horizontal"
          >
            <Listbox.Option value="alpha" data-testid="nat-h-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="nat-h-bravo">
              Bravo
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="nat-ref-report" fontSize="3.5r" color="design.text.base">
          {report}
        </Span>
        <Span data-testid="nat-events" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(vEvents)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-DOM-07: empty collection between two buttons; optional explicit tabIndex.
export const EmptyTab = () => {
  const [tabbable, setTabbable] = React.useState(false)
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="empty-root" maxW="80r">
        <button data-testid="empty-before">Before</button>
        <Div width="60r" mb="4r">
          <button
            data-testid="empty-toggle-tab"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setTabbable(v => !v)}
          >
            Toggle tabIndex
          </button>
          <Listbox data-testid="empty-listbox" tabIndex={tabbable ? 0 : undefined} />
        </Div>
        <button data-testid="empty-after">After</button>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-DOM-09: explicit textValue wins over decorative markup; Bravo by name.
export const TextNames = () => {
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="text-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="text-listbox"
            value={null}
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <Listbox.Option value="zulu-opt" textValue="Zulu" data-testid="text-zulu">
              <span data-testid="text-decor">
                QQQ <em>decorative</em>
              </span>
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="text-bravo">
              Bravo
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="text-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-DOM-11: controlled selected-but-disabled bravo.
export const SelectedDisabled = () => {
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="sd-root" maxW="80r">
        <button data-testid="sd-before">Before</button>
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="sd-listbox"
            value="bravo"
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <Listbox.Option value="alpha" data-testid="sd-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" disabled data-testid="sd-bravo">
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="sd-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="sd-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-DOM-12: overflowing root with native onScroll.
export const ScrollNative = () => {
  const [scrolls, setScrolls] = React.useState<string[]>([])
  const [calls, setCalls] = React.useState<string[]>([])
  const items = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel']
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="scroll-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="scroll-listbox"
            value="alpha"
            onChange={val => setCalls(prev => [...prev, val as string])}
            onScroll={e => {
              // Read currentTarget synchronously: React nulls it once the
              // synthetic dispatch completes, so an updater read would throw.
              const tag = (e.currentTarget as HTMLElement).tagName
              setScrolls(prev => [...prev, tag])
            }}
            style={{ height: 96, overflowY: 'auto' }}
          >
            {items.map(item => (
              <Listbox.Option key={item} value={item} data-testid={`scroll-${item}`}>
                {item}
              </Listbox.Option>
            ))}
          </Listbox>
        </Div>
        <Span data-testid="scroll-events" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(scrolls)}
        </Span>
        <Span data-testid="scroll-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-POINTER-04: disabled bravo keeps authored props across modalities.
export const DisabledAuthored = () => {
  const [calls, setCalls] = React.useState<string[]>([])
  const [consumer, setConsumer] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="da-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="da-listbox"
            value="alpha"
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <Listbox.Option value="alpha" data-testid="da-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option
              value="bravo"
              disabled
              data-testid="da-bravo"
              data-consumer="kept"
              className="consumer-kept"
              style={{ borderWidth: 7 }}
              onClick={() => setConsumer(prev => [...prev, 'click'])}
              onKeyDown={() => setConsumer(prev => [...prev, 'keydown'])}
            >
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="da-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="da-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
        <Span data-testid="da-consumer" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(consumer)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-GROUP-01/03/05: native groups — labeled, labelledby, empty,
// aria-disabled-looking, nested, decorative, non-option interactive content.
export const NativeGroups = () => {
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="ng-root" maxW="80r">
        <button data-testid="ng-before">Before</button>
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="ng-listbox"
            value={null}
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <div role="group" aria-label="Warm colors" data-testid="ng-group-warm">
              <h3 data-testid="ng-heading-warm">Warm colors</h3>
              <span data-testid="ng-decor-bravo">Bravo</span>
              <Listbox.Option value="apple" data-testid="ng-apple">
                Apple
              </Listbox.Option>
              <Listbox.Option value="apricot" disabled data-testid="ng-apricot">
                Apricot
              </Listbox.Option>
            </div>
            <div data-testid="ng-label-node" id="ng-cool-label">
              Cool colors
            </div>
            <div role="group" aria-labelledby="ng-cool-label" data-testid="ng-group-cool">
              <Listbox.Option value="zulu-opt" textValue="Zulu option" data-testid="ng-zulu">
                Zulu option
              </Listbox.Option>
            </div>
            <div role="group" aria-label="Zulu region" data-testid="ng-group-zulu" />
            <div role="group" aria-label="Nested" aria-disabled="true" data-testid="ng-group-nested">
              <div role="group" aria-label="Inner" data-testid="ng-group-inner">
                <Listbox.Option value="kiwi" data-testid="ng-kiwi">
                  Kiwi
                </Listbox.Option>
                <button data-testid="ng-inner-button">Inner action</button>
              </div>
            </div>
          </Listbox>
        </Div>
        <Span data-testid="ng-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-GROUP-02: interleaved top-level + grouped + nested-group options.
export const GroupedOrder = () => {
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="go-root" maxW="80r">
        <button data-testid="go-before">Before</button>
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="go-listbox"
            value={null}
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <Listbox.Option value="alpha" data-testid="go-alpha">
              Alpha
            </Listbox.Option>
            <div role="group" aria-label="Pair" data-testid="go-group">
              <h3 data-testid="go-heading">Pair</h3>
              <Listbox.Option value="bravo" data-testid="go-bravo">
                Bravo
              </Listbox.Option>
              <Listbox.Option value="charlie" disabled data-testid="go-charlie">
                Charlie
              </Listbox.Option>
              <div role="group" aria-label="Inner" data-testid="go-group-inner">
                <Listbox.Option value="delta" data-testid="go-delta">
                  Delta
                </Listbox.Option>
              </div>
            </div>
            <Listbox.Option value="echo" data-testid="go-echo">
              Echo
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="go-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-GROUP-04: options move between native groups; groups reorder.
export const GroupedDynamic = () => {
  const [layout, setLayout] = React.useState(0)
  const [value, setValue] = React.useState<string | null>('bravo')
  const [calls, setCalls] = React.useState<string[]>([])
  const btn = (testid: string, next: number, label: string) => (
    <button
      key={testid}
      data-testid={testid}
      onMouseDown={e => e.preventDefault()}
      onClick={() => setLayout(next)}
    >
      {label}
    </button>
  )
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="gd-root" maxW="80r">
        <Div width="60r" mb="4r">
          {btn('gd-layout-0', 0, 'Layout 0')}
          {btn('gd-layout-1', 1, 'Insert group, move bravo')}
          {btn('gd-layout-2', 2, 'Reorder groups, drop alpha')}
          <Listbox
            data-testid="gd-listbox"
            value={value}
            onChange={val => {
              setValue(val as string)
              setCalls(prev => [...prev, val as string])
            }}
          >
            {layout === 0 && (
              <>
                <Listbox.Option value="alpha" data-testid="gd-alpha">
                  Alpha
                </Listbox.Option>
                <Listbox.Option value="bravo" data-testid="gd-bravo">
                  Bravo
                </Listbox.Option>
                <Listbox.Option value="charlie" data-testid="gd-charlie">
                  Charlie
                </Listbox.Option>
              </>
            )}
            {layout === 1 && (
              <>
                <Listbox.Option value="alpha" data-testid="gd-alpha">
                  Alpha
                </Listbox.Option>
                <div role="group" aria-label="Moved" data-testid="gd-group">
                  <Listbox.Option value="bravo" data-testid="gd-bravo">
                    Bravo
                  </Listbox.Option>
                </div>
                <Listbox.Option value="charlie" data-testid="gd-charlie">
                  Charlie
                </Listbox.Option>
              </>
            )}
            {layout === 2 && (
              <>
                <div role="group" aria-label="Moved" data-testid="gd-group">
                  <Listbox.Option value="charlie" data-testid="gd-charlie">
                    Charlie
                  </Listbox.Option>
                  <Listbox.Option value="bravo" data-testid="gd-bravo">
                    Bravo
                  </Listbox.Option>
                </div>
              </>
            )}
          </Listbox>
        </Div>
        <Span data-testid="gd-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-GROUP-06: virtual window mounted across nested native groups.
export const VirtualGroups = () => {
  const [logicalItems] = React.useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      value: `item-${i}`,
      textValue: `Item ${i}`,
      disabled: false,
    }))
  )
  const [swapped, setSwapped] = React.useState(false)
  const [scrollLog, setScrollLog] = React.useState<number[]>([])
  const adapter = React.useMemo(
    () => ({
      items: logicalItems,
      scrollToIndex: (idx: number) => setScrollLog(prev => [...prev, idx]),
    }),
    [logicalItems]
  )
  const opt = (index: number) => {
    const item = logicalItems[index]!
    return (
      <Listbox.Option
        key={item.value}
        value={item.value}
        index={index}
        textValue={item.textValue}
        data-testid={`vg-opt-${index}`}
      >
        {item.textValue}
      </Listbox.Option>
    )
  }
  const groupA = (
    <div role="group" aria-label="Group A" data-testid="vg-group-a" key="a">
      {opt(20)}
      {opt(21)}
    </div>
  )
  const groupB = (
    <div role="group" aria-label="Group B" data-testid="vg-group-b" key="b">
      <div role="group" aria-label="Inner B" data-testid="vg-group-inner">
        {opt(22)}
        {opt(23)}
      </div>
    </div>
  )
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="vg-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button
            data-testid="vg-swap"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setSwapped(v => !v)}
          >
            Reorder groups
          </button>
          <Listbox data-testid="vg-listbox" value={null} onChange={() => {}} virtual={adapter}>
            {swapped ? (
              <>
                {groupB}
                {groupA}
              </>
            ) : (
              <>
                {groupA}
                {groupB}
              </>
            )}
          </Listbox>
        </Div>
        <Span data-testid="vg-scroll-log" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(scrollLog)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-MULTI-02/04: controlled pair with request log.
export const MultiToggle = () => {
  const [calls, setCalls] = React.useState<string[][]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="mt-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="mt-listbox"
            selection="multiple"
            value={['alpha', 'charlie']}
            onChange={val => setCalls(prev => [...prev, val as string[]])}
          >
            <Listbox.Option value="alpha" data-testid="mt-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="mt-bravo">
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="mt-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="mt-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-MULTI-05/06: five options, rejection then programmatic update.
export const MultiFive = () => {
  const [value, setValue] = React.useState<string[]>(['bravo'])
  const [calls, setCalls] = React.useState<string[][]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="m5-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button
            data-testid="m5-set-charlie"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setValue(['charlie'])}
          >
            Set charlie
          </button>
          <Listbox
            data-testid="m5-listbox"
            selection="multiple"
            value={value}
            onChange={val => setCalls(prev => [...prev, val as string[]])}
          >
            {['alpha', 'bravo', 'charlie', 'delta', 'echo'].map(item => (
              <Listbox.Option key={item} value={item} data-testid={`m5-${item}`}>
                {item}
              </Listbox.Option>
            ))}
          </Listbox>
        </Div>
        <Span data-testid="m5-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-MULTI-07: controlled disabled + unmounted values are retained.
export const MultiRetained = () => {
  const [calls, setCalls] = React.useState<string[][]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="mr-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="mr-listbox"
            selection="multiple"
            value={['disabled', 'offscreen']}
            onChange={val => setCalls(prev => [...prev, val as string[]])}
          >
            <Listbox.Option value="alpha" data-testid="mr-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="disabled" disabled data-testid="mr-disabled">
              Disabled
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="mr-bravo">
              Bravo
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="mr-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-MULTI-08: omitted multiple value means controlled empty.
export const MultiOmitted = () => {
  const [calls, setCalls] = React.useState<string[][]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="mo-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="mo-listbox"
            selection="multiple"
            onChange={val => setCalls(prev => [...prev, val as string[]])}
          >
            <Listbox.Option value="alpha" data-testid="mo-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="mo-bravo">
              Bravo
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="mo-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-SINGLE-07: programmatic selection, focus parked outside, Tab back in.
export const ProgSelect = () => {
  const [value, setValue] = React.useState<string | null>('alpha')
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="ps-root" maxW="80r">
        <button data-testid="ps-outside">Outside</button>
        <Div width="60r" mb="4r">
          <button
            data-testid="ps-set-charlie"
            tabIndex={-1}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setValue('charlie')}
          >
            Set charlie
          </button>
          <Listbox
            data-testid="ps-listbox"
            value={value}
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <Listbox.Option value="alpha" data-testid="ps-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="ps-bravo">
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="ps-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="ps-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-KEY-07: interactive descendants own their keystrokes.
export const Descendants = () => {
  const [calls, setCalls] = React.useState<string[]>([])
  const [text, setText] = React.useState('')
  const [clicks, setClicks] = React.useState(0)
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="desc-root" maxW="80r">
        <Div width="60r" mb="4r">
          <Listbox
            data-testid="desc-listbox"
            value="alpha"
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <Listbox.Option value="alpha" data-testid="desc-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" data-testid="desc-bravo">
              <span>Bravo </span>
              <input
                data-testid="desc-input"
                value={text}
                onChange={e => setText(e.target.value)}
                aria-label="Bravo note"
              />
              <button data-testid="desc-button" onClick={() => setClicks(c => c + 1)}>
                Act
              </button>
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="desc-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="desc-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
        <Span data-testid="desc-text" fontSize="3.5r" color="design.text.base">
          {text}
        </Span>
        <Span data-testid="desc-clicks" fontSize="3.5r" color="design.text.base">
          {clicks}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-DYNAMIC-03: removing the selected option never corrects the value.
export const SelectedRemove = () => {
  const [items, setItems] = React.useState(['alpha', 'bravo', 'charlie'])
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="sr-root" maxW="80r">
        <button data-testid="sr-outside">Outside</button>
        <Div width="60r" mb="4r">
          <button
            data-testid="sr-remove-bravo"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setItems(prev => prev.filter(i => i !== 'bravo'))}
          >
            Remove bravo
          </button>
          <button
            data-testid="sr-remount-bravo"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setItems(['alpha', 'bravo', 'charlie'])}
          >
            Remount bravo
          </button>
          <Listbox
            data-testid="sr-listbox"
            value="bravo"
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            {items.map(item => (
              <Listbox.Option key={item} value={item} data-testid={`sr-${item}`}>
                {item}
              </Listbox.Option>
            ))}
          </Listbox>
        </Div>
        <Span data-testid="sr-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-DYNAMIC-04: a newly disabled option leaves navigation, keeps selection.
export const DynamicDisable = () => {
  const [disabledBravo, setDisabledBravo] = React.useState(false)
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="dd-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button
            data-testid="dd-disable-bravo"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setDisabledBravo(true)}
          >
            Disable bravo
          </button>
          <Listbox
            data-testid="dd-listbox"
            value="bravo"
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <Listbox.Option value="alpha" data-testid="dd-alpha">
              Alpha
            </Listbox.Option>
            <Listbox.Option value="bravo" disabled={disabledBravo} data-testid="dd-bravo">
              Bravo
            </Listbox.Option>
            <Listbox.Option value="charlie" data-testid="dd-charlie">
              Charlie
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="dd-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-DYNAMIC-05: same-position value change replaces the registration.
export const DynamicValue = () => {
  const [middle, setMiddle] = React.useState('bravo')
  const [collide, setCollide] = React.useState(false)
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="dv-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button
            data-testid="dv-to-delta"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setMiddle('delta')}
          >
            bravo to delta
          </button>
          <button
            data-testid="dv-collide"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setCollide(true)}
          >
            Collide delta
          </button>
          <CaptureBoundary testid="dv-error">
            <Listbox
              data-testid="dv-listbox"
              value={null}
              onChange={val => setCalls(prev => [...prev, val as string])}
            >
              <Listbox.Option value="alpha" data-testid="dv-alpha">
                Alpha
              </Listbox.Option>
              <Listbox.Option key="middle" value={middle} data-testid="dv-middle">
                {middle}
              </Listbox.Option>
              {collide && (
                <Listbox.Option value="delta" data-testid="dv-delta-dup">
                  Delta again
                </Listbox.Option>
              )}
              <Listbox.Option value="charlie" data-testid="dv-charlie">
                Charlie
              </Listbox.Option>
            </Listbox>
          </CaptureBoundary>
        </Div>
        <Span data-testid="dv-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-DYNAMIC-06: typeahead follows current labels, then explicit textValue.
export const DynamicLabel = () => {
  const [label, setLabel] = React.useState('Apple')
  const [explicit, setExplicit] = React.useState<string | undefined>(undefined)
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="dl-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button
            data-testid="dl-to-zulu"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setLabel('Zulu')}
          >
            Label to Zulu
          </button>
          <button
            data-testid="dl-explicit-bravo"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setExplicit('Bravo')}
          >
            textValue to Bravo
          </button>
          <Listbox
            data-testid="dl-listbox"
            value="alpha"
            onChange={val => setCalls(prev => [...prev, val as string])}
          >
            <Listbox.Option value="alpha" textValue={explicit} data-testid="dl-alpha">
              {label}
            </Listbox.Option>
            <Listbox.Option value="mango" data-testid="dl-mango">
              Mango
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="dl-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-VIRT-10: unmount during pending scroll-to-index work; sibling unaffected.
export const VirtualUnmount = () => {
  const [logicalItems] = React.useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      value: `item-${i}`,
      textValue: `Item ${i}`,
      disabled: false,
    }))
  )
  const [range, setRange] = React.useState({ start: 0, end: 4 })
  const [mounted, setMounted] = React.useState(true)
  const [scrollLog, setScrollLog] = React.useState<number[]>([])
  const adapter = React.useMemo(
    () => ({
      items: logicalItems,
      scrollToIndex: (idx: number) => setScrollLog(prev => [...prev, idx]),
    }),
    [logicalItems]
  )
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="vu-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button
            data-testid="vu-unmount"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setMounted(false)}
          >
            Unmount virtual
          </button>
          <button data-testid="vu-mount-5-10" onClick={() => setRange({ start: 5, end: 10 })}>
            Mount 5..10
          </button>
          {mounted && (
            <Listbox data-testid="vu-listbox" value={null} onChange={() => {}} virtual={adapter}>
              {Array.from({ length: range.end - range.start + 1 }, (_, idx) => {
                const itemIndex = range.start + idx
                const item = logicalItems[itemIndex]!
                return (
                  <Listbox.Option
                    key={item.value}
                    value={item.value}
                    index={itemIndex}
                    textValue={item.textValue}
                    data-testid={`vu-opt-${itemIndex}`}
                  >
                    {item.textValue}
                  </Listbox.Option>
                )
              })}
            </Listbox>
          )}
          <Listbox data-testid="vu-sibling" value={null} onChange={() => {}}>
            <Listbox.Option value="s-alpha" data-testid="vu-s-alpha">
              S Alpha
            </Listbox.Option>
            <Listbox.Option value="s-bravo" data-testid="vu-s-bravo">
              S Bravo
            </Listbox.Option>
          </Listbox>
        </Div>
        <Span data-testid="vu-scroll-log" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(scrollLog)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-VIRT-09 (browser): atomically replace logical metadata + scroll callback.
export const VirtualReplace = () => {
  const [generation, setGeneration] = React.useState(0)
  const [broken, setBroken] = React.useState(false)
  const [range, setRange] = React.useState({ start: 0, end: 2 })
  const [logA, setLogA] = React.useState<number[]>([])
  const [logB, setLogB] = React.useState<number[]>([])
  const itemsA = React.useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        value: `a-${i}`,
        textValue: `A ${i}`,
        disabled: false,
      })),
    []
  )
  const itemsB = React.useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        value: `b-${i}`,
        textValue: `B ${i}`,
        disabled: false,
      })),
    []
  )
  const liveItems = generation === 0 ? itemsA : itemsB
  const displayItems = broken
    ? [
        { value: 'dup', textValue: 'Dup 0', disabled: false },
        { value: 'dup', textValue: 'Dup 1', disabled: false },
        ...liveItems.slice(2),
      ]
    : liveItems
  const adapter = React.useMemo(
    () => ({
      items: displayItems,
      scrollToIndex: (idx: number) =>
        generation === 0
          ? setLogA(prev => [...prev, idx])
          : setLogB(prev => [...prev, idx]),
    }),
    [displayItems, generation]
  )
  const mountedItems = displayItems.slice(range.start, range.end + 1)
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="vr-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button
            data-testid="vr-replace"
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              setBroken(false)
              setGeneration(1)
              setRange({ start: 0, end: 2 })
            }}
          >
            Replace with B
          </button>
          <button
            data-testid="vr-break"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setBroken(true)}
          >
            Break mapping
          </button>
          <button
            data-testid="vr-fix"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setBroken(false)}
          >
            Fix mapping
          </button>
          <CaptureBoundary testid="vr-error" key={broken ? 'broken' : 'ok'}>
            <Listbox data-testid="vr-listbox" value={null} onChange={() => {}} virtual={adapter}>
              {mountedItems.map((item, offset) => (
                <Listbox.Option
                  key={`${generation}-${range.start + offset}`}
                  value={item.value}
                  index={range.start + offset}
                  textValue={item.textValue}
                  data-testid={`vr-opt-${range.start + offset}`}
                >
                  {item.textValue}
                </Listbox.Option>
              ))}
            </Listbox>
          </CaptureBoundary>
        </Div>
        <Span data-testid="vr-log-a" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(logA)}
        </Span>
        <Span data-testid="vr-log-b" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(logB)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-VIRT-08: variable-height window in a scrolling viewport; app recalculates.
export const VirtualResize = () => {
  const [logicalItems] = React.useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      value: `item-${i}`,
      textValue: `Item ${i}`,
      disabled: false,
    }))
  )
  const [range, setRange] = React.useState({ start: 0, end: 4 })
  const [compact, setCompact] = React.useState(false)
  const [scrollLog, setScrollLog] = React.useState<number[]>([])
  const adapter = React.useMemo(
    () => ({
      items: logicalItems,
      scrollToIndex: (idx: number) => setScrollLog(prev => [...prev, idx]),
    }),
    [logicalItems]
  )
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="vrz-root" maxW="80r">
        <Div width="60r" mb="4r">
          <button
            data-testid="vrz-recalc"
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              setCompact(true)
              setRange({ start: 1, end: 5 })
            }}
          >
            Resize + recalc
          </button>
          <button data-testid="vrz-mount-5-10" onClick={() => setRange({ start: 5, end: 10 })}>
            Mount 5..10
          </button>
          <Listbox
            data-testid="vrz-listbox"
            value={null}
            onChange={() => {}}
            virtual={adapter}
            style={{ height: compact ? 90 : 220, overflowY: 'auto' }}
          >
            {Array.from({ length: range.end - range.start + 1 }, (_, idx) => {
              const itemIndex = range.start + idx
              const item = logicalItems[itemIndex]!
              return (
                <Listbox.Option
                  key={item.value}
                  value={item.value}
                  index={itemIndex}
                  textValue={item.textValue}
                  data-testid={`vrz-opt-${itemIndex}`}
                  style={{ height: 30 + (itemIndex % 3) * 22 }}
                >
                  {item.textValue}
                </Listbox.Option>
              )
            })}
          </Listbox>
        </Div>
        <Span data-testid="vrz-scroll-log" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(scrollLog)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-COMP-03: 100 logical items, variable-height middle window.
export const Virtual100 = () => {
  const [logicalItems] = React.useState(() =>
    Array.from({ length: 100 }, (_, i) => ({
      value: `item-${i}`,
      textValue: i === 77 ? 'Zulu' : `Item ${i}`,
      disabled: i === 3,
    }))
  )
  const [range, setRange] = React.useState({ start: 40, end: 46 })
  const [scrollLog, setScrollLog] = React.useState<number[]>([])
  const [value, setValue] = React.useState<string | null>(null)
  const [calls, setCalls] = React.useState<string[]>([])
  const adapter = React.useMemo(
    () => ({
      items: logicalItems,
      scrollToIndex: (idx: number) => setScrollLog(prev => [...prev, idx]),
    }),
    [logicalItems]
  )
  const mount = (testid: string, start: number, end: number, label: string) => (
    <button key={testid} data-testid={testid} onClick={() => setRange({ start, end })}>
      {label}
    </button>
  )
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="v100-root" maxW="80r">
        <Div width="60r" mb="4r">
          {mount('v100-mount-0-6', 0, 6, 'Mount 0..6')}
          {mount('v100-mount-40-46', 40, 46, 'Mount 40..46')}
          {mount('v100-mount-75-80', 75, 80, 'Mount 75..80')}
          {mount('v100-mount-93-99', 93, 99, 'Mount 93..99')}
          <button data-testid="v100-set-77" onClick={() => setValue('item-77')}>
            Select item-77
          </button>
          <Listbox
            data-testid="v100-listbox"
            value={value}
            onChange={val => {
              setCalls(prev => [...prev, val as string])
            }}
            virtual={adapter}
          >
            {Array.from({ length: range.end - range.start + 1 }, (_, idx) => {
              const itemIndex = range.start + idx
              const item = logicalItems[itemIndex]!
              return (
                <Listbox.Option
                  key={item.value}
                  value={item.value}
                  index={itemIndex}
                  disabled={item.disabled}
                  textValue={item.textValue}
                  data-testid={`v100-opt-${itemIndex}`}
                  style={{ height: 30 + (itemIndex % 4) * 14 }}
                >
                  {item.textValue}
                </Listbox.Option>
              )
            })}
          </Listbox>
        </Div>
        <Span data-testid="v100-scroll-log" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(scrollLog)}
        </Span>
        <Span data-testid="v100-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-CB-01/03/04: live Combobox over a mounted Listbox (read-only consumer).
export const ComboBasic = () => {
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="cb-root">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox
            value={value}
            onChange={v => {
              setLog(prev => [...prev, `change:${v}`])
              setValue(v)
            }}
          >
            <Combobox.Input data-testid="cb-input" placeholder="Select..." />
            <Combobox.Popover data-testid="cb-popover">
              <Listbox>
                <Listbox.Option value="alpha" data-testid="cb-alpha">
                  Alpha
                </Listbox.Option>
                <Listbox.Option value="bravo" data-testid="cb-bravo">
                  Bravo
                </Listbox.Option>
                <Listbox.Option value="charlie" data-testid="cb-charlie">
                  Charlie
                </Listbox.Option>
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Span fontSize="3r" color="design.text.light" data-testid="cb-value">
          Selected: {value ?? 'None'}
        </Span>
        <Div data-testid="cb-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-CB-02: windowed Listbox inside a live Combobox. The Combobox windowed
// driver (CB-VIRT-*) reads this Listbox's own `virtual` prop for unmounted
// targets: scrollToIndex + deferred aria-activedescendant until mount.
export const ComboWindowed = () => {
  const [logicalItems] = React.useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      value: `item-${i}`,
      textValue: `Item ${i}`,
      disabled: false,
    }))
  )
  const [range, setRange] = React.useState({ start: 0, end: 4 })
  const [scrollLog, setScrollLog] = React.useState<number[]>([])
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const adapter = React.useMemo(
    () => ({
      items: logicalItems,
      scrollToIndex: (idx: number) => setScrollLog(prev => [...prev, idx]),
    }),
    [logicalItems]
  )
  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="cbw-root">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox
            value={value}
            onChange={v => {
              setLog(prev => [...prev, `change:${v}`])
              setValue(v)
            }}
          >
            <Combobox.Input data-testid="cbw-input" placeholder="Select..." />
            <Combobox.Popover data-testid="cbw-popover">
              {/* Window control lives INSIDE the popover: moving the window
                  must not dismiss it or steal source focus (the popover's
                  mousedown prevention keeps focus in place). */}
              <button
                data-testid="cbw-mount-5-9"
                type="button"
                onClick={() => setRange({ start: 5, end: 9 })}
              >
                Mount 5..9
              </button>
              <Listbox data-testid="cbw-listbox" virtual={adapter}>
                {Array.from({ length: range.end - range.start + 1 }, (_, idx) => {
                  const itemIndex = range.start + idx
                  const item = logicalItems[itemIndex]!
                  return (
                    <Listbox.Option
                      key={item.value}
                      value={item.value}
                      index={itemIndex}
                      textValue={item.textValue}
                      data-testid={`cbw-opt-${itemIndex}`}
                    >
                      {item.textValue}
                    </Listbox.Option>
                  )
                })}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Div data-testid="cbw-log">{JSON.stringify(log)}</Div>
        <Div data-testid="cbw-scroll-log">{JSON.stringify(scrollLog)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-ENV-03: standalone + windowed Listboxes inside an open ShadowRoot.
export const Shadow = () => {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const [shadow, setShadow] = React.useState<ShadowRoot | null>(null)
  const [calls, setCalls] = React.useState<string[]>([])
  const [scrollLog, setScrollLog] = React.useState<number[]>([])
  const [logicalItems] = React.useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      value: `item-${i}`,
      textValue: i === 15 ? 'Zulu' : `Item ${i}`,
      disabled: false,
    }))
  )
  const [range, setRange] = React.useState({ start: 0, end: 4 })
  const adapter = React.useMemo(
    () => ({
      items: logicalItems,
      scrollToIndex: (idx: number) => setScrollLog(prev => [...prev, idx]),
    }),
    [logicalItems]
  )
  React.useEffect(() => {
    if (hostRef.current && !hostRef.current.shadowRoot) {
      setShadow(hostRef.current.attachShadow({ mode: 'open' }))
    }
  }, [])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="sh-root" maxW="80r">
        <button data-testid="sh-before">Before</button>
        <button data-testid="sh-mount-13-17" onClick={() => setRange({ start: 13, end: 17 })}>
          Mount 13..17
        </button>
        <div ref={hostRef} data-testid="sh-host" />
        {shadow &&
          createPortal(
            <div>
              <Listbox
                data-testid="sh-listbox"
                value={null}
                onChange={val => setCalls(prev => [...prev, val as string])}
              >
                <Listbox.Option value="alpha" data-testid="sh-alpha">
                  Alpha
                </Listbox.Option>
                <Listbox.Option value="bravo" data-testid="sh-bravo">
                  Bravo
                </Listbox.Option>
                <Listbox.Option value="charlie" data-testid="sh-charlie">
                  Charlie
                </Listbox.Option>
              </Listbox>
              <Listbox data-testid="sh-virt" value={null} onChange={() => {}} virtual={adapter}>
                {Array.from({ length: range.end - range.start + 1 }, (_, idx) => {
                  const itemIndex = range.start + idx
                  const item = logicalItems[itemIndex]!
                  return (
                    <Listbox.Option
                      key={item.value}
                      value={item.value}
                      index={itemIndex}
                      textValue={item.textValue}
                      data-testid={`sh-opt-${itemIndex}`}
                    >
                      {item.textValue}
                    </Listbox.Option>
                  )
                })}
              </Listbox>
            </div>,
            shadow as unknown as Element
          )}
        <Span data-testid="sh-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
        <Span data-testid="sh-scroll-log" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(scrollLog)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-A11Y-01: every frozen semantic shape in one gallery (structural half;
// the repo has no configured a11y scanner dependency — see SPEC).
export const A11yShapes = () => {
  const [items] = React.useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      value: `item-${i}`,
      textValue: `Item ${i}`,
      disabled: false,
    }))
  )
  const adapter = React.useMemo(() => ({ items, scrollToIndex: () => {} }), [items])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="a11y-root" maxW="80r">
        <Listbox data-testid="a11y-single" aria-label="Single fruits" value="apple" onChange={() => {}}>
          <Listbox.Option value="apple" data-testid="a11y-s-apple">
            Apple
          </Listbox.Option>
          <Listbox.Option value="banana" disabled data-testid="a11y-s-banana">
            Banana
          </Listbox.Option>
        </Listbox>
        <Listbox
          data-testid="a11y-multi"
          aria-label="Multi fruits"
          selection="multiple"
          value={['apple']}
          onChange={() => {}}
        >
          <Listbox.Option value="apple" data-testid="a11y-m-apple">
            Apple
          </Listbox.Option>
          <Listbox.Option value="banana" data-testid="a11y-m-banana">
            Banana
          </Listbox.Option>
        </Listbox>
        <Listbox data-testid="a11y-disabled" aria-label="Disabled list" disabled value={null} onChange={() => {}}>
          <Listbox.Option value="apple" data-testid="a11y-d-apple">
            Apple
          </Listbox.Option>
        </Listbox>
        <Listbox data-testid="a11y-empty" aria-label="Empty list" value={null} onChange={() => {}} />
        <Listbox
          data-testid="a11y-horizontal"
          aria-label="Horizontal list"
          orientation="horizontal"
          value={null}
          onChange={() => {}}
        >
          <Listbox.Option value="apple" data-testid="a11y-h-apple">
            Apple
          </Listbox.Option>
        </Listbox>
        <Listbox
          data-testid="a11y-virtual"
          aria-label="Virtual list"
          value={null}
          onChange={() => {}}
          virtual={adapter}
        >
          {items.slice(0, 3).map((item, index) => (
            <Listbox.Option
              key={item.value}
              value={item.value}
              index={index}
              textValue={item.textValue}
              data-testid={`a11y-v-${index}`}
            >
              {item.textValue}
            </Listbox.Option>
          ))}
        </Listbox>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-COMP-01: complete controlled single-select composition.
export const CompSingle = () => {
  const [items, setItems] = React.useState(['alpha', 'bravo', 'charlie', 'delta'])
  const [value, setValue] = React.useState<string | null>('alpha')
  const [calls, setCalls] = React.useState<string[]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="cs-root" maxW="80r">
        <button data-testid="cs-before">Before</button>
        <Div width="60r" mb="4r">
          <button
            data-testid="cs-remove-bravo"
            tabIndex={-1}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setItems(prev => prev.filter(i => i !== 'bravo'))}
          >
            Remove bravo
          </button>
          <Listbox
            data-testid="cs-listbox"
            aria-label="Composition single"
            value={value}
            onChange={val => {
              setValue(val as string)
              setCalls(prev => [...prev, val as string])
            }}
          >
            {items.map(item => (
              <Listbox.Option
                key={item}
                value={item}
                disabled={item === 'charlie'}
                data-testid={`cs-${item}`}
              >
                {item}
              </Listbox.Option>
            ))}
          </Listbox>
        </Div>
        <Span data-testid="cs-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// LB-COMP-02: controlled multiple selection in horizontal RTL.
export const CompMultiRTL = () => {
  const [value, setValue] = React.useState<string[]>(['alpha', 'echo'])
  const [calls, setCalls] = React.useState<string[][]>([])
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="cm-root" maxW="120r">
        <div dir="rtl" data-testid="cm-dir">
          <Listbox
            data-testid="cm-listbox"
            aria-label="Composition multi"
            orientation="horizontal"
            selection="multiple"
            value={value}
            onChange={val => {
              setValue(val as string[])
              setCalls(prev => [...prev, val as string[]])
            }}
          >
            {['alpha', 'bravo', 'charlie', 'delta', 'echo'].map(item => (
              <Listbox.Option
                key={item}
                value={item}
                disabled={item === 'charlie'}
                data-testid={`cm-${item}`}
              >
                {item}
              </Listbox.Option>
            ))}
          </Listbox>
        </div>
        <Span data-testid="cm-calls" fontSize="3.5r" color="design.text.base">
          {JSON.stringify(calls)}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

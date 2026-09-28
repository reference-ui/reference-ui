import * as React from 'react'
import { Div, Span, Button } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Listbox } from './index'
import { Popover } from '../Popover'

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

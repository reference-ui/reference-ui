import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Accordion } from './index'
import { Collapsible } from '../Collapsible'
import { dividerContent, dividerTrigger } from '../disclosureChrome'

export const Single = () => {
  const [value, setValue] = React.useState<string | null>('item-1')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" maxW="100r" data-testid="accordion-fixture-root">
        <Accordion
          data-testid="test-accordion"
          value={value}
          onChange={(v) => setValue(v as string | null)}
          expansion="single"
          display="flex"
          flexDirection="column"
        >
          <Accordion.Item id="item-1">
            <Accordion.Trigger {...dividerTrigger} data-testid="btn-trigger-1">
              Section 1
            </Accordion.Trigger>
            <Accordion.Content {...dividerContent} data-testid="content-1">
              <Span fontSize="3.5r" color="design.text.light">
                Content for section 1
              </Span>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item id="item-2">
            <Accordion.Trigger {...dividerTrigger} data-testid="btn-trigger-2">
              Section 2
            </Accordion.Trigger>
            <Accordion.Content {...dividerContent} data-testid="content-2">
              <Span fontSize="3.5r" color="design.text.light">
                Content for section 2
              </Span>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item id="item-3">
            <Accordion.Trigger {...dividerTrigger} data-testid="btn-trigger-3">
              Section 3
            </Accordion.Trigger>
            <Accordion.Content {...dividerContent} data-testid="content-3">
              <Span fontSize="3.5r" color="design.text.light">
                Content for section 3
              </Span>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

export const Multiple = () => {
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" maxW="100r" data-testid="accordion-multiple-root">
        <Accordion
          expansion="multiple"
          defaultValue={['item-1', 'item-2']}
          display="flex"
          flexDirection="column"
        >
          <Accordion.Item id="item-1">
            <Accordion.Trigger {...dividerTrigger} data-testid="multi-trigger-1">
              Multi Section 1
            </Accordion.Trigger>
            <Accordion.Content {...dividerContent} data-testid="multi-content-1">
              <Span fontSize="3.5r" color="design.text.light">
                Content for multi section 1
              </Span>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item id="item-2">
            <Accordion.Trigger {...dividerTrigger} data-testid="multi-trigger-2">
              Multi Section 2
            </Accordion.Trigger>
            <Accordion.Content {...dividerContent} data-testid="multi-content-2">
              <Span fontSize="3.5r" color="design.text.light">
                Content for multi section 2
              </Span>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-DOM-01: transparent disclosure anatomy (Q fixture section-dom-01).
export const DomAnatomy = () => {
  const [value, setValue] = React.useState<string | null>('item-1')

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <div data-testid="dom-01-sibling-before">Before Sibling</div>
        <Accordion
          data-testid="dom-01-root"
          expansion="single"
          value={value}
          onChange={(val) => setValue(val as string | null)}
        >
          <Collapsible id="item-1">
            <Collapsible.Trigger data-testid="btn-trigger-1">Section 1</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-1">
              <p>Content for section 1</p>
            </Collapsible.Content>
          </Collapsible>
          <div data-testid="dom-01-sibling-middle">Middle Sibling</div>
          <Collapsible id="item-2">
            <Collapsible.Trigger data-testid="btn-trigger-2">Section 2</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-2">
              <p>Content for section 2</p>
            </Collapsible.Content>
          </Collapsible>
        </Accordion>
        <div data-testid="dom-01-sibling-after">After Sibling</div>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-KEY-01 / AC-KEY-02: arrow traversal and wrapping.
export const KeyTraversal = () => {
  const [value, setValue] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <Accordion
          data-testid="key-traverse-root"
          expansion="single"
          keyboard="headers"
          value={value}
          onChange={(val) => setValue(val as string | null)}
        >
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="key-trigger-a">A</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="key-trigger-b">B</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="c">
            <Collapsible.Trigger data-testid="key-trigger-c">C</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-KEY-03: Home and End to enabled boundaries (B disabled).
export const KeyBoundaries = () => {
  const [value, setValue] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <Accordion
          data-testid="key-bound-root"
          expansion="single"
          keyboard="headers"
          value={value}
          onChange={(val) => setValue(val as string | null)}
        >
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="bound-trigger-a">A</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="b" disabled>
            <Collapsible.Trigger data-testid="bound-trigger-b">B</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="c">
            <Collapsible.Trigger data-testid="bound-trigger-c">C</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="d">
            <Collapsible.Trigger data-testid="bound-trigger-d">D</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-KEY-04: skip disabled + trigger disabled after it held focus.
export const KeyDisabled = () => {
  const [dynDisabled, setDynDisabled] = React.useState(true)

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <button data-testid="btn-toggle-dyn-disabled" onClick={() => setDynDisabled((d) => !d)}>
          Toggle B Disabled
        </button>
        <Accordion data-testid="key-disabled-root" expansion="single" keyboard="headers">
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="dyn-trigger-a">A</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="b" disabled={dynDisabled}>
            <Collapsible.Trigger data-testid="dyn-trigger-b">B</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="c" disabled>
            <Collapsible.Trigger data-testid="dyn-trigger-c">C</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="d">
            <Collapsible.Trigger data-testid="dyn-trigger-d">D</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-KEY-05: navigation keys do not activate.
export const KeyNoActivate = () => {
  const [value, setValue] = React.useState<string | null>('a')
  const [logs, setLogs] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <div data-testid="key-no-act-log">{logs.join(',')}</div>
        <Accordion
          data-testid="key-no-act-root"
          expansion="single"
          keyboard="headers"
          value={value}
          onChange={(val) => {
            setValue(val as string | null)
            setLogs((l) => [...l, String(val)])
          }}
        >
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="noact-trigger-a">A</Collapsible.Trigger>
            <Collapsible.Content data-testid="noact-content-a">Panel A</Collapsible.Content>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="noact-trigger-b">B</Collapsible.Trigger>
            <Collapsible.Content data-testid="noact-content-b">Panel B</Collapsible.Content>
          </Collapsible>
          <Collapsible id="c">
            <Collapsible.Trigger data-testid="noact-trigger-c">C</Collapsible.Trigger>
            <Collapsible.Content data-testid="noact-content-c">Panel C</Collapsible.Content>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-KEY-06: native Space and Enter activation, exactly once.
export const NativeKeys = () => {
  const [singleValue, setSingleValue] = React.useState<string | null>(null)
  const [singleLogs, setSingleLogs] = React.useState<string[]>([])
  const [multiValue, setMultiValue] = React.useState<string[]>([])
  const [multiLogs, setMultiLogs] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <div data-testid="native-single-log">{singleLogs.join(',')}</div>
        <Accordion
          data-testid="native-single-root"
          expansion="single"
          value={singleValue}
          onChange={(val) => {
            setSingleValue(val as string | null)
            setSingleLogs((l) => [...l, String(val)])
          }}
        >
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="native-single-trigger-b">Single B</Collapsible.Trigger>
          </Collapsible>
        </Accordion>

        <div data-testid="native-multi-log">{multiLogs.join(';')}</div>
        <Accordion
          data-testid="native-multi-root"
          expansion="multiple"
          value={multiValue}
          onChange={(val) => {
            const next = val as string[]
            setMultiValue(next)
            setMultiLogs((l) => [...l, next.join(',')])
          }}
        >
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="native-multi-trigger-b">Multi B</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-KEY-07: traversal keys originating inside item Content are ignored.
export const ContentKeys = () => {
  const [logs, setLogs] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <div data-testid="content-keys-log">{logs.join(',')}</div>
        <Accordion
          data-testid="content-keys-root"
          expansion="single"
          keyboard="headers"
          value="a"
          onChange={(val) => setLogs((l) => [...l, String(val)])}
        >
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="content-keys-trigger-a">Trigger A</Collapsible.Trigger>
            <Collapsible.Content data-testid="content-keys-panel-a">
              <input data-testid="content-descendant-input" placeholder="Type here" />
              <a href="#test" data-testid="content-descendant-link">Descendant Link</a>
              <button data-testid="content-descendant-button">Descendant Button</button>
            </Collapsible.Content>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="content-keys-trigger-b">Trigger B</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-KEY-08: keyboard="none" leaves navigation native, activation intact.
export const KeyboardNone = () => {
  const [value, setValue] = React.useState<string | null>(null)
  const [logs, setLogs] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <div data-testid="none-key-log">{logs.join(',')}</div>
        <Accordion
          data-testid="none-key-root"
          expansion="single"
          keyboard="none"
          value={value}
          onChange={(val) => {
            setValue(val as string | null)
            setLogs((l) => [...l, String(val)])
          }}
        >
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="none-trigger-a">A</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="none-trigger-b">B</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="c">
            <Collapsible.Trigger data-testid="none-trigger-c">C</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-KEY-09: consumer key cancellation runs before header navigation.
export const KeyCancel = () => {
  const [logs, setLogs] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <div data-testid="cancel-log">{logs.join(',')}</div>
        <Accordion data-testid="cancel-root" expansion="single" keyboard="headers">
          <Collapsible id="b">
            <Collapsible.Trigger
              data-testid="cancel-trigger-b"
              onKeyDown={(e) => {
                if (['ArrowDown', 'Home', ' ', 'Enter'].includes(e.key)) {
                  setLogs((l) => [...l, `canceled:${e.key}`])
                  e.preventDefault()
                }
              }}
            >
              Cancel B
            </Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-KEY-10: header order follows live collection through reorder.
export const DynamicOrder = () => {
  const [items, setItems] = React.useState<string[]>(['a', 'b', 'c'])

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <button data-testid="btn-reorder-to-cxa" onClick={() => setItems(['c', 'x', 'a'])}>
          Reorder to C, X, A
        </button>
        <button data-testid="btn-insert-x" onClick={() => setItems(['a', 'x', 'b', 'c'])}>
          Insert X
        </button>
        <button data-testid="btn-remove-b" onClick={() => setItems(['a', 'x', 'c'])}>
          Remove B
        </button>
        <Accordion data-testid="dyn-order-root" expansion="single" keyboard="headers">
          {items.map((id) => (
            <Collapsible key={id} id={id}>
              <Collapsible.Trigger data-testid={`dyn-order-trigger-${id}`}>
                Item {id.toUpperCase()}
              </Collapsible.Trigger>
            </Collapsible>
          ))}
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-KEY-11: every enabled header stays in the native Tab sequence.
export const TabSequence = () => {
  const [value, setValue] = React.useState<string | null>('b')

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <a href="#before" data-testid="tab-link-before">Link Before</a>
        <Accordion
          data-testid="tab-seq-root"
          expansion="single"
          keyboard="headers"
          value={value}
          onChange={(val) => setValue(val as string | null)}
        >
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="tab-trigger-a">Header A</Collapsible.Trigger>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="tab-trigger-b">Header B</Collapsible.Trigger>
            <Collapsible.Content data-testid="tab-content-b">
              <button data-testid="tab-content-inner-btn">Inner Action</button>
            </Collapsible.Content>
          </Collapsible>
          <Collapsible id="c">
            <Collapsible.Trigger data-testid="tab-trigger-c">Header C</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
        <a href="#after" data-testid="tab-link-after">Link After</a>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-NEST-01: nested accordions keep collection, values, and keys independent.
export const Nested = () => {
  const [outerValue, setOuterValue] = React.useState<string | null>('outer-a')
  const [innerValue, setInnerValue] = React.useState<string | null>(null)
  const [outerLogs, setOuterLogs] = React.useState<string[]>([])
  const [innerLogs, setInnerLogs] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <div data-testid="nest-outer-log">{outerLogs.join(',')}</div>
        <div data-testid="nest-inner-log">{innerLogs.join(',')}</div>
        <Accordion
          data-testid="nest-outer-root"
          expansion="single"
          keyboard="headers"
          value={outerValue}
          onChange={(val) => {
            setOuterValue(val as string | null)
            setOuterLogs((l) => [...l, String(val)])
          }}
        >
          <Collapsible id="outer-a">
            <Collapsible.Trigger data-testid="nest-outer-trigger-a">Outer A</Collapsible.Trigger>
            <Collapsible.Content data-testid="nest-outer-content-a">
              <Accordion
                data-testid="nest-inner-root"
                expansion="single"
                keyboard="headers"
                value={innerValue}
                onChange={(val) => {
                  setInnerValue(val as string | null)
                  setInnerLogs((l) => [...l, String(val)])
                }}
              >
                <Collapsible id="inner-x">
                  <Collapsible.Trigger data-testid="nest-inner-trigger-x">Inner X</Collapsible.Trigger>
                  <Collapsible.Content data-testid="nest-inner-content-x">Inner Content X</Collapsible.Content>
                </Collapsible>
                <Collapsible id="inner-y">
                  <Collapsible.Trigger data-testid="nest-inner-trigger-y">Inner Y</Collapsible.Trigger>
                  <Collapsible.Content data-testid="nest-inner-content-y">Inner Content Y</Collapsible.Content>
                </Collapsible>
              </Accordion>
            </Collapsible.Content>
          </Collapsible>
          <Collapsible id="outer-b">
            <Collapsible.Trigger data-testid="nest-outer-trigger-b">Outer B</Collapsible.Trigger>
            <Collapsible.Content data-testid="nest-outer-content-b">Outer Content B</Collapsible.Content>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-PRES-01: old Content exits while only the new item reads expanded.
export const PresenceStory = () => {
  const [value, setValue] = React.useState<string | null>('a')
  const [logs, setLogs] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <div data-testid="pres-log">{logs.join(',')}</div>
        <Accordion
          data-testid="pres-root"
          expansion="single"
          value={value}
          onChange={(val) => {
            setLogs((l) => [...l, String(val)])
            setValue(val as string | null)
          }}
        >
          <Collapsible id="a">
            <Collapsible.Trigger data-testid="pres-trigger-a">Trigger A</Collapsible.Trigger>
            <Collapsible.Content data-testid="pres-content-a" style={{ height: '80px' }}>
              Presence Panel A
            </Collapsible.Content>
          </Collapsible>
          <Collapsible id="b">
            <Collapsible.Trigger data-testid="pres-trigger-b">Trigger B</Collapsible.Trigger>
            <Collapsible.Content data-testid="pres-content-b" style={{ height: '80px' }}>
              Presence Panel B
            </Collapsible.Content>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-COMP-01: collapsible FAQ with native header tabbing.
export const Faq = () => {
  const [value, setValue] = React.useState<string | null>('faq-1')

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <Accordion
          data-testid="faq-root"
          expansion="single"
          keyboard="headers"
          value={value}
          onChange={(val) => setValue(val as string | null)}
        >
          <Collapsible id="faq-1">
            <Collapsible.Trigger data-testid="faq-trigger-1">Question 1</Collapsible.Trigger>
            <Collapsible.Content data-testid="faq-content-1">Answer 1</Collapsible.Content>
          </Collapsible>
          <Collapsible id="faq-2">
            <Collapsible.Trigger data-testid="faq-trigger-2">Question 2</Collapsible.Trigger>
            <Collapsible.Content data-testid="faq-content-2">Answer 2</Collapsible.Content>
          </Collapsible>
          <Collapsible id="faq-3">
            <Collapsible.Trigger data-testid="faq-trigger-3">Question 3</Collapsible.Trigger>
            <Collapsible.Content data-testid="faq-content-3">Answer 3</Collapsible.Content>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-COMP-02: multiple animated settings sections, independently controllable.
export const Settings = () => {
  const [order, setOrder] = React.useState<string[]>(['s1', 's2', 's3'])
  const [value, setValue] = React.useState<string[]>(['s1', 's3'])
  const [logs, setLogs] = React.useState<string[][]>([])

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <button data-testid="btn-reorder-settings" onClick={() => setOrder(['s3', 's2', 's1'])}>
          Reorder C before B
        </button>
        <div data-testid="settings-log">
          {logs.map((arr) => arr.join(',')).join(';')}
        </div>
        <Accordion
          data-testid="settings-root"
          expansion="multiple"
          value={value}
          onChange={(val) => {
            const next = val as string[]
            setLogs((l) => [...l, next])
            setValue(next)
          }}
        >
          {order.map((id) => (
            <Collapsible key={id} id={id}>
              <Collapsible.Trigger data-testid={`settings-trigger-${id}`}>
                Settings {id.toUpperCase()}
              </Collapsible.Trigger>
              <Collapsible.Content
                data-testid={`settings-content-${id}`}
                style={{ transition: 'height 100ms ease' }}
              >
                <button data-testid={`settings-focusable-${id}`}>Settings Option {id}</button>
              </Collapsible.Content>
            </Collapsible>
          ))}
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

// AC-COMP-03: traversal scoped to the outer group that enables it.
export const Scope = () => {
  const [outerVal, setOuterVal] = React.useState<string | null>('o1')
  const [innerVal, setInnerVal] = React.useState<string | null>(null)
  const [standaloneOpen, setStandaloneOpen] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="6r" data-testid="accordion-fixture-root">
        <Accordion
          data-testid="scope-outer-root"
          expansion="single"
          keyboard="headers"
          value={outerVal}
          onChange={(val) => setOuterVal(val as string | null)}
        >
          <Collapsible id="o1">
            <Collapsible.Trigger data-testid="scope-outer-trigger-1">Outer 1</Collapsible.Trigger>
            <Collapsible.Content data-testid="scope-outer-content-1">
              <Accordion
                data-testid="scope-inner-root"
                expansion="single"
                keyboard="none"
                value={innerVal}
                onChange={(val) => setInnerVal(val as string | null)}
              >
                <Collapsible id="i1">
                  <Collapsible.Trigger data-testid="scope-inner-trigger-1">Inner 1</Collapsible.Trigger>
                </Collapsible>
                <Collapsible id="i2">
                  <Collapsible.Trigger data-testid="scope-inner-trigger-2">Inner 2</Collapsible.Trigger>
                </Collapsible>
              </Accordion>

              <Collapsible
                id="standalone-extra"
                open={standaloneOpen}
                onChange={setStandaloneOpen}
              >
                <Collapsible.Trigger data-testid="scope-standalone-trigger">
                  Standalone In Panel
                </Collapsible.Trigger>
                <Collapsible.Content data-testid="scope-standalone-content">
                  Standalone Info
                </Collapsible.Content>
              </Collapsible>
            </Collapsible.Content>
          </Collapsible>
          <Collapsible id="o2">
            <Collapsible.Trigger data-testid="scope-outer-trigger-2">Outer 2</Collapsible.Trigger>
          </Collapsible>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

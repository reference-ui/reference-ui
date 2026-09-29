import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { NumberField, type NumberFieldDecrementProps } from './index'

export const StepperFixture = () => {
  const [value, setValue] = React.useState<number | null>(42)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="number-field-fixture-root">
        <Div style={{ margin: '16px 0', width: 220 }}>
          <NumberField
            data-testid="number-field-root"
            value={value}
            locale="en-US"
            onChange={setValue}
            min={0}
            max={100}
            step={1}
          >
            <NumberField.Group data-testid="number-field-group">
              <NumberField.Decrement aria-label="Decrement" data-testid="btn-decrement" />
              <NumberField.Input aria-label="Quantity" data-testid="number-field-input" />
              <NumberField.Increment aria-label="Increment" data-testid="btn-increment" />
            </NumberField.Group>
          </NumberField>
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="number-field-value-display">
          Numeric Value: {value !== null ? value : 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const DisabledFixture = () => (
  <ReferenceLibrary>
    <Div p="4r" maxW="80r">
      <NumberField value={7} locale="en-US" disabled min={0} max={100} data-testid="disabled-number-field">
        <NumberField.Group data-testid="disabled-number-field-group">
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increment" />
        </NumberField.Group>
      </NumberField>
    </Div>
  </ReferenceLibrary>
)

export const DecimalFixture = () => {
  const [value, setValue] = React.useState<number | null>(0)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <NumberField
          data-testid="decimal-number-field"
          value={value}
          locale="en-US"
          onChange={setValue}
          step={0.1}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" data-testid="decimal-btn-decrement" />
            <NumberField.Input aria-label="Quantity" data-testid="decimal-number-field-input" />
            <NumberField.Increment aria-label="Increment" data-testid="decimal-btn-increment" />
          </NumberField.Group>
        </NumberField>
      </Div>
    </ReferenceLibrary>
  )
}

export const UnboundedFixture = () => {
  const [value, setValue] = React.useState<number | null>(5)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <NumberField data-testid="unbounded-number-field" value={value} locale="en-US" onChange={setValue}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" data-testid="unbounded-btn-decrement" />
            <NumberField.Input aria-label="Quantity" data-testid="unbounded-number-field-input" />
            <NumberField.Increment aria-label="Increment" data-testid="unbounded-btn-increment" />
          </NumberField.Group>
        </NumberField>
      </Div>
    </ReferenceLibrary>
  )
}

// PATCHES §6 (NF-STEP-01): label + labelledby variants under two locales
// with identical authored names — locale changes never translate names.
export const NamedStepperFixture = () => {
  const [valueEn, setValueEn] = React.useState<number | null>(42)
  const [valueDe, setValueDe] = React.useState<number | null>(42)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <span id="named-en-inc-label">Increase quantity</span>
        <NumberField
          data-testid="named-en-field"
          value={valueEn}
          locale="en-US"
          onChange={setValueEn}
          min={0}
          max={100}
        >
          <NumberField.Group>
            <NumberField.Decrement data-testid="named-en-dec" aria-label="Decrease quantity" />
            <NumberField.Input aria-label="Quantity" data-testid="named-en-input" />
            <NumberField.Increment data-testid="named-en-inc" aria-labelledby="named-en-inc-label" />
          </NumberField.Group>
        </NumberField>
        <span id="named-de-inc-label">Increase quantity</span>
        <NumberField
          data-testid="named-de-field"
          value={valueDe}
          locale="de-DE"
          onChange={setValueDe}
          min={0}
          max={100}
        >
          <NumberField.Group>
            <NumberField.Decrement data-testid="named-de-dec" aria-label="Decrease quantity" />
            <NumberField.Input aria-label="Quantity" data-testid="named-de-input" />
            <NumberField.Increment data-testid="named-de-inc" aria-labelledby="named-de-inc-label" />
          </NumberField.Group>
        </NumberField>
      </Div>
    </ReferenceLibrary>
  )
}

// B-19: the exact playtest repro — empty field, min 1, max 10 — with a
// request counter proving commit happens once, never mid-keystroke.
export const BoundedDecimalFixture = () => {
  const [value, setValue] = React.useState<number | null>(null)
  const [requests, setRequests] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Div style={{ margin: '16px 0', width: 220 }}>
          <NumberField
            data-testid="bounded-decimal-field"
            value={value}
            locale="en-US"
            onChange={v => {
              setRequests(c => c + 1)
              setValue(v)
            }}
            min={1}
            max={10}
            step={1}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" data-testid="bounded-decimal-input" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="bounded-decimal-display">
          Decimal Value: {value !== null ? value : 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="bounded-decimal-log">
          requests: {requests}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// W-02: snap commit — type 2.5 at step 1, commit once to 3.
export const SnapFixture = () => {
  const [value, setValue] = React.useState<number | null>(null)
  const [requests, setRequests] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Div style={{ margin: '16px 0', width: 220 }}>
          <NumberField
            data-testid="snap-field"
            value={value}
            locale="en-US"
            commitBehavior="snap"
            onChange={v => {
              setRequests(c => c + 1)
              setValue(v)
            }}
            step={1}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" data-testid="snap-input" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="snap-display">
          Snap Value: {value !== null ? value : 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="snap-log">
          requests: {requests}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// NFLAST ruling (b): validate commit — invalid attempts are retained and
// reported (advisory log); the named field exposes canonical hidden state.
export const ValidateFixture = () => {
  const [value, setValue] = React.useState<number | null>(5)
  const [invalidLog, setInvalidLog] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Div style={{ margin: '16px 0', width: 220 }}>
          <NumberField
            data-testid="validate-field"
            value={value}
            locale="en-US"
            name="qty"
            commitBehavior="validate"
            onChange={setValue}
            onInvalidCommit={(attempted, reason) =>
              setInvalidLog(log => [...log, `${attempted}:${reason}`])
            }
            min={1}
            max={10}
            step={1}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" data-testid="validate-input" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="validate-display">
          Validate Value: {value !== null ? value : 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="validate-log">
          invalid: {invalidLog.length > 0 ? invalidLog.join(', ') : 'none'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// W-25: currency display with plain-number commits.
export const CurrencyFixture = () => {
  const [value, setValue] = React.useState<number | null>(1234.5)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Div style={{ margin: '16px 0', width: 220 }}>
          <NumberField
            data-testid="currency-field"
            value={value}
            locale="en-US"
            formatOptions={{ style: 'currency', currency: 'USD' }}
            onChange={setValue}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" data-testid="currency-input" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="currency-display">
          Currency Value: {value !== null ? value : 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// W-25: percent display with scaled plain-number commits.
export const PercentFixture = () => {
  const [value, setValue] = React.useState<number | null>(0.12)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Div style={{ margin: '16px 0', width: 220 }}>
          <NumberField
            data-testid="percent-field"
            value={value}
            locale="en-US"
            formatOptions={{ style: 'percent' }}
            onChange={setValue}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" data-testid="percent-input" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="percent-display">
          Percent Value: {value !== null ? value : 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// NF-DOM-02 / NF-SURF-01 / NF-FORM-02: named field in a live form with a
// warning-status Group — hidden canonical serialization plus the
// Field-surface host contract in one composition.
export const NamedFormFixture = () => {
  const [value, setValue] = React.useState<number | null>(1234.5)
  const [payload, setPayload] = React.useState('none')

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <form
          data-testid="named-form"
          onSubmit={e => {
            e.preventDefault()
            setPayload(Array.from(new FormData(e.currentTarget).entries()).map(([k, v]) => `${k}=${v}`).join(','))
          }}
        >
          <NumberField
            data-testid="named-form-field"
            value={value}
            locale="en-US"
            formatOptions={{ style: 'currency', currency: 'USD' }}
            onChange={setValue}
            name="price"
          >
            <NumberField.Group data-testid="named-form-group" status="warning">
              <NumberField.Decrement aria-label="Decrease price" />
              <NumberField.Input aria-label="Price" data-testid="named-form-input" />
              <NumberField.Increment aria-label="Increase price" />
            </NumberField.Group>
          </NumberField>
          <button type="submit" data-testid="named-form-submit">
            Submit
          </button>
        </form>
        <Span fontSize="3r" color="design.text.light" data-testid="named-form-payload">
          payload: {payload}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// Wave-2 commit lab (NF-COMMIT-01/02, NF-EDIT-11/14, NF-FORM-09,
// NF-COMP-01): echo toggle for accept/reject runs, consumer-first order log,
// request log, submit counter, and blur/reset targets.
export const CommitLabFixture = () => {
  const [value, setValue] = React.useState<number | null>(5)
  const [log, setLog] = React.useState<string[]>([])
  const [order, setOrder] = React.useState<string[]>([])
  const [echo, setEcho] = React.useState(true)
  const [submits, setSubmits] = React.useState(0)
  const echoRef = React.useRef(true)
  echoRef.current = echo

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <form
          data-testid="commit-lab-form"
          onSubmit={e => {
            e.preventDefault()
            setSubmits(s => s + 1)
          }}
        >
          <NumberField
            data-testid="commit-lab-field"
            value={value}
            locale="en-US"
            min={0}
            max={100}
            step={1}
            name="qty"
            onChange={v => {
              setLog(entries => [...entries, String(v)])
              setOrder(entries => [...entries, 'request'])
              if (echoRef.current) setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" data-testid="commit-lab-dec" />
              <NumberField.Input
                aria-label="Quantity"
                data-testid="commit-lab-input"
                onBlur={() => setOrder(entries => [...entries, 'blur'])}
                onKeyDown={() => setOrder(entries => [...entries, 'key'])}
              />
              <NumberField.Increment aria-label="Increment" data-testid="commit-lab-inc" />
            </NumberField.Group>
          </NumberField>
          <button type="submit" data-testid="commit-lab-submit">
            Submit
          </button>
          <button type="reset" data-testid="commit-lab-reset">
            Reset
          </button>
        </form>
        <button type="button" data-testid="commit-lab-echo-off" onClick={() => setEcho(false)}>
          Echo off
        </button>
        <button type="button" data-testid="commit-lab-echo-on" onClick={() => setEcho(true)}>
          Echo on
        </button>
        <button
          type="button"
          data-testid="commit-lab-set-99"
          onMouseDown={e => e.preventDefault()}
          onClick={() => setValue(99)}
        >
          Set 99
        </button>
        <button type="button" data-testid="commit-lab-outside">
          Outside
        </button>
        <Span fontSize="3r" color="design.text.light" data-testid="commit-lab-display">
          Value: {value !== null ? value : 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="commit-lab-log">
          log: {log.length > 0 ? log.join(',') : 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="commit-lab-order">
          order: {order.length > 0 ? order.join(',') : 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="commit-lab-submits">
          submits: {submits}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// NFLAST-2 composition lab (NF-EDIT-12): ar-EG reset fixture mirroring
// the commit lab, proving localized-digit composition finals parse.
export const CompositionFixture = () => {
  const [value, setValue] = React.useState<number | null>(5)
  const [log, setLog] = React.useState<string[]>([])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <form data-testid="composition-form">
          <NumberField
            data-testid="composition-field"
            value={value}
            locale="ar-EG"
            name="qty"
            onChange={v => {
              setLog(entries => [...entries, String(v)])
              setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" data-testid="composition-input" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
          <button type="reset" data-testid="composition-reset">
            Reset
          </button>
        </form>
        <button type="button" data-testid="composition-outside">
          Outside
        </button>
        <Span fontSize="3r" color="design.text.light" data-testid="composition-display">
          Value: {value !== null ? value : 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="composition-log">
          log: {log.length > 0 ? log.join(',') : 'none'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// Wave-2 format swap lab (NF-FORMAT-03/04, NF-DYNAMIC-02): swap controls use
// mousedown-prevented buttons so rerenders never blur the dirty Input.
export const FormatSwapFixture = () => {
  const [value, setValue] = React.useState<number | null>(1234.5)
  const [locale, setLocale] = React.useState('en-US')
  const [opts, setOpts] = React.useState<Intl.NumberFormatOptions>({ style: 'currency', currency: 'USD' })
  const [log, setLog] = React.useState<string[]>([])
  const keepFocus = (e: React.MouseEvent) => e.preventDefault()

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <NumberField
          data-testid="format-swap-field"
          value={value}
          locale={locale}
          min={0}
          step={1}
          name="price"
          formatOptions={opts}
          onChange={v => {
            setLog(entries => [...entries, String(v)])
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Price" data-testid="format-swap-input" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
        <button type="button" data-testid="format-swap-same" onMouseDown={keepFocus} onClick={() => setOpts({ ...opts })}>
          Same options
        </button>
        <button
          type="button"
          data-testid="format-swap-eur"
          onMouseDown={keepFocus}
          onClick={() => setOpts({ style: 'currency', currency: 'EUR' })}
        >
          To EUR
        </button>
        <button
          type="button"
          data-testid="format-swap-de"
          onMouseDown={keepFocus}
          onClick={() => setLocale('de-DE')}
        >
          To de-DE
        </button>
        <button
          type="button"
          data-testid="format-swap-scientific"
          onMouseDown={keepFocus}
          onClick={() => setOpts({ notation: 'scientific' })}
        >
          To scientific
        </button>
        <button
          type="button"
          data-testid="format-swap-nu-arab"
          onMouseDown={keepFocus}
          onClick={() => setOpts({ ...opts, numberingSystem: 'arab' })}
        >
          To arab digits
        </button>
        <Span fontSize="3r" color="design.text.light" data-testid="format-swap-display">
          Value: {value !== null ? value : 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="format-swap-log">
          log: {log.length > 0 ? log.join(',') : 'none'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

// PATCHES §6 (NF-DOM-09): type-bypassed unnamed steppers — absent naming
// on Decrement, an unresolving labelledby on Increment.
const unnamedDecProps = {} as unknown as NumberFieldDecrementProps

export const UnnamedStepperFixture = () => (
  <ReferenceLibrary>
    <Div p="4r" maxW="80r">
      <NumberField data-testid="unnamed-field" value={42} locale="en-US" min={0} max={100}>
        <NumberField.Group>
          <NumberField.Decrement data-testid="unnamed-dec" {...unnamedDecProps} />
          <NumberField.Input aria-label="Quantity" data-testid="unnamed-input" />
          <NumberField.Increment data-testid="unnamed-inc" aria-labelledby="unnamed-missing-target" />
        </NumberField.Group>
      </NumberField>
    </Div>
  </ReferenceLibrary>
)

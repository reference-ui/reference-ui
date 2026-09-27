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
            <NumberField.Decrement aria-label="Decrement" data-testid="btn-decrement" />
            <NumberField.Input data-testid="number-field-input" />
            <NumberField.Increment aria-label="Increment" data-testid="btn-increment" />
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
        <NumberField.Decrement aria-label="Decrement" />
        <NumberField.Input />
        <NumberField.Increment aria-label="Increment" />
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
          <NumberField.Decrement aria-label="Decrement" data-testid="decimal-btn-decrement" />
          <NumberField.Input data-testid="decimal-number-field-input" />
          <NumberField.Increment aria-label="Increment" data-testid="decimal-btn-increment" />
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
          <NumberField.Decrement aria-label="Decrement" data-testid="unbounded-btn-decrement" />
          <NumberField.Input data-testid="unbounded-number-field-input" />
          <NumberField.Increment aria-label="Increment" data-testid="unbounded-btn-increment" />
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
          <NumberField.Decrement data-testid="named-en-dec" aria-label="Decrease quantity" />
          <NumberField.Input data-testid="named-en-input" />
          <NumberField.Increment data-testid="named-en-inc" aria-labelledby="named-en-inc-label" />
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
          <NumberField.Decrement data-testid="named-de-dec" aria-label="Decrease quantity" />
          <NumberField.Input data-testid="named-de-input" />
          <NumberField.Increment data-testid="named-de-inc" aria-labelledby="named-de-inc-label" />
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
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input data-testid="bounded-decimal-input" />
            <NumberField.Increment aria-label="Increment" />
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

// PATCHES §6 (NF-DOM-09): type-bypassed unnamed steppers — absent naming
// on Decrement, an unresolving labelledby on Increment.
const unnamedDecProps = {} as unknown as NumberFieldDecrementProps

export const UnnamedStepperFixture = () => (
  <ReferenceLibrary>
    <Div p="4r" maxW="80r">
      <NumberField data-testid="unnamed-field" value={42} locale="en-US" min={0} max={100}>
        <NumberField.Decrement data-testid="unnamed-dec" {...unnamedDecProps} />
        <NumberField.Input data-testid="unnamed-input" />
        <NumberField.Increment data-testid="unnamed-inc" aria-labelledby="unnamed-missing-target" />
      </NumberField>
    </Div>
  </ReferenceLibrary>
)

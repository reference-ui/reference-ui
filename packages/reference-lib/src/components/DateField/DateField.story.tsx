import * as React from 'react'
import { createPortal } from 'react-dom'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { DateField } from './index'

export const CompoundFixture = () => {
  const [value, setValue] = React.useState<string | null>('2026-08-15')

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="date-field-fixture-root">
        <Div style={{ margin: '16px 0' }}>
          <DateField locale="en-US"
            value={value}
            onChange={setValue}
          >
            <DateField.Input data-testid="date-field-input" />
            <DateField.Trigger data-testid="date-field-trigger" />
            <DateField.Picker data-testid="date-field-picker" />
          </DateField>
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="date-field-value-display">
          Date Value: {value ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const ChildlessFixture = () => {
  const [value, setValue] = React.useState<string | null>('2026-08-15')
  const [name, setName] = React.useState<string | undefined>(undefined)
  const [disabled, setDisabled] = React.useState(false)
  const [readOnly, setReadOnly] = React.useState(false)
  const [changes, setChanges] = React.useState<Array<string | null>>([])
  const [refResult, setRefResult] = React.useState('')
  const ref = React.useRef<HTMLInputElement | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="childless-fixture-root">
        <DateField locale="en-US"
          ref={ref}
          id="bday-childless"
          value={value}
          name={name}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setValue(next)
          }}
        />
        <Span fontSize="3r" color="design.text.light" data-testid="childless-value-display">
          Childless Value: {value ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="childless-changelog-count">
          Changes: {changes.length}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="childless-changelog-last">
          Last: {changes.length ? JSON.stringify(changes[changes.length - 1]) : 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="childless-changelog-type">
          LastType: {changes.length ? typeof changes[changes.length - 1] : 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="childless-ref-result">
          {refResult}
        </Span>
        <Div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" data-testid="btn-set-childless-val-1" onClick={() => setValue('2024-04-01')}>
            Set 2024-04-01
          </button>
          <button type="button" data-testid="btn-set-childless-val-null" onClick={() => setValue(null)}>
            Set null
          </button>
          <button
            type="button"
            data-testid="btn-toggle-childless-name"
            onClick={() => setName((n) => (n ? undefined : 'birthday'))}
          >
            Toggle name
          </button>
          <button
            type="button"
            data-testid="btn-check-childless-ref"
            onClick={() => setRefResult(ref.current instanceof HTMLInputElement ? 'Ref is Input: Yes' : 'Ref is Input: No')}
          >
            Check ref
          </button>
          <button type="button" data-testid="btn-toggle-childless-disabled" onClick={() => setDisabled((d) => !d)}>
            Toggle disabled
          </button>
          <button type="button" data-testid="btn-toggle-childless-readonly" onClick={() => setReadOnly((r) => !r)}>
            Toggle readOnly
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const FoldedPickerFixture = () => {
  const [value, setValue] = React.useState<string | null>('2026-08-15')

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="folded-fixture-root">
        <DateField locale="en-US" value={value} onChange={setValue}>
          <DateField.Picker />
        </DateField>
        <Span fontSize="3r" color="design.text.light" data-testid="folded-value-display">
          Folded Value: {value ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const PartResolutionFixture = () => {
  const [value, setValue] = React.useState<string | null>('2026-08-15')
  const [inputEvents, setInputEvents] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="merge-fixture-root">
        <DateField locale="en-US"
          value={value}
          onChange={setValue}
          placeholder="Root"
          className="root-cls"
          onInput={() => setInputEvents((c) => c + 1)}
        >
          <DateField.Input
            placeholder="Explicit"
            className="child-cls"
            value="2000-01-01"
            role="spinbutton"
            data-testid="merge-input"
          />
          <DateField.Picker data-testid="merge-picker" />
        </DateField>
        <Span fontSize="3r" color="design.text.light" data-testid="merge-input-events">
          InputEvents: {inputEvents}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const RequiredFixture = () => {
  const [childlessValue, setChildlessValue] = React.useState<string | null>(null)
  const [compoundValue, setCompoundValue] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="required-fixture-root">
        <DateField locale="en-US"
          id="req-childless"
          value={childlessValue}
          onChange={setChildlessValue}
          required
          data-testid="req-childless"
        />
        <DateField locale="en-US" value={compoundValue} onChange={setCompoundValue} required>
          <DateField.Input data-testid="req-compound-input" />
          <DateField.Picker data-testid="req-compound-picker" />
        </DateField>
        <Div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" data-testid="btn-set-req-childless" onClick={() => setChildlessValue('2024-02-01')}>
            Set childless
          </button>
          <button type="button" data-testid="btn-set-req-compound" onClick={() => setCompoundValue('2024-02-01')}>
            Set compound
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const ConstrainedFixture = () => {
  const [value, setValue] = React.useState<string | null>('2026-08-15')
  const [changes, setChanges] = React.useState(0)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="constrained-fixture-root">
        <DateField
          locale="en-US"
          value={value}
          onChange={(next) => {
            setChanges((c) => c + 1)
            setValue(next)
          }}
          min="2026-08-10"
          max="2026-08-20"
          isDateUnavailable={(d) => d === '2026-08-12'}
        >
          <DateField.Input data-testid="constrained-input" />
          <DateField.Trigger data-testid="constrained-trigger" />
          <DateField.Picker data-testid="constrained-picker" />
        </DateField>
        <Span fontSize="3r" color="design.text.light" data-testid="constrained-value-display">
          Value: {value ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="constrained-changes">
          Changes: {changes}
        </Span>
        <Div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" data-testid="btn-set-constrained-early" onClick={() => setValue('2026-08-01')}>
            Set early
          </button>
          <button type="button" data-testid="btn-set-constrained-unavail" onClick={() => setValue('2026-08-12')}>
            Set unavailable
          </button>
          <button type="button" data-testid="btn-set-constrained-mid" onClick={() => setValue('2026-08-15')}>
            Set mid
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const FormFixture = () => {
  const [value, setValue] = React.useState<string | null>('2024-02-01')
  const [payload, setPayload] = React.useState('')

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="form-fixture-root">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const data = new FormData(e.currentTarget)
            setPayload(JSON.stringify({ birthday: data.get('birthday') }))
          }}
        >
          <label htmlFor="bday">Birthday Label</label>
          <DateField locale="en-US"
            id="bday"
            name="birthday"
            value={value}
            onChange={setValue}
            data-testid="form-datefield-input"
          />
          <button type="button" data-testid="btn-clear-form-value" onClick={() => setValue(null)}>
            Clear
          </button>
          <button type="submit" data-testid="form-submit-btn">
            Submit
          </button>
        </form>
        <Span fontSize="3r" color="design.text.light" data-testid="form-submitted-payload">
          Payload: {payload || 'none'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const EngineFixture = () => {
  const [value, setValue] = React.useState<string | null>('2024-02-01')
  const [locale, setLocale] = React.useState('en-GB')
  const [changes, setChanges] = React.useState<Array<string | null>>([])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="engine-fixture-root">
        <DateField
          locale={locale}
          value={value}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setValue(next)
          }}
        >
          <DateField.Input data-testid="engine-input" />
          <DateField.Trigger data-testid="engine-trigger" />
          <DateField.Picker data-testid="engine-picker" />
        </DateField>
        <Span fontSize="3r" color="design.text.light" data-testid="engine-value-display">
          Engine Value: {value ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="engine-changes">
          Changes: {changes.length}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="engine-last">
          Last: {changes.length ? JSON.stringify(changes[changes.length - 1]) : 'none'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="engine-locale">
          Locale: {locale}
        </Span>
        <Div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button type="button" data-testid="btn-engine-set-jun15" onClick={() => setValue('2024-06-15')}>
            Set 2024-06-15
          </button>
          <button type="button" data-testid="btn-engine-set-null" onClick={() => setValue(null)}>
            Set null
          </button>
          <button type="button" data-testid="btn-engine-locale-gb" onClick={() => setLocale('en-GB')}>
            en-GB
          </button>
          <button type="button" data-testid="btn-engine-locale-us" onClick={() => setLocale('en-US')}>
            en-US
          </button>
          <button type="button" data-testid="btn-engine-locale-de" onClick={() => setLocale('de-DE')}>
            de-DE
          </button>
          <button type="button" data-testid="btn-engine-locale-se" onClick={() => setLocale('sv-SE')}>
            sv-SE
          </button>
          <button type="button" data-testid="btn-engine-locale-jp" onClick={() => setLocale('ja-JP')}>
            ja-JP
          </button>
          <button type="button" data-testid="btn-engine-locale-eg" onClick={() => setLocale('ar-EG')}>
            ar-EG
          </button>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const BlurVetoFixture = () => {
  const [value, setValue] = React.useState<string | null>('2024-04-01')
  const [changes, setChanges] = React.useState<Array<string | null>>([])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="veto-fixture-root">
        <DateField
          locale="en-GB"
          value={value}
          onChange={(next) => {
            setChanges((prev) => [...prev, next])
            setValue(next)
          }}
          onBlur={(e) => e.preventDefault()}
          data-testid="veto-input"
        />
        <Span fontSize="3r" color="design.text.light" data-testid="veto-value-display">
          Veto Value: {value ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="veto-changes">
          Changes: {changes.length}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const ShadowFormFixture = () => {
  const [value, setValue] = React.useState<string | null>('2024-02-01')
  const [payload, setPayload] = React.useState('')
  const [changes, setChanges] = React.useState(0)
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const [shadowRoot, setShadowRoot] = React.useState<ShadowRoot | null>(null)

  React.useEffect(() => {
    const host = hostRef.current
    if (!host || host.shadowRoot) return
    setShadowRoot(host.attachShadow({ mode: 'open' }))
  }, [])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="shadow-form-fixture-root">
        <div ref={hostRef} data-testid="shadow-form-host" />
        {shadowRoot &&
          createPortal(
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const data = new FormData(e.currentTarget)
                setPayload(JSON.stringify({ birthday: data.get('birthday') }))
              }}
            >
              <DateField
                locale="en-US"
                name="birthday"
                value={value}
                onChange={(next) => {
                  setChanges((c) => c + 1)
                  setValue(next)
                }}
                data-testid="shadow-form-input"
              />
              <button type="submit" data-testid="shadow-form-submit">
                Submit
              </button>
            </form>,
            shadowRoot
          )}
        <Span fontSize="3r" color="design.text.light" data-testid="shadow-form-value">
          Value: {value ?? 'None'}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="shadow-form-changes">
          Changes: {changes}
        </Span>
        <Span fontSize="3r" color="design.text.light" data-testid="shadow-form-payload">
          Payload: {payload || 'none'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const ShadowPickerFixture = () => {
  const [value, setValue] = React.useState<string | null>('2026-08-15')
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const [shadowRoot, setShadowRoot] = React.useState<ShadowRoot | null>(null)

  React.useEffect(() => {
    const host = hostRef.current
    if (!host || host.shadowRoot) return
    setShadowRoot(host.attachShadow({ mode: 'open' }))
  }, [])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="shadow-picker-fixture-root">
        <div ref={hostRef} data-testid="shadow-picker-host" />
        {shadowRoot &&
          createPortal(
            <DateField locale="en-US" value={value} onChange={setValue}>
              <DateField.Picker data-testid="shadow-picker" />
            </DateField>,
            shadowRoot
          )}
        <Span fontSize="3r" color="design.text.light" data-testid="shadow-picker-value">
          Value: {value ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

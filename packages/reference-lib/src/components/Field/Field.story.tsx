import * as React from 'react'
import { Div, Button, Input, Span, Label, P, Textarea, Select, Option } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Field } from './index'
import { NumberField } from '../NumberField'
import { DateField } from '../DateField'
import { Combobox } from '../Combobox'
import { Listbox } from '../Listbox'

export const StatusAndFocusFixture = () => {
  const [warning, setWarning] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="field-fixture-root" display="flex" flexDirection="column" gap="4r">
        <Button
          type="button"
          data-testid="btn-toggle-warning"
          onClick={() => setWarning(w => !w)}
        >
          Toggle Warning
        </Button>

        <Field
          data-testid="test-field"
          status={warning ? 'warning' : undefined}
          width="100%"
        >
          <input
            data-testid="field-input"
            aria-invalid="true"
            placeholder="Enclosed input"
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'inherit' }}
          />
        </Field>

        <Field data-testid="standard-field" width="100%">
          <input
            data-testid="standard-field-input"
            placeholder="Standard input"
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'inherit' }}
          />
        </Field>
      </Div>
    </ReferenceLibrary>
  )
}

export const PrefixAndSuffix = () => (
  <ReferenceLibrary>
    <Div p="4r" maxW="80r">
      <Field width="100%" data-testid="prefix-suffix-field">
        <Span aria-hidden="true" color="design.text.light">
          £
        </Span>
        <Input id="amount" placeholder="0.00" />
        <Button type="button" aria-label="Clear amount">
          ×
        </Button>
      </Field>
    </Div>
  </ReferenceLibrary>
)

// ---------------------------------------------------------------------------
// Contract fixtures (FI-* cases re-targeted from quarantine matrix coverage)
// ---------------------------------------------------------------------------

export const ProhibitedPropsFixture = () => {
  // None of these may reach the host: the type Omit covers TS callers, the
  // runtime strip covers JS callers. data-* spoofs must not override pins.
  const prohibited = {
    role: 'group',
    'aria-invalid': 'true',
    'aria-disabled': 'true',
    'aria-readonly': 'true',
    'aria-required': 'true',
    'aria-errormessage': 'some-error',
    'data-reference-field': 'spoof',
    'data-status': 'error',
  } as unknown as Record<string, string>

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Field data-testid="prohibited-props-field" width="100%" {...prohibited}>
          <Input data-testid="prohibited-props-input" placeholder="Enclosed input" />
        </Field>
      </Div>
    </ReferenceLibrary>
  )
}

export const EmbeddedChromeFixture = () => (
  <ReferenceLibrary>
    <Div p="4r" maxW="120r" display="flex" flexDirection="column" gap="4r">
      <Div display="flex" gap="4r" alignItems="center">
        <Input data-testid="standalone-input" placeholder="Standalone input" />
        <Field data-testid="field-with-embedded-input" width="100%">
          <Input data-testid="embedded-input" placeholder="Embedded input" />
        </Field>
        <Input data-testid="sibling-input" placeholder="Sibling input" />
      </Div>
      <Div display="flex" gap="4r" alignItems="center">
        <Textarea data-testid="standalone-textarea" placeholder="Standalone textarea" />
        <Field data-testid="field-with-embedded-textarea" width="100%">
          <Textarea data-testid="embedded-textarea" placeholder="Embedded textarea" />
        </Field>
      </Div>
      <Div display="flex" gap="4r" alignItems="center">
        <Select data-testid="standalone-select" defaultValue="s">
          <Option value="s">Standalone option</Option>
        </Select>
        <Field data-testid="field-with-embedded-select" width="100%">
          <Select data-testid="embedded-select" defaultValue="e">
            <Option value="e">Embedded option</Option>
          </Select>
        </Field>
      </Div>
    </Div>
  </ReferenceLibrary>
)

export const StateChromeFixture = () => {
  const [css7Invalid, setCss7Invalid] = React.useState(false)
  const [css10Invalid, setCss10Invalid] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="120r" display="flex" flexDirection="column" gap="4r">
        <Button
          type="button"
          data-testid="btn-toggle-css7-invalid"
          onClick={() => setCss7Invalid(v => !v)}
        >
          Toggle CSS7 Invalid
        </Button>
        <Field data-testid="field-css7" width="100%">
          <Input
            data-testid="input-css7"
            aria-invalid={css7Invalid ? 'true' : undefined}
            placeholder="CSS7 input"
          />
        </Field>

        <Field data-testid="field-disabled-control" width="100%">
          <Input data-testid="input-disabled-control" disabled placeholder="Disabled input" />
          <Button type="button" data-testid="btn-active-in-disabled" aria-label="Clear">
            ×
          </Button>
        </Field>

        <Field data-testid="field-disabled-button" width="100%">
          <Input data-testid="input-active-with-disabled-btn" placeholder="Active input" />
          <Button type="button" data-testid="btn-disabled-action" disabled aria-label="Clear">
            ×
          </Button>
        </Field>

        <Field data-testid="field-readonly-control" width="100%">
          <Input
            data-testid="input-readonly-control"
            readOnly
            defaultValue="Read only content"
          />
        </Field>
        <Field data-testid="field-readonly-button" width="100%">
          <Input data-testid="input-normal-with-readonly-btn" defaultValue="Normal input" />
          <Button type="button" data-testid="btn-readonly-attr" aria-readonly="true">
            Readonly button
          </Button>
        </Field>

        <Button
          type="button"
          data-testid="btn-toggle-css10-invalid"
          onClick={() => setCss10Invalid(v => !v)}
        >
          Toggle CSS10 Invalid
        </Button>
        <Field data-testid="field-warning-stack" status="warning" width="100%">
          <Input
            data-testid="input-warning-stack"
            aria-invalid={css10Invalid ? 'true' : undefined}
            placeholder="Warning stack input"
          />
        </Field>
      </Div>
    </ReferenceLibrary>
  )
}

export const AmountFixture = () => (
  <ReferenceLibrary>
    <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="2r">
      <Label htmlFor="amount-input" data-testid="amount-label">
        Amount
      </Label>
      <Field data-testid="amount-field" width="100%">
        <Span data-testid="amount-prefix" aria-hidden="true" color="design.text.light">
          £
        </Span>
        <Input
          id="amount-input"
          data-testid="amount-input"
          placeholder="0.00"
          aria-invalid="true"
          aria-describedby="amount-error"
        />
        <Button type="button" data-testid="amount-clear-btn" aria-label="Clear amount">
          ×
        </Button>
      </Field>
      <P id="amount-error" data-testid="amount-error-msg" fontSize="3r" color="colors.red.500" m="0">
        Enter an amount.
      </P>
    </Div>
  </ReferenceLibrary>
)

export const CompoundEmbedFixture = () => (
  <ReferenceLibrary>
    <Div p="4r" maxW="120r" display="flex" flexDirection="column" gap="4r">
      <Field data-testid="field-host-datefield" width="100%">
        <DateField data-testid="compound-datefield" value="2026-09-10" locale="en-US" onChange={() => {}} />
      </Field>

      <Combobox value="" onChange={() => {}}>
        <Field data-testid="field-host-combobox" width="100%">
          <Combobox.Input data-testid="compound-combobox-input" placeholder="Combobox input" />
        </Field>
      </Combobox>

      <NumberField data-testid="host-numberfield-group" value={10} locale="en-US" onChange={() => {}}>
        <NumberField.Decrement aria-label="Decrement" data-testid="compound-number-dec" />
        <NumberField.Input data-testid="compound-number-input" />
        <NumberField.Increment aria-label="Increment" data-testid="compound-number-inc" />
      </NumberField>

      <NumberField data-testid="comp-numberfield-group" value={42} locale="en-US" onChange={() => {}}>
        <NumberField.Decrement aria-label="Decrement" data-testid="comp-number-dec" />
        <NumberField.Input data-testid="comp-number-input" />
        <NumberField.Increment aria-label="Increment" data-testid="comp-number-inc" />
      </NumberField>

      <Field data-testid="comp-double-bezel-wrapper" width="100%">
        <NumberField data-testid="comp-double-bezel-inner" value={10} locale="en-US" onChange={() => {}}>
          <NumberField.Input />
        </NumberField>
      </Field>
    </Div>
  </ReferenceLibrary>
)

export const SurfaceRecipeFixture = () => {
  const [surfState, setSurfState] = React.useState<
    'default' | 'focus-visible' | 'invalid' | 'warning' | 'disabled' | 'readonly'
  >('default')

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="120r" display="flex" flexDirection="column" gap="3r">
        <Div display="flex" gap="2r" flexWrap="wrap">
          {(['default', 'focus-visible', 'invalid', 'warning', 'disabled', 'readonly'] as const).map(
            s => (
              <Button
                key={s}
                type="button"
                data-testid={`btn-surf-${s}`}
                onClick={() => setSurfState(s)}
              >
                Set {s}
              </Button>
            )
          )}
        </Div>

        <Field
          data-testid="surf-fixture-1"
          width="100%"
          status={surfState === 'warning' ? 'warning' : undefined}
        >
          <Span aria-hidden="true">£</Span>
          <Input
            data-testid="surf-1-input"
            placeholder="0.00"
            aria-invalid={surfState === 'invalid' ? 'true' : undefined}
            disabled={surfState === 'disabled'}
            readOnly={surfState === 'readonly'}
          />
          <Button type="button" aria-label="Clear">
            ×
          </Button>
        </Field>

        <Field
          data-testid="surf-fixture-2"
          width="100%"
          status={surfState === 'warning' ? 'warning' : undefined}
        >
          <DateField
            data-testid="surf-2-datefield"
            value="2026-09-10"
            locale="en-US"
            onChange={() => {}}
            aria-invalid={surfState === 'invalid' ? 'true' : undefined}
            disabled={surfState === 'disabled'}
            readOnly={surfState === 'readonly'}
          />
          <Button type="button" aria-label="Calendar">
            📅
          </Button>
        </Field>

        <Combobox value="" onChange={() => {}}>
          <Field
            data-testid="surf-fixture-3"
            width="100%"
            status={surfState === 'warning' ? 'warning' : undefined}
          >
            <Combobox.Input
              data-testid="surf-3-combobox-input"
              placeholder="Pick person"
              aria-invalid={surfState === 'invalid' ? 'true' : undefined}
              disabled={surfState === 'disabled'}
              readOnly={surfState === 'readonly'}
            />
            <Button type="button" aria-label="Open suggestions">
              ▼
            </Button>
          </Field>
        </Combobox>

        <NumberField
          data-testid="surf-fixture-4"
          value={5}
          locale="en-US"
          onChange={() => {}}
          disabled={surfState === 'disabled'}
          data-invalid={surfState === 'invalid' ? '' : undefined}
          data-status={surfState === 'warning' ? 'warning' : undefined}
        >
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input
            aria-invalid={surfState === 'invalid' ? 'true' : undefined}
            readOnly={surfState === 'readonly'}
          />
          <NumberField.Increment aria-label="Increment" />
        </NumberField>
      </Div>
    </ReferenceLibrary>
  )
}

export const DateCompoundFixture = () => {
  const [dateVal, setDateVal] = React.useState<string | null>('2026-09-10')

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" display="flex" flexDirection="column" gap="2r">
        <Div data-testid="comp-datefield-wrapper">
          <DateField value={dateVal} onChange={setDateVal} locale="en-US">
            <DateField.Input data-testid="comp-datefield-input" placeholder="YYYY-MM-DD" />
            <DateField.Trigger data-testid="comp-datefield-trigger" aria-label="Open calendar">
              📅
            </DateField.Trigger>
            <DateField.Picker data-testid="comp-datefield-picker" />
          </DateField>
        </Div>
        <Span data-testid="comp-datefield-val">Value: {dateVal ?? 'null'}</Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const TokenPickerFixture = () => {
  const [cbValue, setCbValue] = React.useState<string | null>(null)
  const [cbInputVal, setCbInputVal] = React.useState('')
  const [selectedPeople, setSelectedPeople] = React.useState([{ id: '1', name: 'Alice' }])
  const [cbInvalid, setCbInvalid] = React.useState(false)

  const handleCommitPerson = (personName: string | null) => {
    if (!personName) return
    if (!selectedPeople.some(p => p.name === personName)) {
      setSelectedPeople(prev => [...prev, { id: `${Date.now()}`, name: personName }])
    }
    setCbValue(null)
    setCbInputVal('')
  }

  const handleRemovePerson = (id: string) => {
    setSelectedPeople(prev => prev.filter(p => p.id !== id))
  }

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="120r" display="flex" flexDirection="column" gap="2r">
        <Label htmlFor="people" data-testid="comp-people-label">
          People
        </Label>
        <Button type="button" data-testid="btn-toggle-cb-invalid" onClick={() => setCbInvalid(v => !v)}>
          Toggle Combobox Invalid
        </Button>

        <Combobox
          value={cbValue}
          onChange={handleCommitPerson}
          inputValue={cbInputVal}
          onInputValueChange={setCbInputVal}
        >
          <Field data-testid="comp-people-field" width="100%">
            <Combobox.Input
              id="people"
              data-testid="comp-people-input"
              aria-invalid={cbInvalid ? 'true' : undefined}
            />
            <Button
              type="button"
              data-testid="comp-people-opener"
              aria-label="Open suggestions"
              onClick={() => {
                const el = document.getElementById('people') as HTMLInputElement | null
                if (el) {
                  el.focus()
                  el.click()
                }
              }}
            >
              ▼
            </Button>
            <Div data-testid="comp-people-chips" display="inline-flex" gap="1r">
              {selectedPeople.map(p => (
                <Button
                  key={p.id}
                  type="button"
                  data-testid={`chip-${p.name}`}
                  aria-label={`Remove ${p.name}`}
                  onClick={() => handleRemovePerson(p.id)}
                >
                  {p.name} <Span aria-hidden="true">×</Span>
                </Button>
              ))}
            </Div>
          </Field>

          <Combobox.Popover data-testid="comp-people-popover">
            <Listbox>
              <Listbox.Option value="Bob" data-testid="option-bob">
                Bob
              </Listbox.Option>
              <Listbox.Option value="Charlie" data-testid="option-charlie">
                Charlie
              </Listbox.Option>
            </Listbox>
          </Combobox.Popover>
        </Combobox>
      </Div>
    </ReferenceLibrary>
  )
}

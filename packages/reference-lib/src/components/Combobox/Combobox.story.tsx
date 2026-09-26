import * as React from 'react'
import { Div, Span, Button } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Combobox } from './index'
import { Listbox } from '../Listbox'
import { Field } from '../Field'
import { Overlay } from '../Overlay'

export const FruitSelect = () => {
  const [value, setValue] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="combobox-fixture-root">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox value={value} onChange={setValue}>
            <Combobox.Input
              data-testid="combobox-input"
              placeholder="Select a fruit..."
            />
            <Combobox.Popover data-testid="combobox-popover">
              <Listbox>
                <Listbox.Option value="apple" data-testid="combo-opt-apple">
                  Apple
                </Listbox.Option>
                <Listbox.Option value="banana" data-testid="combo-opt-banana">
                  Banana
                </Listbox.Option>
                <Listbox.Option value="cherry" data-testid="combo-opt-cherry">
                  Cherry
                </Listbox.Option>
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="combobox-value-display">
          Selected: {value ?? 'None'}
        </Span>
      </Div>
    </ReferenceLibrary>
  )
}

const logOptions = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'bravo', label: 'Bravo' },
  { value: 'charlie', label: 'Charlie' },
  { value: 'delta', label: 'Delta', disabled: true },
]

function LogCombobox({
  initialValue = null,
  initialInput = '',
}: {
  initialValue?: string | null
  initialInput?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(initialValue)
  const [inputValue, setInputValue] = React.useState(initialInput)
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="log-root">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox
            open={open}
            onOpen={() => {
              push('open')
              setOpen(true)
            }}
            onDismiss={() => {
              push('dismiss')
              setOpen(false)
            }}
            value={value}
            onChange={v => {
              push(`change:${v}`)
              setValue(v)
              setInputValue(logOptions.find(o => o.value === v)?.label ?? '')
            }}
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
          >
            <Field>
              <Combobox.Input data-testid="log-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="log-popover">
              <Listbox>
                {logOptions.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    data-testid={`log-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>

        <Span fontSize="3r" color="design.text.light" data-testid="log-value-display">
          Selected: {value ?? 'None'}
        </Span>
        <Div data-testid="log-counts">{JSON.stringify(log)}</Div>
        <Button data-testid="log-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

export const ControlledLog = () => <LogCombobox />

export const SelectedLog = () => <LogCombobox initialValue="bravo" initialInput="Bravo" />

export const SelectOnlyStory = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>('bravo')
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])
  const label = logOptions.find(o => o.value === value)?.label ?? 'Choose'

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox
            open={open}
            onOpen={() => {
              push('open')
              setOpen(true)
            }}
            onDismiss={() => {
              push('dismiss')
              setOpen(false)
            }}
            value={value}
            onChange={v => {
              push(`change:${v}`)
              setValue(v)
            }}
          >
            <Combobox.Trigger data-testid="select-trigger">{label}</Combobox.Trigger>
            <Combobox.Popover data-testid="select-popover">
              <Listbox>
                {logOptions.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    data-testid={`select-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Div data-testid="select-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const DynamicOptions = () => {
  const [options, setOptions] = React.useState(logOptions.slice(0, 3))
  const [value, setValue] = React.useState<string | null>('alpha')

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Button
          data-testid="dyn-remove-bravo"
          onClick={() => setOptions(o => o.filter(x => x.value !== 'bravo'))}
        >
          Remove bravo
        </Button>
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox value={value} onChange={setValue}>
            <Field>
              <Combobox.Input data-testid="dyn-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="dyn-popover">
              <Listbox>
                {options.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    data-testid={`dyn-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

const longOptions = Array.from({ length: 30 }, (_, i) => ({
  value: `opt-${String(i).padStart(2, '0')}`,
  label: `Option ${i}`,
  disabled: i === 5 || i === 17,
}))

export const LongList = () => {
  const [value, setValue] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox value={value} onChange={setValue}>
            <Field>
              <Combobox.Input data-testid="long-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="long-popover">
              <Listbox style={{ maxHeight: 200, overflowY: 'auto' }}>
                {longOptions.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    data-testid={`long-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const TabOrder = () => {
  const [value, setValue] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Button data-testid="tab-before">Before</Button>
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox value={value} onChange={setValue}>
            <Field>
              <Combobox.Input data-testid="tab-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="tab-popover">
              <Listbox>
                <Listbox.Option value="apple" data-testid="tab-opt-apple">
                  Apple
                </Listbox.Option>
                <Listbox.Option value="banana" data-testid="tab-opt-banana">
                  Banana
                </Listbox.Option>
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Button data-testid="tab-after">After</Button>
        <Span data-testid="tab-value-display">Selected: {value ?? 'None'}</Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const NestedOverlay = () => {
  const [parentOpen, setParentOpen] = React.useState(true)
  const [value, setValue] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="nested-root">
        <Overlay open={parentOpen} onDismiss={() => setParentOpen(false)} isolation={false}>
          <Overlay.Trigger data-testid="parent-trigger">
            <Span>Parent trigger</Span>
          </Overlay.Trigger>
          <Overlay.Content data-testid="parent-content">
            <Div p="4r">
              <Combobox value={value} onChange={setValue}>
                <Field>
                  <Combobox.Input data-testid="nested-input" placeholder="Pick..." />
                </Field>
                <Combobox.Popover data-testid="nested-popover">
                  <Listbox>
                    <Listbox.Option value="alpha" data-testid="nested-opt-alpha">
                      Alpha
                    </Listbox.Option>
                    <Listbox.Option value="bravo" data-testid="nested-opt-bravo">
                      Bravo
                    </Listbox.Option>
                  </Listbox>
                </Combobox.Popover>
              </Combobox>
            </Div>
          </Overlay.Content>
        </Overlay>
        <Span data-testid="parent-state">{parentOpen ? 'parent-open' : 'parent-closed'}</Span>
        <Span data-testid="nested-value-display">Selected: {value ?? 'None'}</Span>
      </Div>
    </ReferenceLibrary>
  )
}

export const ScrollPage = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox
            open={open}
            onOpen={() => {
              push('open')
              setOpen(true)
            }}
            onDismiss={() => {
              push('dismiss')
              setOpen(false)
            }}
            value={value}
            onChange={setValue}
          >
            <Field>
              <Combobox.Input data-testid="scroll-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="scroll-popover">
              <Listbox>
                <Listbox.Option value="alpha" data-testid="scroll-opt-alpha">
                  Alpha
                </Listbox.Option>
                <Listbox.Option value="bravo" data-testid="scroll-opt-bravo">
                  Bravo
                </Listbox.Option>
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Div data-testid="scroll-log">{JSON.stringify(log)}</Div>
        <Div style={{ height: '200vh' }} data-testid="scroll-spacer" />
      </Div>
    </ReferenceLibrary>
  )
}

const peopleOptions = [
  { value: 'ada', label: 'Ada' },
  { value: 'grace', label: 'Grace' },
  { value: 'hedy', label: 'Hedy' },
]

export const TokenPicker = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [chips, setChips] = React.useState<string[]>([])
  const [changeCount, setChangeCount] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Combobox
          open={open}
          onOpen={() => setOpen(true)}
          onDismiss={() => setOpen(false)}
          value={value}
          onChange={v => {
            setValue(v)
            setChangeCount(c => c + 1)
            if (v) setChips(prev => (prev.includes(v) ? prev : [...prev, v]))
            setInputValue('')
            setOpen(false)
          }}
          inputValue={inputValue}
          onInputValueChange={setInputValue}
        >
          <Field data-testid="token-field">
            <label htmlFor="people">People</label>
            <Combobox.Input
              id="people"
              ref={inputRef}
              data-testid="token-input"
              placeholder="Add people..."
            />
            <Button
              data-testid="token-opener"
              type="button"
              onClick={() => {
                inputRef.current?.focus()
                setOpen(true)
              }}
            >
              Browse
            </Button>
            {chips.map(chip => {
              const person = peopleOptions.find(p => p.value === chip)
              return (
                <Button
                  key={chip}
                  data-testid={`chip-${chip}`}
                  type="button"
                  onClick={() => setChips(prev => prev.filter(c => c !== chip))}
                >
                  {person?.label ?? chip}
                </Button>
              )
            })}
          </Field>
          <Combobox.Popover data-testid="token-popover">
            <Listbox>
              {peopleOptions.map(p => (
                <Listbox.Option key={p.value} value={p.value} data-testid={`token-opt-${p.value}`}>
                  {p.label}
                </Listbox.Option>
              ))}
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Div data-testid="token-change-count">{changeCount}</Div>
        <Div data-testid="token-value">{value ?? 'none'}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const DisabledReadonly = () => {
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Combobox open={false} onOpen={() => push('readonly-open')} onDismiss={() => {}}>
          <Field>
            <Combobox.Input data-testid="dr-readonly" readOnly placeholder="Read-only" />
          </Field>
          <Combobox.Popover>
            <Listbox>
              <Listbox.Option value="a">A</Listbox.Option>
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Combobox open={false} onOpen={() => push('disabled-open')} onDismiss={() => {}}>
          <Field>
            <Combobox.Input data-testid="dr-disabled" disabled placeholder="Disabled" />
          </Field>
          <Combobox.Popover>
            <Listbox>
              <Listbox.Option value="a">A</Listbox.Option>
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Combobox open={false} onOpen={() => push('trigger-open')} onDismiss={() => {}}>
          <Combobox.Trigger data-testid="dr-trigger" disabled>
            Choose
          </Combobox.Trigger>
          <Combobox.Popover>
            <Listbox>
              <Listbox.Option value="a">A</Listbox.Option>
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Div data-testid="dr-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const FixedClosed = () => {
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox
            open={false}
            onOpen={() => push('open')}
            onDismiss={() => push('dismiss')}
            defaultInputValue="Hello"
          >
            <Field>
              <Combobox.Input data-testid="fixed-input" />
            </Field>
            <Combobox.Popover data-testid="fixed-popover">
              <Listbox>
                <Listbox.Option value="alpha" data-testid="fixed-opt-alpha">
                  Alpha
                </Listbox.Option>
                <Listbox.Option value="bravo" data-testid="fixed-opt-bravo">
                  Bravo
                </Listbox.Option>
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Div data-testid="fixed-log">{JSON.stringify(log)}</Div>
        <Button data-testid="fixed-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

export const CaretField = () => {
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox
            value={value}
            onChange={v => {
              push(`change:${v}`)
              setValue(v)
            }}
            defaultInputValue="Hello World"
            onInputValueChange={v => push(`input:${v}`)}
          >
            <Field>
              <Combobox.Input data-testid="caret-input" />
            </Field>
            <Combobox.Popover data-testid="caret-popover">
              <Listbox>
                <Listbox.Option value="alpha" data-testid="caret-opt-alpha">
                  Alpha
                </Listbox.Option>
                <Listbox.Option value="bravo" data-testid="caret-opt-bravo">
                  Bravo
                </Listbox.Option>
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Div data-testid="caret-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

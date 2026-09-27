import * as React from 'react'
import { createPortal } from 'react-dom'
import { Div, Span, Button, Input } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Combobox } from './index'
import type { ComboboxAutocomplete, ComboboxGridAdapter, VirtualFocusItem } from './index'
import { Listbox } from '../Listbox'
import { Field } from '../Field'
import { Overlay } from '../Overlay'
import { useOverlayStore } from '../Overlay/stack'
import { Tree, TreeItem } from '../Tree'

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
  autocomplete,
  filter = false,
  allowCustomValue = false,
}: {
  initialValue?: string | null
  initialInput?: string
  autocomplete?: ComboboxAutocomplete
  filter?: boolean
  allowCustomValue?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(initialValue)
  const [inputValue, setInputValue] = React.useState(initialInput)
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])
  const options = filter
    ? logOptions.filter(opt => opt.label.toLowerCase().includes(inputValue.toLowerCase()))
    : logOptions

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
              // Custom values round-trip as their own display text (W-24).
              setInputValue(logOptions.find(o => o.value === v)?.label ?? v ?? '')
            }}
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
            autocomplete={autocomplete}
            allowCustomValue={allowCustomValue}
          >
            <Field>
              <Combobox.Input data-testid="log-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="log-popover">
              <Listbox>
                {options.map(opt => (
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

export const InlineLog = () => <LogCombobox autocomplete="inline" />

export const CustomLog = () => (
  <LogCombobox initialValue="bravo" initialInput="Bravo" filter allowCustomValue />
)

export const NoCustomLog = () => (
  <LogCombobox initialValue="bravo" initialInput="Bravo" filter />
)

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

export const SelectOnlyTabOrder = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>('alpha')
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r">
        <Button data-testid="sel-tab-before">Before</Button>
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
            onInputValueChange={v => push(`input:${v}`)}
          >
            <Combobox.Trigger data-testid="sel-tab-trigger">Choose</Combobox.Trigger>
            <Combobox.Popover data-testid="sel-tab-popover">
              <Listbox>
                {logOptions.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    data-testid={`sel-tab-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Button data-testid="sel-tab-after">After</Button>
        <Div data-testid="sel-tab-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const BlurPersist = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>('alpha')
  const [inputValue, setInputValue] = React.useState('Alpha')
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
            onChange={v => {
              push(`change:${v}`)
              setValue(v)
            }}
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
            closeOnBlur={false}
          >
            <Field>
              <Combobox.Input data-testid="blur-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="blur-popover">
              <Listbox>
                {logOptions.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    data-testid={`blur-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Button data-testid="blur-outside">Outside</Button>
        <Div data-testid="blur-log">{JSON.stringify(log)}</Div>
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
        <Combobox value={null} onChange={() => {}} open={false} onOpen={() => push('readonly-open')} onDismiss={() => {}}>
          <Field>
            <Combobox.Input data-testid="dr-readonly" readOnly placeholder="Read-only" />
          </Field>
          <Combobox.Popover>
            <Listbox>
              <Listbox.Option value="a">A</Listbox.Option>
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Combobox value={null} onChange={() => {}} open={false} onOpen={() => push('disabled-open')} onDismiss={() => {}}>
          <Field>
            <Combobox.Input data-testid="dr-disabled" disabled placeholder="Disabled" />
          </Field>
          <Combobox.Popover>
            <Listbox>
              <Listbox.Option value="a">A</Listbox.Option>
            </Listbox>
          </Combobox.Popover>
        </Combobox>
        <Combobox value={null} onChange={() => {}} open={false} onOpen={() => push('trigger-open')} onDismiss={() => {}}>
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
            value={null}
            onChange={() => {}}
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

function LayerCount({ testid }: { testid: string }) {
  const openLayers = useOverlayStore(state => state.layers.filter(l => l.open).length)
  return <Div data-testid={testid}>{openLayers}</Div>
}

export const LayerAudit = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="layer-root">
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
              <Combobox.Input data-testid="layer-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="layer-popover">
              <Listbox>
                {logOptions.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    data-testid={`layer-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <LayerCount testid="layer-count" />
        <Div data-testid="layer-log">{JSON.stringify(log)}</Div>
        <Button data-testid="layer-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

const shadowOptions = Array.from({ length: 15 }, (_, i) => ({
  value: `opt-${String(i).padStart(2, '0')}`,
  label: `Option ${i}`,
}))

function ShadowLogInner() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <div style={{ width: 240, margin: '16px 0' }}>
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
          setInputValue(shadowOptions.find(o => o.value === v)?.label ?? '')
        }}
        inputValue={inputValue}
        onInputValueChange={v => {
          push(`input:${v}`)
          setInputValue(v)
        }}
      >
        <Field>
          <Combobox.Input data-testid="sh-input" placeholder="Search..." />
        </Field>
        {/* Inline padding: theme classes do not pierce shadow, so the
            chrome-click target needs layout that survives unstyled. */}
        <Combobox.Popover data-testid="sh-popover" style={{ padding: 8 }}>
          <Listbox style={{ maxHeight: 200, overflowY: 'auto' }}>
            {shadowOptions.map(opt => (
              <Listbox.Option
                key={opt.value}
                value={opt.value}
                data-testid={`sh-opt-${opt.value}`}
              >
                {opt.label}
              </Listbox.Option>
            ))}
          </Listbox>
        </Combobox.Popover>
      </Combobox>
      <div data-testid="sh-log">{JSON.stringify(log)}</div>
      <button data-testid="sh-clear" type="button" onClick={() => setLog([])}>
        Clear log
      </button>
    </div>
  )
}

export const ShadowLog = () => {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const [shadow, setShadow] = React.useState<ShadowRoot | null>(null)

  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (host.shadowRoot) {
      setShadow(host.shadowRoot)
      return
    }
    setShadow(host.attachShadow({ mode: 'open' }))
  }, [])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="sh-root">
        <div ref={hostRef} data-testid="sh-host" />
        {shadow ? createPortal(<ShadowLogInner />, shadow) : null}
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

// ---- Cluster B fixtures ----

export const BothLog = () => <LogCombobox autocomplete="both" />

export const NoneLog = () => <LogCombobox autocomplete="none" />

export const ModeSwitchLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [mode, setMode] = React.useState<ComboboxAutocomplete>('both')
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="mode-root">
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
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
            autocomplete={mode}
          >
            <Field>
              <Combobox.Input data-testid="mode-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="mode-popover">
              <Listbox>
                {logOptions.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    data-testid={`mode-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Button data-testid="mode-set-none" onClick={() => setMode('none')}>
          none
        </Button>
        <Button data-testid="mode-set-inline" onClick={() => setMode('inline')}>
          inline
        </Button>
        <Button data-testid="mode-set-list" onClick={() => setMode('list')}>
          list
        </Button>
        <Button data-testid="mode-set-both" onClick={() => setMode('both')}>
          both
        </Button>
        <Div data-testid="mode-log">{JSON.stringify(log)}</Div>
        <Button data-testid="mode-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

export const EscapeLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>('alpha')
  const [inputValue, setInputValue] = React.useState('Alpha')
  const [prevent, setPrevent] = React.useState(false)
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="esc-root">
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
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
            onEscape={e => {
              push(`escape:${e.key}`)
              if (prevent) e.preventDefault()
            }}
          >
            <Field>
              <Combobox.Input data-testid="esc-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="esc-popover">
              <Listbox>
                {logOptions.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    data-testid={`esc-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Button data-testid="esc-toggle" onClick={() => setPrevent(p => !p)}>
          {prevent ? 'preventing' : 'passing'}
        </Button>
        <Div data-testid="esc-log">{JSON.stringify(log)}</Div>
        <Button data-testid="esc-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

// ---- Grid fixtures (#5) ----

const GRID_COLS = 10

const gridItems100: VirtualFocusItem[] = Array.from({ length: 100 }, (_, i) => ({
  value: `cell-${String(i).padStart(2, '0')}`,
  textValue: `Cell ${i}`,
  disabled: i === 5,
}))

function firstEnabled(items: readonly VirtualFocusItem[]): number | null {
  const at = items.findIndex(item => !item.disabled)
  return at === -1 ? null : at
}

function lastEnabled(items: readonly VirtualFocusItem[]): number | null {
  for (let at = items.length - 1; at >= 0; at--) {
    if (!items[at]?.disabled) return at
  }
  return null
}

/** Deterministic 10-column topology: clamped edges, row-local Left/Right, RTL-aware. */
function gridNextIndex(
  items: readonly VirtualFocusItem[],
  request: { key: string; currentIndex: number | null; direction: 'ltr' | 'rtl' }
): number | null {
  const { key, currentIndex: at, direction } = request
  if (key === 'Home') return firstEnabled(items)
  if (key === 'End') return lastEnabled(items)
  if (at == null) {
    if (key === 'ArrowUp' || key === 'PageUp') return lastEnabled(items)
    return firstEnabled(items)
  }
  const ltr = direction === 'ltr'
  const leftward = ltr ? key === 'ArrowLeft' : key === 'ArrowRight'
  const rightward = ltr ? key === 'ArrowRight' : key === 'ArrowLeft'
  if (leftward || rightward) {
    let next = leftward ? at - 1 : at + 1
    const row = Math.floor(at / GRID_COLS)
    while (
      next >= 0 &&
      next < items.length &&
      Math.floor(next / GRID_COLS) === row &&
      items[next]?.disabled
    ) {
      next += leftward ? -1 : 1
    }
    if (next < 0 || next >= items.length || Math.floor(next / GRID_COLS) !== row) return null
    return next
  }
  const delta =
    key === 'ArrowDown' ? GRID_COLS : key === 'ArrowUp' ? -GRID_COLS : key === 'PageDown' ? 20 : -20
  if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'PageDown' && key !== 'PageUp') return null
  let next = at + delta
  while (next >= 0 && next < items.length && items[next]?.disabled) next += Math.sign(delta)
  if (next < 0 || next >= items.length) return null
  return next
}

function GridLogInner({ prefix, selectOnly }: { prefix: string; selectOnly?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [log, setLog] = React.useState<string[]>([])
  const [windowEnd, setWindowEnd] = React.useState(20)
  const push = (entry: string) => setLog(prev => [...prev, entry])

  // Monotone windowed virtualizer: scrollToIndex grows the mounted
  // prefix to include the target (the mount-timing contract).
  const adapter = React.useMemo<ComboboxGridAdapter>(
    () => ({
      role: 'grid',
      items: gridItems100,
      getNextIndex: request => gridNextIndex(gridItems100, request),
      scrollToIndex: (index: number) => {
        push(`scroll:${index}`)
        setWindowEnd(prev => Math.max(prev, index + 1))
      },
    }),
    []
  )

  const rows: { index: number; item: VirtualFocusItem }[][] = []
  for (let start = 0; start < windowEnd; start += GRID_COLS) {
    const cells: { index: number; item: VirtualFocusItem }[] = []
    for (let index = start; index < Math.min(start + GRID_COLS, windowEnd); index++) {
      const item = gridItems100[index]
      if (item) cells.push({ index, item })
    }
    rows.push(cells)
  }
  const label = gridItems100.find(item => item.value === value)?.textValue ?? 'Choose'

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid={`${prefix}-root`}>
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
              setInputValue(gridItems100.find(o => o.value === v)?.textValue ?? '')
            }}
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
          >
            {selectOnly ? (
              <Combobox.Trigger data-testid={`${prefix}-trigger`}>{label}</Combobox.Trigger>
            ) : (
              <Field>
                <Combobox.Input data-testid={`${prefix}-input`} placeholder="Search..." />
              </Field>
            )}
            <Combobox.Popover
              virtualFocus={adapter}
              aria-label="Results"
              data-testid={`${prefix}-popover`}
            >
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {rows.map((cells, row) => (
                  <div role="row" key={row}>
                    {cells.map(({ index, item }) => (
                      <Combobox.VirtualItem key={item.value} index={index}>
                        <div role="gridcell" data-testid={`${prefix}-cell-${item.value}`}>
                          {item.textValue}
                        </div>
                      </Combobox.VirtualItem>
                    ))}
                  </div>
                ))}
              </div>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Div data-testid={`${prefix}-log`}>{JSON.stringify(log)}</Div>
        <Button data-testid={`${prefix}-clear`} onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

export const GridLog = () => <GridLogInner prefix="grid" />

export const GridSelectOnly = () => <GridLogInner prefix="gs" selectOnly />

/** Slotted-cell transparency probe (ADAPTER-04/06): child handlers, props, refs merge. */
export const SlottedCellLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])
  const soloRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) push('ref-solo')
    },
    []
  )

  const adapter = React.useMemo<ComboboxGridAdapter>(
    () => ({
      role: 'grid',
      items: [
        { value: 'solo', textValue: 'Solo' },
        { value: 'duo', textValue: 'Duo' },
      ],
      getNextIndex: ({ key, currentIndex }) => {
        if (key === 'ArrowDown' || key === 'ArrowRight') return currentIndex == null ? 0 : 1
        if (key === 'ArrowUp' || key === 'ArrowLeft') return currentIndex == null ? 1 : 0
        if (key === 'Home') return 0
        if (key === 'End') return 1
        return null
      },
      scrollToIndex: (index: number) => push(`scroll:${index}`),
    }),
    []
  )

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="slot-root">
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
            inputValue=""
            onInputValueChange={() => {}}
          >
            <Field>
              <Combobox.Input data-testid="slot-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover virtualFocus={adapter} aria-label="Results" data-testid="slot-popover">
              <div role="row">
                <Combobox.VirtualItem index={0} className="virt-extra" style={{ opacity: 0.5 }}>
                  <div
                    role="gridcell"
                    data-testid="slot-cell-solo"
                    className="cell-base"
                    style={{ color: 'rgb(1, 2, 3)' }}
                    ref={soloRef}
                    onPointerMove={() => push('cell-move')}
                    onClick={() => push('cell-click')}
                  >
                    Solo
                  </div>
                </Combobox.VirtualItem>
                <Combobox.VirtualItem index={1}>
                  <div role="gridcell" data-testid="slot-cell-duo">
                    Duo
                  </div>
                </Combobox.VirtualItem>
              </div>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Div data-testid="slot-log">{JSON.stringify(log)}</Div>
        <Button data-testid="slot-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

// ---- Authority / diagnostic fixtures ----

export const ConflictLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const [single, setSingle] = React.useState(false)
  const push = (entry: string) => setLog(prev => [...prev, entry])
  const adapterItems = React.useMemo(() => gridItems100.slice(0, 4), [])
  const adapter = React.useMemo<ComboboxGridAdapter>(
    () => ({
      role: 'grid',
      items: adapterItems,
      getNextIndex: () => 0,
      scrollToIndex: (index: number) => push(`scroll:${index}`),
    }),
    [adapterItems]
  )

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="cf-root">
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
            <Field>
              <Combobox.Input data-testid="cf-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover virtualFocus={adapter} data-testid="cf-popover">
              {single ? (
                <div role="row">
                  {adapterItems.map((item, index) => (
                    <Combobox.VirtualItem key={item.value} index={index}>
                      <div role="gridcell" data-testid={`cf-cell-${item.value}`}>
                        {item.textValue}
                      </div>
                    </Combobox.VirtualItem>
                  ))}
                </div>
              ) : (
                <Listbox>
                  <Listbox.Option value="alpha" data-testid="cf-opt-alpha">
                    Alpha
                  </Listbox.Option>
                  <Listbox.Option value="bravo" data-testid="cf-opt-bravo">
                    Bravo
                  </Listbox.Option>
                </Listbox>
              )}
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Button data-testid="cf-toggle" onClick={() => setSingle(s => !s)}>
          {single ? 'conflicted' : 'single'}
        </Button>
        <Div data-testid="cf-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const MultipleLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="ml-root">
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
              push(`change:${JSON.stringify(v)}`)
              setValue(v)
            }}
          >
            <Field>
              <Combobox.Input data-testid="ml-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="ml-popover">
              <Listbox selection="multiple">
                <Listbox.Option value="alpha" data-testid="ml-opt-alpha">
                  Alpha
                </Listbox.Option>
                <Listbox.Option value="bravo" data-testid="ml-opt-bravo">
                  Bravo
                </Listbox.Option>
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Div data-testid="ml-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

class ChangeBoundary extends React.Component<
  { children: React.ReactNode },
  { message: string | null }
> {
  state = { message: null as string | null }
  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) }
  }
  componentDidCatch() {}
  render() {
    if (this.state.message) return <Div data-testid="nc-fallback">{this.state.message}</Div>
    return this.props.children
  }
}

export const NestedChangeLog = () => {
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="nc-root">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <ChangeBoundary>
            <Combobox
              defaultOpen
              value={value}
              onChange={v => {
                push(`root:${v}`)
                setValue(v)
              }}
            >
              <Field>
                <Combobox.Input data-testid="nc-input" placeholder="Search..." />
              </Field>
              <Combobox.Popover data-testid="nc-popover">
                <Listbox onChange={() => push('nested')}>
                  <Listbox.Option value="alpha" data-testid="nc-opt-alpha">
                    Alpha
                  </Listbox.Option>
                </Listbox>
              </Combobox.Popover>
            </Combobox>
          </ChangeBoundary>
        </Div>
        <Div data-testid="nc-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

const treeBranchOptions = [
  { value: 'leaf-a', label: 'Leaf A' },
  { value: 'leaf-b', label: 'Leaf B' },
]

export const TreePopupLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const [treeValue, setTreeValue] = React.useState<string | null>(null)
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="tp-root">
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
            <Field>
              <Combobox.Input data-testid="tp-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="tp-popover">
              <Tree data-testid="tp-tree" value={treeValue} onChange={setTreeValue}>
                {treeBranchOptions.map(opt => (
                  <TreeItem key={opt.value} value={opt.value} data-testid={`tp-item-${opt.value}`}>
                    {opt.label}
                  </TreeItem>
                ))}
              </Tree>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Div data-testid="tp-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const TreeTriggerLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [treeValue, setTreeValue] = React.useState<string | null>(null)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="tt-root">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox
            value={value}
            onChange={setValue}
            open={open}
            onOpen={() => setOpen(true)}
            onDismiss={() => setOpen(false)}
          >
            <Combobox.Trigger data-testid="tt-trigger">Choose</Combobox.Trigger>
            <Combobox.Popover data-testid="tt-popover">
              <Tree value={treeValue} onChange={setTreeValue}>
                {treeBranchOptions.map(opt => (
                  <TreeItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </TreeItem>
                ))}
              </Tree>
            </Combobox.Popover>
          </Combobox>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const EmptyPopoverLog = () => {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="eo-root">
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
            value={null}
            onChange={() => {}}
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
          >
            <Field>
              <Combobox.Input data-testid="eo-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="eo-popover">
              <Listbox>
                <Combobox.Empty>No results</Combobox.Empty>
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Div data-testid="eo-log">{JSON.stringify(log)}</Div>
        <Button data-testid="eo-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

export const NoPopoverLog = () => {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="np-root">
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox
            open={open}
            onOpen={() => setOpen(true)}
            onDismiss={() => setOpen(false)}
            value={null}
            onChange={() => {}}
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
          >
            <Field>
              <Combobox.Input data-testid="np-input" placeholder="Search..." />
            </Field>
          </Combobox>
        </Div>
        <Div data-testid="np-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const TouchLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>('alpha')
  const [inputValue, setInputValue] = React.useState('Alpha')
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="tc-root">
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
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
          >
            <Field>
              <Combobox.Input data-testid="tc-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="tc-popover">
              <Listbox>
                {logOptions.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    data-testid={`tc-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        {/* Far below: the portalled popover must never overlap this tap target. */}
        <Div style={{ marginTop: 480 }}>
          <Button data-testid="tc-outside">Outside</Button>
        </Div>
        <Div data-testid="tc-log">{JSON.stringify(log)}</Div>
        <Button data-testid="tc-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

// ---- Invalid grid fixtures (ADAPTER-05) ----

function InvalidFrame({
  prefix,
  adapter,
  items,
}: {
  prefix: string
  adapter: ComboboxGridAdapter
  items: React.ReactNode
}) {
  const [value, setValue] = React.useState<string | null>(null)
  return (
    <Div style={{ width: 240, margin: '16px 0' }}>
      <Combobox defaultOpen value={value} onChange={setValue}>
        <Field>
          <Combobox.Input data-testid={`${prefix}-input`} placeholder="Search..." />
        </Field>
        <Combobox.Popover virtualFocus={adapter} data-testid={`${prefix}-popover`}>
          <div role="row">{items}</div>
        </Combobox.Popover>
      </Combobox>
    </Div>
  )
}

const NoRefCell = () => <div role="gridcell">NoRef</div>

export const GridInvalidLog = () => {
  const dupAdapter = React.useMemo<ComboboxGridAdapter>(
    () => ({
      role: 'grid',
      items: [
        { value: 'same', textValue: 'Same A' },
        { value: 'same', textValue: 'Same B' },
      ],
      getNextIndex: () => 0,
      scrollToIndex: () => {},
    }),
    []
  )
  const smallAdapter = React.useMemo<ComboboxGridAdapter>(
    () => ({
      role: 'grid',
      items: [
        { value: 'one', textValue: 'One' },
        { value: 'two', textValue: 'Two', disabled: true },
      ],
      getNextIndex: () => 0,
      scrollToIndex: () => {},
    }),
    []
  )
  const badNavAdapter = React.useMemo<ComboboxGridAdapter>(
    () => ({
      role: 'grid',
      items: [
        { value: 'one', textValue: 'One' },
        { value: 'two', textValue: 'Two', disabled: true },
      ],
      // Invalid by contract: out-of-range on Down, disabled on Up.
      getNextIndex: ({ key }) => (key === 'ArrowDown' ? 99 : 1),
      scrollToIndex: () => {},
    }),
    []
  )

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="gi-root">
        <InvalidFrame
          prefix="gi-dup"
          adapter={dupAdapter}
          items={
            <>
              <Combobox.VirtualItem index={0}>
                <div role="gridcell">Same A</div>
              </Combobox.VirtualItem>
              <Combobox.VirtualItem index={1}>
                <div role="gridcell">Same B</div>
              </Combobox.VirtualItem>
            </>
          }
        />
        <InvalidFrame
          prefix="gi-range"
          adapter={smallAdapter}
          items={
            <Combobox.VirtualItem index={7}>
              <div role="gridcell">Out of range</div>
            </Combobox.VirtualItem>
          }
        />
        <InvalidFrame
          prefix="gi-dupmount"
          adapter={smallAdapter}
          items={
            <>
              <Combobox.VirtualItem index={0}>
                <div role="gridcell" data-testid="gi-dupmount-first">
                  First
                </div>
              </Combobox.VirtualItem>
              <Combobox.VirtualItem index={0}>
                <div role="gridcell" data-testid="gi-dupmount-second">
                  Second
                </div>
              </Combobox.VirtualItem>
            </>
          }
        />
        <InvalidFrame
          prefix="gi-frag"
          adapter={smallAdapter}
          items={
            <Combobox.VirtualItem index={0}>
              <>Fragment child</>
            </Combobox.VirtualItem>
          }
        />
        <InvalidFrame
          prefix="gi-noref"
          adapter={smallAdapter}
          items={
            <Combobox.VirtualItem index={0}>
              <NoRefCell />
            </Combobox.VirtualItem>
          }
        />
        <InvalidFrame
          prefix="gi-nav"
          adapter={badNavAdapter}
          items={
            <Combobox.VirtualItem index={0}>
              <div role="gridcell" data-testid="gi-nav-cell">
                One
              </div>
            </Combobox.VirtualItem>
          }
        />
      </Div>
    </ReferenceLibrary>
  )
}

/** Cancelable cell preview/commit probe (ADAPTER-06): armed preventDefault halves. */
export const PreventCellLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const [preventMove, setPreventMove] = React.useState(false)
  const [preventClick, setPreventClick] = React.useState(false)
  const push = (entry: string) => setLog(prev => [...prev, entry])

  const adapter = React.useMemo<ComboboxGridAdapter>(
    () => ({
      role: 'grid',
      items: [
        { value: 'move', textValue: 'Move' },
        { value: 'click', textValue: 'Click' },
      ],
      getNextIndex: ({ key, currentIndex }) => {
        if (key === 'ArrowDown') return currentIndex == null ? 0 : 1
        return null
      },
      scrollToIndex: () => {},
    }),
    []
  )

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="pc-root">
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
            inputValue=""
            onInputValueChange={() => {}}
          >
            <Field>
              <Combobox.Input data-testid="pc-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover virtualFocus={adapter} aria-label="Results" data-testid="pc-popover">
              <div role="row">
                <Combobox.VirtualItem index={0}>
                  <div
                    role="gridcell"
                    data-testid="pc-cell-move"
                    onPointerMove={e => {
                      push('move-handler')
                      if (preventMove) e.preventDefault()
                    }}
                  >
                    Move
                  </div>
                </Combobox.VirtualItem>
                <Combobox.VirtualItem index={1}>
                  <div
                    role="gridcell"
                    data-testid="pc-cell-click"
                    onClick={e => {
                      push('click-handler')
                      if (preventClick) e.preventDefault()
                    }}
                  >
                    Click
                  </div>
                </Combobox.VirtualItem>
              </div>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Button data-testid="pc-arm-move" onClick={() => setPreventMove(v => !v)}>
          {preventMove ? 'move-armed' : 'move-open'}
        </Button>
        <Button data-testid="pc-arm-click" onClick={() => setPreventClick(v => !v)}>
          {preventClick ? 'click-armed' : 'click-open'}
        </Button>
        <Div data-testid="pc-log">{JSON.stringify(log)}</Div>
        <Button data-testid="pc-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

const staleV1: VirtualFocusItem[] = Array.from({ length: 100 }, (_, i) => ({
  value: i === 37 ? 'zulu' : `i-${i}`,
  textValue: i === 37 ? 'Zulu' : `Item ${i}`,
}))

const staleV2: VirtualFocusItem[] = (() => {
  const rest = staleV1.filter(item => item.value !== 'zulu')
  rest.splice(12, 0, { value: 'zulu', textValue: 'Bravo' })
  return rest
})()

/** Stale-metadata probe (ADAPTER-07): replace/reorder mid-flight cancels pending. */
export const StaleGridLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [items, setItems] = React.useState<readonly VirtualFocusItem[]>(staleV1)
  const [window, setWindow] = React.useState({ start: 0, end: 5 })
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  // scrollToIndex logs only — the window slides via buttons so the spec
  // controls exactly when mounts resolve.
  const adapter = React.useMemo<ComboboxGridAdapter>(
    () => ({
      role: 'grid',
      items,
      getNextIndex: () => null,
      scrollToIndex: (index: number) => push(`scroll:${index}`),
    }),
    [items]
  )

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="sg-root">
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
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              setInputValue(v)
            }}
          >
            <Field>
              <Combobox.Input data-testid="sg-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover virtualFocus={adapter} aria-label="Results" data-testid="sg-popover">
              <div role="row">
                {items.slice(window.start, window.end).map((item, k) => {
                  const index = window.start + k
                  return (
                    <Combobox.VirtualItem key={`${item.value}-${index}`} index={index}>
                      <div role="gridcell" data-testid={`sg-cell-${item.value}-${index}`}>
                        {item.textValue}
                      </div>
                    </Combobox.VirtualItem>
                  )
                })}
              </div>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Button data-testid="sg-replace" onClick={() => setItems(staleV2)}>
          Replace metadata
        </Button>
        <Button data-testid="sg-grow" onClick={() => setWindow({ start: 35, end: 45 })}>
          Slide to stale window
        </Button>
        <Button data-testid="sg-grow2" onClick={() => setWindow({ start: 10, end: 20 })}>
          Slide to current window
        </Button>
        <Div data-testid="sg-log">{JSON.stringify(log)}</Div>
        <Button data-testid="sg-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

/** Adapter-validity recovery probe (ADAPTER-05): duplicate values then valid. */
export const RecoverLog = () => {
  const [valid, setValid] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  const items = React.useMemo(
    () =>
      valid
        ? [{ value: 'ok', textValue: 'Ok' }]
        : [
            { value: 'dup', textValue: 'A' },
            { value: 'dup', textValue: 'B' },
          ],
    [valid]
  )
  const adapter = React.useMemo<ComboboxGridAdapter>(
    () => ({
      role: 'grid',
      items,
      getNextIndex: () => 0,
      scrollToIndex: () => {},
    }),
    [items]
  )

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="rc-root">
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
            <Field>
              <Combobox.Input data-testid="rc-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover virtualFocus={adapter} data-testid="rc-popover">
              <div role="row">
                <Combobox.VirtualItem index={0}>
                  <div role="gridcell" data-testid="rc-cell">
                    Cell
                  </div>
                </Combobox.VirtualItem>
              </div>
            </Combobox.Popover>
          </Combobox>
        </Div>
        <Button data-testid="rc-toggle" onClick={() => setValid(v => !v)}>
          {valid ? 'valid' : 'invalid'}
        </Button>
        <Div data-testid="rc-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

/** Filtered both-mode consumer (CB-COMP-02): edit, navigate, commit, escape, blur, tab, reject. */
export const FilterBothLog = () => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string | null>(null)
  const [inputValue, setInputValue] = React.useState('')
  const [accept, setAccept] = React.useState(true)
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])
  const options = logOptions.filter(opt =>
    opt.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="fb-root">
        <Button data-testid="fb-before">Before</Button>
        <Div style={{ width: 240, margin: '16px 0' }}>
          <Combobox
            open={open}
            onOpen={() => {
              push('open')
              if (accept) setOpen(true)
            }}
            onDismiss={() => {
              push('dismiss')
              if (accept) setOpen(false)
            }}
            value={value}
            onChange={v => {
              push(`change:${v}`)
              if (accept) {
                setValue(v)
                setInputValue(logOptions.find(o => o.value === v)?.label ?? '')
              }
            }}
            inputValue={inputValue}
            onInputValueChange={v => {
              push(`input:${v}`)
              if (accept) setInputValue(v)
            }}
            autocomplete="both"
          >
            <Field>
              <Combobox.Input data-testid="fb-input" placeholder="Search..." />
            </Field>
            <Combobox.Popover data-testid="fb-popover">
              <Listbox>
                {options.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    data-testid={`fb-opt-${opt.value}`}
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </Div>
        {/* Spacer: the open popover must never cover these click targets. */}
        <Div style={{ height: 320 }} />
        <Button data-testid="fb-after">After</Button>
        <Button data-testid="fb-outside">Outside</Button>
        <Button data-testid="fb-accept" onClick={() => setAccept(a => !a)}>
          {accept ? 'accepting' : 'rejecting'}
        </Button>
        <Div data-testid="fb-log">{JSON.stringify(log)}</Div>
        <Button data-testid="fb-clear" onClick={() => setLog([])}>
          Clear log
        </Button>
      </Div>
    </ReferenceLibrary>
  )
}

const dialogRooms = [
  { value: 'borealis', label: 'Borealis' },
  { value: 'cinder', label: 'Cinder' },
  { value: 'dune', label: 'Dune' },
]

function DialogComboInner({ closeOnBlur }: { closeOnBlur?: boolean }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [comboOpen, setComboOpen] = React.useState(false)
  const [title, setTitle] = React.useState('Dialog booking')
  const [roomId, setRoomId] = React.useState<string | null>(null)
  const [roomInput, setRoomInput] = React.useState('')
  const [seats, setSeats] = React.useState('2')
  const [log, setLog] = React.useState<string[]>([])
  const push = (entry: string) => setLog(prev => [...prev, entry])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="dlgcombo-root">
        <Button data-testid="dlgcombo-open" onClick={() => setDialogOpen(true)}>
          Open dialog
        </Button>
        <Overlay open={dialogOpen} onDismiss={() => setDialogOpen(false)}>
          <Overlay.Backdrop
            data-testid="dlgcombo-backdrop"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          />
          <Overlay.Content
            data-testid="dlgcombo-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dlgcombo-title"
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Div
              data-testid="dlgcombo-card"
              bg="ui.dialog.background"
              color="ui.dialog.foreground"
              borderRadius="md"
              p="4r"
              style={{ pointerEvents: 'auto', width: 320 }}
            >
              <Span id="dlgcombo-title" fontSize="4r" fontWeight="600">
                New booking (dialog)
              </Span>
              <Div mt="3r">
                <Span fontSize="3r">Title</Span>
                <Input
                  data-testid="dlgcombo-title-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </Div>
              <Div mt="3r">
                <Span fontSize="3r">Room</Span>
                <Combobox
                  open={comboOpen}
                  onOpen={() => {
                    push('open')
                    setComboOpen(true)
                  }}
                  onDismiss={() => {
                    push('dismiss')
                    setComboOpen(false)
                  }}
                  value={roomId}
                  onChange={v => {
                    push(`change:${v}`)
                    setRoomId(v)
                  }}
                  inputValue={roomInput}
                  onInputValueChange={v => {
                    push(`input:${v}`)
                    setRoomInput(v)
                  }}
                  closeOnBlur={closeOnBlur}
                >
                  <Combobox.Input
                    data-testid="dlgcombo-room-input"
                    placeholder="Pick a room…"
                  />
                  <Combobox.Popover data-testid="dlgcombo-room-popover">
                    <Listbox>
                      {dialogRooms.map(r => (
                        <Listbox.Option
                          key={r.value}
                          value={r.value}
                          data-testid={`dlgcombo-room-${r.value}`}
                        >
                          {r.label}
                        </Listbox.Option>
                      ))}
                    </Listbox>
                  </Combobox.Popover>
                </Combobox>
              </Div>
              <Div mt="3r">
                <Span fontSize="3r">Seats</Span>
                <Input
                  data-testid="dlgcombo-seats-input"
                  value={seats}
                  onChange={e => setSeats(e.target.value)}
                />
              </Div>
              <Div mt="4r" display="flex" gap="2r">
                <Button
                  data-testid="dlgcombo-cancel"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </Div>
            </Div>
          </Overlay.Content>
        </Overlay>
        <Div data-testid="dlgcombo-log">{JSON.stringify(log)}</Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const DialogCombo = () => <DialogComboInner />

export const DialogComboPersist = () => <DialogComboInner closeOnBlur={false} />

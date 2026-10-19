import '@reference-ui/lib/styles.css'
import '@reference-ui/react/styles.css'
import { useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { NumberField, type NumberFieldCommitBehavior } from '@reference-ui/lib'

function Example({ mode }: { mode: NumberFieldCommitBehavior }) {
  const [value, setValue] = useState<number | null>(2)
  const [events, setEvents] = useState<unknown[]>([])
  const [submits, setSubmits] = useState(0)
  const [data, setData] = useState<unknown>(null)
  const [alreadyPrevented, setAlreadyPrevented] = useState<boolean | null>(null)
  function submit(event: FormEvent<HTMLFormElement>) {
    setAlreadyPrevented(event.defaultPrevented)
    event.preventDefault()
    setSubmits(n => n + 1)
    setData(Array.from(new FormData(event.currentTarget)))
  }
  return <section style={{ padding: 24, maxWidth: 680 }}>
    <h2>{mode} mode</h2>
    <form id={`form-${mode}`} onSubmit={submit}>
      <NumberField name="amount" locale="en-GB" value={value} min={0} max={10} step={1} commitBehavior={mode}
        onChange={next => { setValue(next); setEvents(old => [...old, { event: 'change', value: next }]) }}
        onInvalidCommit={(attempted, reason) => setEvents(old => [...old, { event: 'invalid', attempted, reason }])}>
        <NumberField.Group><NumberField.Input aria-label={`${mode} amount`} /></NumberField.Group>
      </NumberField>
      <button type="submit">Submit {mode}</button>
    </form>
    <p>Value: <output data-testid={`value-${mode}`}>{String(value)}</output></p>
    <p>Submits: <output data-testid={`submits-${mode}`}>{submits}</output></p>
    <p>Already canceled before observer: <output data-testid={`prevented-${mode}`}>{String(alreadyPrevented)}</output></p>
    <pre data-testid={`data-${mode}`}>{JSON.stringify(data)}</pre>
    <pre data-testid={`events-${mode}`}>{JSON.stringify(events, null, 2)}</pre>
  </section>
}
createRoot(document.getElementById('root')!).render(<main><h1>NumberField native form reproduction</h1><Example mode="validate" /><Example mode="none" /><Example mode="snap" /></main>)

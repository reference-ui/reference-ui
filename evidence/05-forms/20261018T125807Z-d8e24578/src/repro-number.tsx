import '@reference-ui/react/styles.css'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { NumberField } from '@reference-ui/lib'
import { Label } from '@reference-ui/react'

function Repro() {
  const [value, setValue] = useState<number | null>(2)
  const [focused, setFocused] = useState(false)
  const [commits, setCommits] = useState<Array<number | null>>([])
  return <main style={{ padding: 32, maxWidth: 640, fontFamily: 'sans-serif' }}>
    <h1>NumberField: commit timing</h1>
    <p>Docs: “The value commits on blur, Enter, and each step, not on every keystroke.”</p>
    <Label htmlFor="quantity">Quantity</Label>
    <NumberField value={value} onChange={(next) => { setValue(next); setCommits(items => [...items, next]) }} locale="en-GB" min={1} max={12}>
      <NumberField.Group>
        <NumberField.Decrement aria-label="Decrease quantity" />
        <NumberField.Input id="quantity" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        <NumberField.Increment aria-label="Increase quantity" />
      </NumberField.Group>
    </NumberField>
    <p>Controlled value: <output data-testid="value">{JSON.stringify(value)}</output></p>
    <p>Input focused: <output data-testid="focus-state">{focused ? 'yes' : 'no'}</output></p>
    <p>onChange callbacks: <output data-testid="commits">{JSON.stringify(commits)}</output></p>
    <button type="button">Blur target</button>
    <p id="observation">Select the quantity and type a valid digit without blurring or pressing Enter.</p>
  </main>
}
createRoot(document.getElementById('root')!).render(<Repro />)

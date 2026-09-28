// @vitest-environment happy-dom
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
import * as React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { DateField } from './DateField'

async function renderStepField(initial: string | null) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const seen: Array<string | null> = []

  function Harness() {
    const [value, setValue] = React.useState<string | null>(initial)
    return (
      <DateField
        locale="en-GB"
        value={value}
        onChange={(next) => {
          seen.push(next)
          setValue(next)
        }}
        data-testid="step-input"
      />
    )
  }

  await act(async () => {
    root.render(<Harness />)
  })
  const input = container.querySelector('input[data-testid="step-input"]') as HTMLInputElement
  return { container, root, input, seen }
}

async function pressKey(input: HTMLInputElement, key: string, caret: number, shift = false) {
  // happy-dom may not implement text selection; shadow the caret so the
  // component's segment lookup is deterministic either way.
  try {
    input.setSelectionRange(caret, caret)
  } catch {
    Object.defineProperty(input, 'selectionStart', { value: caret, configurable: true })
  }
  if (input.selectionStart !== caret) {
    Object.defineProperty(input, 'selectionStart', { value: caret, configurable: true })
  }
  await act(async () => {
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, shiftKey: shift })
    )
  })
}

describe('DateField caret stepping carry (PATCHES #2)', () => {
  it('DF-KEY-02: day overflow carries with Gregorian constrain', async () => {
    const { container, root, input, seen } = await renderStepField('2024-01-31')
    expect(input.value).toBe('31/01/2024')

    // Caret in the day segment: 31 Jan + 1 day carries into February.
    await pressKey(input, 'ArrowUp', 1)
    expect(seen).toEqual(['2024-02-01'])
    expect(input.value).toBe('01/02/2024')
    expect(input.hasAttribute('data-editing')).toBe(false)

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('DF-KEY-03: month and year carry constrain like Calendar', async () => {
    const { container, root, input, seen } = await renderStepField('2024-01-31')
    expect(input.value).toBe('31/01/2024')

    // Caret in the month segment: 31 Jan + 1 month constrains to 29 Feb
    // (2024 is a leap year), never overflowing into March.
    await pressKey(input, 'ArrowUp', 4)
    expect(seen).toEqual(['2024-02-29'])
    expect(input.value).toBe('29/02/2024')

    await act(async () => {
      root.unmount()
    })
    container.remove()

    // 29 Feb 2024 + 1 year constrains to 28 Feb 2025 (not a leap year).
    const second = await renderStepField('2024-02-29')
    expect(second.input.value).toBe('29/02/2024')
    await pressKey(second.input, 'ArrowUp', 8)
    expect(second.seen).toEqual(['2025-02-28'])
    expect(second.input.value).toBe('28/02/2025')

    await act(async () => {
      second.root.unmount()
    })
    second.container.remove()
  })
})

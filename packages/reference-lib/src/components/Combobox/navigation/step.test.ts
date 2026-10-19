/**
 * Active-step proof: stepActiveValue and mountedValue across enabled,
 * disabled, and absent options. Pure stepping with no DOM; the keyboard
 * hooks consume it.
 */
import { describe, expect, it, vi } from 'vitest'
import type { ComboboxOptionEntry } from '../combobox-context'
import { mountedValue, stepActiveValue } from './step'

function entry(value: string, disabled = false): ComboboxOptionEntry {
  return { value, id: `id-${value}`, node: null, disabled }
}

describe('stepActiveValue', () => {
  it('steps forward and wraps through enabled options with keyboard source', () => {
    const setActive = vi.fn()
    const enabled = [entry('a'), entry('b'), entry('c')]
    stepActiveValue({ enabled, current: 'b', direction: 1, setActive })
    expect(setActive).toHaveBeenCalledWith('c', 'keyboard')
    stepActiveValue({ enabled, current: 'c', direction: 1, setActive })
    expect(setActive).toHaveBeenCalledWith('a', 'keyboard')
    stepActiveValue({ enabled, current: 'a', direction: -1, setActive })
    expect(setActive).toHaveBeenCalledWith('c', 'keyboard')
  })

  it('starts at the directional edge when nothing is active', () => {
    const setActive = vi.fn()
    const enabled = [entry('a'), entry('b')]
    stepActiveValue({ enabled, current: null, direction: 1, setActive })
    expect(setActive).toHaveBeenCalledWith('a', 'keyboard')
    stepActiveValue({ enabled, current: null, direction: -1, setActive })
    expect(setActive).toHaveBeenCalledWith('b', 'keyboard')
  })

  it('scrolls the target into view and stays silent when empty', () => {
    const setActive = vi.fn()
    const scrollIntoView = vi.fn()
    const enabled = [{ ...entry('a'), node: { scrollIntoView } as unknown as HTMLElement }]
    stepActiveValue({ enabled, current: null, direction: 1, setActive })
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    stepActiveValue({ enabled: [], current: null, direction: 1, setActive })
    expect(setActive).toHaveBeenCalledTimes(1)
  })
})

describe('mountedValue', () => {
  it('keeps only still-mounted active values committable', () => {
    const enabled = [entry('a'), entry('b')]
    expect(mountedValue('a', enabled)).toBe('a')
    expect(mountedValue('ghost', enabled)).toBeNull()
    expect(mountedValue(null, enabled)).toBeNull()
  })
})

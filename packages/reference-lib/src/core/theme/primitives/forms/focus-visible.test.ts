// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import {
  setupFocusVisible,
  isFocusVisible,
  getModality,
} from './focus-visible'

describe('focus-visible and modality tracking', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    setupFocusVisible(document)
  })

  it('sets modality to pointer on pointerdown / mousedown', () => {
    window.dispatchEvent(new MouseEvent('mousedown'))
    expect(getModality()).toBe('pointer')
    expect(isFocusVisible()).toBe(false)
  })

  it('does not set data-focus-visible on text input when focused via pointer', () => {
    const field = document.createElement('div')
    field.setAttribute('data-reference-field', '')
    const input = document.createElement('input')
    input.type = 'text'
    field.appendChild(input)
    document.body.appendChild(field)

    // User clicks input
    input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

    expect(input.hasAttribute('data-focus-visible')).toBe(false)
    expect(field.hasAttribute('data-focus-visible')).toBe(false)
  })

  it('sets data-focus-visible on text input and parent field when navigated via Tab key', () => {
    const field = document.createElement('div')
    field.setAttribute('data-reference-field', '')
    const input = document.createElement('input')
    input.type = 'text'
    field.appendChild(input)
    document.body.appendChild(field)

    // User tabs to input
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(getModality()).toBe('keyboard')
    expect(isFocusVisible()).toBe(true)

    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(input.hasAttribute('data-focus-visible')).toBe(true)
    expect(field.hasAttribute('data-focus-visible')).toBe(true)

    // Blur removes data-focus-visible
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    expect(input.hasAttribute('data-focus-visible')).toBe(false)
    expect(field.hasAttribute('data-focus-visible')).toBe(false)
  })

  it('typing regular characters in an input does not activate keyboard focus visible ring', () => {
    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)

    // Mouse focus
    input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(input.hasAttribute('data-focus-visible')).toBe(false)

    // User types letters
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    expect(getModality()).toBe('pointer')
  })

  it('treats Alt+Tab (Safari traverse-all-controls) as keyboard modality', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)

    // Pointer interaction first (also resets module-level modality), then Option+Tab
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(getModality()).toBe('pointer')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', altKey: true, bubbles: true }))
    expect(getModality()).toBe('keyboard')
    expect(isFocusVisible()).toBe(true)

    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(button.hasAttribute('data-focus-visible')).toBe(true)
  })

  it('treats Ctrl+Tab and Meta+Tab as keyboard modality (Tab is always focus movement)', () => {
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', ctrlKey: true, bubbles: true }))
    expect(getModality()).toBe('keyboard')

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(getModality()).toBe('pointer')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', metaKey: true, bubbles: true }))
    expect(getModality()).toBe('keyboard')
  })

  it('still ignores modified non-Tab keys (modifier guard intact)', () => {
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(getModality()).toBe('pointer')
    // Alt+Arrow / Ctrl+letter shortcuts must not flip modality to keyboard
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, bubbles: true }))
    expect(getModality()).toBe('pointer')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }))
    expect(getModality()).toBe('pointer')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
    expect(getModality()).toBe('pointer')
  })

  it('Alt+Tab on a text input sets keyboard modality (Tab was already in the text-input allowlist)', () => {
    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)
    input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(getModality()).toBe('pointer')

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', altKey: true, bubbles: true }))
    expect(getModality()).toBe('keyboard')
  })

  it('removes data-focus-visible on pointerdown when an element is active', () => {
    const field = document.createElement('div')
    field.setAttribute('data-reference-field', '')
    const input = document.createElement('input')
    input.type = 'text'
    field.appendChild(input)
    document.body.appendChild(field)

    // Keyboard navigation focuses input
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    input.focus()
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(input.hasAttribute('data-focus-visible')).toBe(true)

    // User clicks mouse
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(input.hasAttribute('data-focus-visible')).toBe(false)
    expect(field.hasAttribute('data-focus-visible')).toBe(false)
  })
})

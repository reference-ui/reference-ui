/**
 * Interaction modality and focus-visible tracking.
 *
 * Browsers natively fire `:focus-visible` on `<input>` and `<textarea>` elements
 * even on mouse click. This document-level tracker distinguishes true keyboard
 * navigation (Tab, Shift+Tab, and navigation keys) from pointer interactions,
 * applying `[data-focus-visible]` only when keyboard navigation is used.
 *
 * Modeled after React Aria's modality tracking and APG requirements.
 */

export type Modality = 'keyboard' | 'pointer'

let currentModality: Modality = 'pointer'
let isInitialized = false

// Non-text input types where arrow keys/Enter immediately indicate keyboard interaction
const NON_TEXT_INPUT_TYPES = new Set([
  'checkbox',
  'radio',
  'range',
  'color',
  'file',
  'image',
  'button',
  'submit',
  'reset',
])

function isTextInputElement(element: Element | EventTarget | null): boolean {
  if (!element || !(element instanceof Element) || !element.tagName) return false
  const tagName = element.tagName.toLowerCase()
  if (tagName === 'textarea') return true
  if (tagName === 'input') {
    const type = (element as HTMLInputElement).type?.toLowerCase() || 'text'
    return !NON_TEXT_INPUT_TYPES.has(type)
  }
  return (element as HTMLElement).isContentEditable ?? false
}

// Only Tab and Escape switch focus-visible on text inputs
const TEXT_INPUT_FOCUS_VISIBLE_KEYS = new Set(['Tab', 'Escape'])

function handleKeyDown(e: KeyboardEvent) {
  if (e.metaKey || e.altKey || e.ctrlKey) return

  const active = typeof document !== 'undefined' ? document.activeElement : null
  const isTextInput = isTextInputElement(active) || isTextInputElement(e.target as Element)

  if (isTextInput) {
    if (TEXT_INPUT_FOCUS_VISIBLE_KEYS.has(e.key)) {
      currentModality = 'keyboard'
    }
  } else {
    currentModality = 'keyboard'
  }
}

function handlePointerDown() {
  currentModality = 'pointer'
}

function updateFieldFocusVisible(element: HTMLElement, isVisible: boolean) {
  const field = element.closest('[data-reference-field]') as HTMLElement | null
  if (field) {
    if (isVisible) {
      field.setAttribute('data-focus-visible', '')
    } else {
      // Only remove if no other active element inside has focus-visible
      const otherVisible = field.querySelector('[data-focus-visible]')
      if (!otherVisible || otherVisible === element) {
        field.removeAttribute('data-focus-visible')
      }
    }
  }
}

function handleFocusIn(e: FocusEvent) {
  const target = e.target as HTMLElement | null
  if (!target || !(target instanceof HTMLElement)) return

  const isTextInput = isTextInputElement(target)

  // If focused via keyboard navigation, mark as focus visible
  if (currentModality === 'keyboard') {
    target.setAttribute('data-focus-visible', '')
    updateFieldFocusVisible(target, true)
  } else {
    target.removeAttribute('data-focus-visible')
    // Ensure field does not have focus-visible on mouse click
    updateFieldFocusVisible(target, false)
  }
}

function handleFocusOut(e: FocusEvent) {
  const target = e.target as HTMLElement | null
  if (!target || !(target instanceof HTMLElement)) return

  target.removeAttribute('data-focus-visible')
  updateFieldFocusVisible(target, false)
}

export function setupFocusVisible(doc?: Document): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const targetDoc = doc ?? document

  if (isInitialized) return
  isInitialized = true

  targetDoc.addEventListener('keydown', handleKeyDown, true)
  targetDoc.addEventListener('pointerdown', handlePointerDown, true)
  targetDoc.addEventListener('mousedown', handlePointerDown, true)
  targetDoc.addEventListener('focusin', handleFocusIn, true)
  targetDoc.addEventListener('focusout', handleFocusOut, true)
}

export function isFocusVisible(): boolean {
  return currentModality === 'keyboard'
}

export function getModality(): Modality {
  return currentModality
}

// Automatically initialize in browser environments
if (typeof document !== 'undefined') {
  setupFocusVisible(document)
}

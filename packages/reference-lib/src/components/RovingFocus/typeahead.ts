// Pure typeahead search model for the RovingFocus kernel. Owns the query buffer,
// the 1000ms idle timer, same-letter cycling, and Unicode prefix matching via
// Intl.Collator. Framework-free so unit tests can drive it deterministically.

export interface TypeaheadItem {
  id: string
  text: string
  disabled?: boolean
  hidden?: boolean
}

// Event shape the typeahead guard accepts. Satisfied by React's KeyboardEvent
// (isComposing rides on nativeEvent) and by minimal test fakes.
export interface TypeaheadGuardEvent {
  readonly key: string
  readonly ctrlKey: boolean
  readonly altKey: boolean
  readonly metaKey: boolean
  readonly target: EventTarget | null
  readonly nativeEvent?: { readonly isComposing?: boolean } | undefined
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined') return false
  if (!target || !(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true
  if (target.isContentEditable) return true
  return false
}

// Mirrors the kernel's typeahead entry guards. Consumers routing their own
// keys through TypeaheadModel must skip the same keys or they fork the
// IME/editable behavior (FEATURES #7). True = do NOT feed the buffer.
export function shouldIgnoreTypeaheadKey(e: TypeaheadGuardEvent): boolean {
  if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return true
  if (e.nativeEvent?.isComposing === true) return true
  return isEditableTarget(e.target)
}

export class TypeaheadModel {
  private buffer = ''
  private timer: ReturnType<typeof setTimeout> | null = null
  private collator = new Intl.Collator(undefined, { sensitivity: 'accent', usage: 'search' })
  private timeoutMs = 1000

  constructor(options?: { timeoutMs?: number }) {
    if (options?.timeoutMs != null) {
      this.timeoutMs = options.timeoutMs
    }
  }

  getBuffer(): string {
    return this.buffer
  }

  hasBuffer(): boolean {
    return this.buffer.length > 0
  }

  reset(): void {
    this.buffer = ''
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  handleKey(
    key: string,
    currentId: string | null,
    items: TypeaheadItem[],
    onTimerExpiry?: () => void
  ): string | null {
    if (key.length !== 1) return null

    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.buffer = ''
      onTimerExpiry?.()
    }, this.timeoutMs)

    const availableItems = items.filter(i => !i.disabled && !i.hidden)
    if (availableItems.length === 0) return null

    const isRepeatedChar =
      this.buffer.length > 0 &&
      this.buffer.split('').every(c => c.toLowerCase() === key.toLowerCase())

    if (isRepeatedChar) {
      return this.findNextMatch(key, currentId, availableItems)
    }

    this.buffer += key
    const match = this.findFirstMatch(this.buffer, currentId, availableItems)
    if (match) {
      return match
    }
    return currentId
  }

  isMatch(itemText: string, query: string): boolean {
    const normText = itemText.normalize('NFC')
    const normQuery = query.normalize('NFC')
    if (normText.length < normQuery.length) return false
    const sub = normText.slice(0, normQuery.length)
    return this.collator.compare(sub, normQuery) === 0
  }

  private findFirstMatch(
    query: string,
    currentId: string | null,
    items: TypeaheadItem[]
  ): string | null {
    const currentIndex = items.findIndex(i => i.id === currentId)
    const ordered =
      currentIndex === -1 ? items : [...items.slice(currentIndex), ...items.slice(0, currentIndex)]

    const found = ordered.find(item => this.isMatch(item.text, query))
    return found ? found.id : null
  }

  private findNextMatch(
    char: string,
    currentId: string | null,
    items: TypeaheadItem[]
  ): string | null {
    const currentIndex = items.findIndex(i => i.id === currentId)
    const ordered =
      currentIndex === -1
        ? items
        : [...items.slice(currentIndex + 1), ...items.slice(0, currentIndex + 1)]

    const found = ordered.find(item => this.isMatch(item.text, char))
    return found ? found.id : null
  }
}

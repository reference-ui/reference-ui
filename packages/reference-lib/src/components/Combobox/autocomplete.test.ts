import { describe, expect, it } from 'vitest'
import { completesInline, completionForPrefix } from './autocomplete'

describe('completesInline', () => {
  it('gates inline completion on the inline/both modes', () => {
    expect(completesInline('inline')).toBe(true)
    expect(completesInline('both')).toBe(true)
    expect(completesInline('none')).toBe(false)
    expect(completesInline('list')).toBe(false)
  })
})

describe('completionForPrefix', () => {
  it('completes a case-insensitive prefix to the label', () => {
    expect(completionForPrefix('app', 'Apple')).toBe('Apple')
    expect(completionForPrefix('APP', 'apple')).toBe('apple')
  })

  it('completes to nothing without a prefix, a label, or a suffix', () => {
    expect(completionForPrefix('', 'Apple')).toBeNull()
    expect(completionForPrefix('app', null)).toBeNull()
    expect(completionForPrefix('app', '')).toBeNull()
    expect(completionForPrefix('apple', 'apple')).toBeNull()
    expect(completionForPrefix('apples', 'apple')).toBeNull()
  })

  it('rejects non-prefix labels', () => {
    expect(completionForPrefix('ban', 'Apple')).toBeNull()
  })
})

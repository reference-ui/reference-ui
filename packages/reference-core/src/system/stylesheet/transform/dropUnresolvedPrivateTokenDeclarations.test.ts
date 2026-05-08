import { describe, expect, it } from 'vitest'
import { dropUnresolvedPrivateTokenDeclarations } from './dropUnresolvedPrivateTokenDeclarations'

describe('dropUnresolvedPrivateTokenDeclarations', () => {
  it('returns input unchanged when no unresolved private token references exist', () => {
    const css = '.c { color: var(--colors-fixture-demo-text); }'
    expect(dropUnresolvedPrivateTokenDeclarations(css)).toBe(css)
  })

  it('drops a declaration whose value is an unresolved _private.* token reference', () => {
    const css = '.c { color: _private.brand; background: red; }'
    const result = dropUnresolvedPrivateTokenDeclarations(css)
    expect(result).not.toContain('_private.brand')
    expect(result).toContain('background: red')
  })

  it('removes empty rules left behind after dropping the only declaration', () => {
    const css = '.c { color: _private.brand; }'
    expect(dropUnresolvedPrivateTokenDeclarations(css).trim()).toBe('')
  })

  it('preserves resolved private token references that go through var()', () => {
    const css = '.c { color: var(--colors-_private-brand); }'
    expect(dropUnresolvedPrivateTokenDeclarations(css)).toBe(css)
  })

  it('removes empty @layer wrappers after pruning', () => {
    const css = '@layer chain { .c { color: _private.brand; } }'
    expect(dropUnresolvedPrivateTokenDeclarations(css).trim()).toBe('')
  })

  it('handles multiple declarations across multiple rules', () => {
    const css = [
      '.a { color: _private.brand; padding: 4px; }',
      '.b { border-color: _private.deep.path; }',
      '.c { color: var(--colors-text); }',
    ].join('\n')
    const result = dropUnresolvedPrivateTokenDeclarations(css)
    expect(result).not.toMatch(/_private\./)
    expect(result).toContain('padding: 4px')
    expect(result).toContain('var(--colors-text)')
    expect(result).not.toContain('.b {')
  })
})

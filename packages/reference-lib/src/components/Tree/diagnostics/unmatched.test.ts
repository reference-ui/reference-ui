/**
 * Proof for the Tree unmatched-id decision. Pins undecidable on empty or
 * collapsed registries, flagging unmatched values only once every branch
 * is expanded, nullish values never flagged, and document-ordered ids.
 */
import { describe, expect, it } from 'vitest'
import {
  findUnmatchedTreeIds,
  registeredInDocumentOrder,
  unmatchedExpandedMessage,
  unmatchedValueMessage,
} from './unmatched'

describe('Tree unmatched-id decision', () => {
  const registered = new Set(['folder', 'a', 'b'])

  it('is undecidable while the registry is empty', () => {
    expect(
      findUnmatchedTreeIds({ registered: new Set(), branches: [], expanded: ['x'], value: 'x' })
    ).toBeNull()
  })

  it('is undecidable while any registered branch is collapsed', () => {
    expect(
      findUnmatchedTreeIds({
        registered,
        branches: ['folder'],
        expanded: ['ghost'],
        value: 'typo',
      })
    ).toBeNull()
  })

  it('flags an unmatched value and deduplicated unknown expanded ids once every branch is expanded', () => {
    expect(
      findUnmatchedTreeIds({
        registered,
        branches: ['folder'],
        expanded: ['folder', 'ghost', 'folder', 'phantom', 'ghost'],
        value: 'typo',
      })
    ).toEqual({ value: 'typo', expanded: ['ghost', 'phantom'] })
  })

  it('never flags a null or undefined value, and returns null when every id matches', () => {
    const fullyMounted = { registered, branches: ['folder'], expanded: ['folder', 'a'] }
    expect(findUnmatchedTreeIds({ ...fullyMounted, value: null })).toBeNull()
    expect(findUnmatchedTreeIds({ ...fullyMounted, value: undefined })).toBeNull()
    expect(findUnmatchedTreeIds({ ...fullyMounted, value: 'a' })).toBeNull()
  })

  it('orders registered ids by document order and appends registered ids the DOM did not list', () => {
    expect(
      registeredInDocumentOrder(['folder', 'a', 'b'], new Set(['b', 'folder', 'a', 'late']))
    ).toEqual(['folder', 'a', 'b', 'late'])
    expect(registeredInDocumentOrder(['x', 'folder'], new Set(['folder', 'a']))).toEqual([
      'folder',
      'a',
    ])
  })

  it('words the value and expanded warnings with the pinned text', () => {
    expect(unmatchedValueMessage('typo', ['folder', 'a'])).toBe(
      'value "typo" matches no item (registered ids: folder, a).'
    )
    expect(unmatchedExpandedMessage(['ghost', 'phantom'], ['folder', 'a'])).toBe(
      'expanded contains "ghost", "phantom" matching no item (registered ids: folder, a); unknown ids are kept and passed through.'
    )
  })
})

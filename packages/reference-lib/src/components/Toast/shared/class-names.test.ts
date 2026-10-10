/** Isolation proof for class-name layering: item wins each slot. */
import { describe, expect, it } from 'vitest'
import { mergeClassNames } from './class-names'

describe('toast class names', () => {
  it('returns undefined when neither side provides names', () => {
    expect(mergeClassNames(undefined, undefined)).toBeUndefined()
  })

  it('lets the per-toast record win each slot', () => {
    expect(
      mergeClassNames({ toast: 'host', title: 'host-title' }, { title: 'item-title' })
    ).toEqual({ toast: 'host', title: 'item-title' })
  })
})

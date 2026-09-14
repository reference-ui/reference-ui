import { describe, expect, it } from 'vitest'

import { getComponent } from '../../helpers'

const CASE = 'co_usage_pairs'

describe('co_usage_pairs atlas case', () => {
  it('tracks commonly co-used components deterministically', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)

    expect(button.usedWith.Card).toBeDefined()
    expect(button.usedWith.Badge).toBeDefined()
  })

  it('weights the more common co-usage higher', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)

    expect(button.usedWith.Card).toBe('very common')
    expect(button.usedWith.Badge).not.toBe('unused')
  })
})

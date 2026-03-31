import { describe, expect, it } from 'vitest'

import { getComponent } from '../../helpers'

const CASE = 'barrel_reexports'

describe('barrel_reexports atlas case', () => {
  it('tracks local components imported through a barrel file', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)
    const userBadge = await getComponent('UserBadge', undefined, undefined, CASE)

    expect(button.count).toBe(2)
    expect(userBadge.count).toBe(1)
  })

  it('keeps the canonical component interface after a barrel hop', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)

    expect(button.interface.name).toBe('ButtonProps')
  })
})

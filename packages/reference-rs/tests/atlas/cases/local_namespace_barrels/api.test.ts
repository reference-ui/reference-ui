import { describe, expect, it } from 'vitest'

import { getComponent } from '../../helpers'

const CASE = 'local_namespace_barrels'

describe('local_namespace_barrels atlas case', () => {
  it('tracks components imported through a local namespace barrel', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)
    const badge = await getComponent('UserBadge', undefined, undefined, CASE)

    expect(button.count).toBe(2)
    expect(badge.count).toBe(1)
  })

  it('preserves interface mapping through the local namespace barrel', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)

    expect(button.interface.name).toBe('ButtonProps')
  })
})

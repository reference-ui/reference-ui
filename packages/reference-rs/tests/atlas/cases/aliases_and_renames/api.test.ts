import { describe, expect, it } from 'vitest'

import { getComponent, getComponents } from '../../helpers'

const CASE = 'aliases_and_renames'

describe('aliases_and_renames atlas case', () => {
  it('maps aliased local imports back to their canonical component names', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)
    const userBadge = await getComponent('UserBadge', undefined, undefined, CASE)

    expect(button.count).toBe(2)
    expect(userBadge.count).toBe(1)
  })

  it('still surfaces canonical local component names in the result set', async () => {
    const names = (await getComponents(undefined, CASE)).map(component => component.name)

    expect(names).toContain('Button')
    expect(names).toContain('UserBadge')
    expect(names).not.toContain('PrimaryButton')
    expect(names).not.toContain('IdentityBadge')
  })
})

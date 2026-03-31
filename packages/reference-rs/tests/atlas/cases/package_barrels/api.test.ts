import { describe, expect, it } from 'vitest'

import { getComponent } from '../../helpers'

const CASE = 'package_barrels'

describe('package_barrels atlas case', () => {
  it('resolves local wrapper props through a package barrel re-export', async () => {
    const appButton = await getComponent('AppButton', undefined, undefined, CASE)

    expect(appButton.count).toBe(2)
    expect(appButton.interface.name).toBe('ButtonProps')
    expect(appButton.interface.source).toBe('@fixtures/barrel-ui')
  })

  it('can include the package component exported through the barrel', async () => {
    const packageButton = await getComponent(
      'Button',
      { include: ['@fixtures/barrel-ui'] },
      '@fixtures/barrel-ui',
      CASE
    )

    expect(packageButton.interface.name).toBe('ButtonProps')
  })
})

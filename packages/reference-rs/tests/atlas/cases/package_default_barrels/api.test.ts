import { describe, expect, it } from 'vitest'

import { getComponent } from '../../helpers'

const CASE = 'package_default_barrels'

describe('package_default_barrels atlas case', () => {
  it('tracks a package default export forwarded through the package entrypoint', async () => {
    const button = await getComponent('Button', { include: ['@fixtures/default-barrel-ui'] }, '@fixtures/default-barrel-ui', CASE)

    expect(button.count).toBe(3)
    expect(button.interface.name).toBe('ButtonProps')
  })

  it('maps a local wrapper back to the package props interface', async () => {
    const appButton = await getComponent('AppButton', undefined, undefined, CASE)

    expect(appButton.interface.name).toBe('ButtonProps')
    expect(appButton.interface.source).toBe('@fixtures/default-barrel-ui')
  })
})
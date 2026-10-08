/**
 * Station specification for ATL-BAR-03-package-default-barrels.
 * Validates package entrypoints forwarding default exports, confirming
 * external component resolution and local wrapper interface provenance.
 * Proves primary SPEC anchor ATL-BAR-03.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-BAR-03',
  verify(result) {
    const defaultBarrelUi = result.withIncludes['@fixtures/default-barrel-ui']
    expect(defaultBarrelUi).toBeDefined()
    const button = defaultBarrelUi!.find(c => c.name === 'Button')
    expect(button).toBeDefined()
    expect(button?.count).toBe(3)
    expect(button?.interface?.name).toBe('ButtonProps')

    const appButton = result.components.find(c => c.name === 'AppButton')!
    expect(appButton).toBeDefined()
    expect(appButton.interface?.name).toBe('ButtonProps')
    expect(appButton.interface?.source).toBe('@fixtures/default-barrel-ui')
  },
}

export default spec

/**
 * Station specification for ATL-BAR-02-package-barrels.
 * Validates package entrypoint barrel resolution, local wrapper interface linking,
 * and suppression of unexported internal components.
 * Proves primary SPEC anchor ATL-BAR-02.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-BAR-02',
  verify(result) {
    const appButton = result.components.find(c => c.name === 'AppButton')!
    expect(appButton).toBeDefined()
    expect(appButton.count).toBe(2)
    expect(appButton.interface?.name).toBe('ButtonProps')
    expect(appButton.interface?.source).toBe('@fixtures/barrel-ui')

    const barrelUi = result.withIncludes['@fixtures/barrel-ui']
    expect(barrelUi).toBeDefined()
    const packageButton = barrelUi!.find(c => c.name === 'Button')
    expect(packageButton).toBeDefined()
    expect(packageButton?.interface?.name).toBe('ButtonProps')

    const privateChip = barrelUi!.find(c => c.name === 'PrivateChip')
    expect(privateChip).toBeUndefined()
  },
}

export default spec

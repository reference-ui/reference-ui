import { describe, expect, it } from 'vitest'

import { getComponent } from '../../helpers'

const CASE = 'default_exports'

describe('default_exports atlas case', () => {
  it('tracks a default-exported component through a default import', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)

    expect(button.count).toBe(2)
    expect(button.interface.name).toBe('ButtonProps')
  })

  it('preserves the call-site alias in examples while keeping the canonical component name', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)

    expect(button.examples[0]).toMatch(/<PrimaryButton/)
  })
})

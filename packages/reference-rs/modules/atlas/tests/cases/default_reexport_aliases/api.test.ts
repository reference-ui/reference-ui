import { describe, expect, it } from 'vitest'

import { getComponent } from '../../helpers'

const CASE = 'default_reexport_aliases'

describe('default_reexport_aliases atlas case', () => {
  it('tracks a default export through named re-export alias chains', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)

    expect(button.count).toBe(2)
    expect(button.interface?.name).toBe('ButtonProps')
  })

  it('preserves the final call-site alias in examples', async () => {
    const button = await getComponent('Button', undefined, undefined, CASE)

    expect(button.examples[0]).toMatch(/<CTAButton/)
  })
})

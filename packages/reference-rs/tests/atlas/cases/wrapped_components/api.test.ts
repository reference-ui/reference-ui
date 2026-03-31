import { describe, expect, it } from 'vitest'

import { getComponent } from '../../helpers'

const CASE = 'wrapped_components'

describe('wrapped_components atlas case', () => {
  it('tracks memo-wrapped named exports using the exported variable name', async () => {
    const fancyButton = await getComponent('FancyButton', undefined, undefined, CASE)

    expect(fancyButton.count).toBe(2)
    expect(fancyButton.interface.name).toBe('FancyButtonProps')
    expect(fancyButton.examples[0]).toMatch(/<CTAButton/)
  })

  it('tracks default-exported forwardRef components through aliased default imports', async () => {
    const searchInput = await getComponent('SearchInput', undefined, undefined, CASE)

    expect(searchInput.count).toBe(2)
    expect(searchInput.interface.name).toBe('SearchInputProps')
    expect(searchInput.examples[0]).toMatch(/<SearchBox/)
  })
})

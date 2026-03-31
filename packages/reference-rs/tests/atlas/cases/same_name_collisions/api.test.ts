import { describe, expect, it } from 'vitest'

import { getComponents } from '../../helpers'

const CASE = 'same_name_collisions'

describe('same_name_collisions atlas case', () => {
  it('keeps components with the same name distinct by source', async () => {
    const buttons = (await getComponents(undefined, CASE)).filter(
      component => component.name === 'Button'
    )

    expect(buttons).toHaveLength(2)
    expect(buttons.some(component => /marketing\/Button/.test(component.source))).toBe(
      true
    )
    expect(buttons.some(component => /forms\/Button/.test(component.source))).toBe(true)
  })
})

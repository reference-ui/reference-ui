import { describe, expect, it } from 'vitest'

import { DEMO_SURFACE_CASE, getComponents, getCaseInputDir } from '../../helpers'

describe('demo_surface atlas case', () => {
  it('analyzes the case app root', async () => {
    const components = await getComponents(undefined, DEMO_SURFACE_CASE)

    expect(getCaseInputDir(DEMO_SURFACE_CASE)).toMatch(
      /tests\/atlas\/cases\/demo_surface\/input\/app$/
    )
    expect(components.map(component => component.name)).toEqual(
      expect.arrayContaining(['Button', 'AppCard', 'UserBadge'])
    )
  })

  it('can include the case-local library package surface', async () => {
    const components = await getComponents(
      { include: ['@fixtures/demo-ui'] },
      DEMO_SURFACE_CASE
    )

    expect(
      components
        .filter(component => component.source === '@fixtures/demo-ui')
        .map(component => component.name)
    ).toEqual(expect.arrayContaining(['Button', 'Card', 'Badge', 'Stack']))
  })
})

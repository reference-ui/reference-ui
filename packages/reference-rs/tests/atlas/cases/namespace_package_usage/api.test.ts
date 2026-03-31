import { describe, expect, it } from 'vitest'

import { getComponent } from '../../helpers'

const CASE = 'namespace_package_usage'
const DEMO_UI = '@fixtures/demo-ui'

describe('namespace_package_usage atlas case', () => {
  it('counts direct package component usage through a namespace import', async () => {
    const button = await getComponent('Button', { include: [DEMO_UI] }, DEMO_UI, CASE)
    const badge = await getComponent('Badge', { include: [DEMO_UI] }, DEMO_UI, CASE)

    expect(button.count).toBe(2)
    expect(badge.count).toBe(1)
  })

  it('keeps namespace-qualified examples intact', async () => {
    const button = await getComponent('Button', { include: [DEMO_UI] }, DEMO_UI, CASE)

    expect(button.examples[0]).toMatch(/<DemoUi\.Button/)
  })
})
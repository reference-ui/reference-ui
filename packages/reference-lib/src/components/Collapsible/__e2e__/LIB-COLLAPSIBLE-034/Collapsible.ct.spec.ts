/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-DOM-01: Collapsible should add no wrapper around its fixed trigger and content elements', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/NoWrapper')
    const container = page.getByTestId('nowrap-container')
    const trigger = page.getByTestId('nowrap-trigger')
    const content = page.getByTestId('nowrap-content')

    await expect(trigger).toBeVisible()
    await expect(content).toBeVisible()
    expect(await trigger.evaluate(el => el.tagName.toLowerCase())).toBe('button')
    expect(await content.evaluate(el => el.tagName.toLowerCase())).toBe('div')

    const childTags = await container.evaluate(el =>
      Array.from(el.children).map(c => c.getAttribute('data-testid'))
    )
    expect(childTags).toEqual(['nowrap-before', 'nowrap-trigger', 'nowrap-content', 'nowrap-after'])
  })
});

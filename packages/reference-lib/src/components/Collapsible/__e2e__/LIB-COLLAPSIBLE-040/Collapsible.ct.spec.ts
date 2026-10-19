/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-PRES-01: Collapsible should keep transitioning Content mounted until its own exit completes', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')

    await expect(content).toBeVisible()
    await page.getByTestId('probe-close').click()

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveAttribute('data-state', 'closed')

    const heightVar = await content.evaluate(el =>
      getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim()
    )
    expect(heightVar).toMatch(/^[1-9]\d*(\.\d+)?px$/)

    await expect(content).toHaveCount(0, { timeout: 2000 })
  })
});

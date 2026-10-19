/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-PRES-04: Collapsible should cancel an in-flight exit when controlled state reopens', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const content = page.getByTestId('probe-content')

    await expect(content).toBeVisible()
    await page.getByTestId('probe-close').click()
    await expect(content).toHaveAttribute('data-state', 'closed')

    await page.getByTestId('probe-set-open').click()
    await expect(content).toHaveAttribute('data-state', 'open')

    // The stale exit's end event cannot remove the reopened node.
    await content.evaluate(el => el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true })))
    await page.waitForTimeout(400)
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'open')

    const heightVar = await content.evaluate(el =>
      getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim()
    )
    expect(heightVar).toMatch(/^[1-9]/)
  })
});

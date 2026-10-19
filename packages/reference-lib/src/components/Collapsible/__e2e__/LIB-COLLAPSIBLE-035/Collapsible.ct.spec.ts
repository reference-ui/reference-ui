/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-DOM-03: Collapsible should keep its relationship valid throughout a closed exit and remove it after unmount', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ControlledOpen')
    const trigger = page.getByTestId('probe-trigger')
    const content = page.getByTestId('probe-content')

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const contentId = await content.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)

    await page.getByTestId('probe-close').click()

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveAttribute('data-state', 'closed')
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)

    await expect(content).toHaveCount(0, { timeout: 2000 })
    await expect(trigger).not.toHaveAttribute('aria-controls')
  })
});

/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-MOUNT-CT-01: closed hidden-until-found content stays in the DOM, rendering-skipped, and linked', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/UntilFound')
    const trigger = page.getByTestId('uf-trigger')
    const content = page.getByTestId('uf-content')

    await expect(content).toBeVisible()
    await page.getByTestId('uf-close').click()
    await expect(content).toHaveCount(1)
    await expect(content).toBeHidden()
    await expect(content).toHaveAttribute('hidden', 'until-found')
    await expect(content).toHaveAttribute('data-state', 'closed')
    // hidden=until-found skips rendering via content-visibility (display
    // stays; boxes go zero) so find-in-page can still match the text.
    const skipped = await content.evaluate((el) => getComputedStyle(el).contentVisibility)
    expect(skipped).toBe('hidden')
    const contentId = await content.getAttribute('id')
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)

    await trigger.click()
    await expect(content).toBeVisible()
    await expect(content).not.toHaveAttribute('hidden', 'until-found')
  })
});

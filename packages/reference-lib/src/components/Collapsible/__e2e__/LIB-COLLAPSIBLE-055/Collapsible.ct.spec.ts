/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-MOUNT-CT-03: forceMount closed content stays visible and keeps focus inside it', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/ForceMount')
    const trigger = page.getByTestId('fm-trigger')
    const content = page.getByTestId('fm-content')
    const input = page.getByTestId('fm-input')

    await input.focus()
    await expect(input).toBeFocused()
    await page.getByTestId('fm-close').click()

    await expect(content).toHaveCount(1)
    await expect(content).toBeVisible()
    await expect(content).not.toHaveAttribute('hidden', 'until-found')
    await expect(content).toHaveAttribute('data-state', 'closed')
    expect(await content.evaluate((el) => el.hasAttribute('inert'))).toBe(false)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toBeFocused()
  })
});

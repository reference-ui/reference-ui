/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Composition Gates & Browser Proofs', () => {
  test('CO-DEFAULT-OPEN: Starts expanded with defaultOpen and can be collapsed', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/DefaultOpen')
    const defaultOpenRoot = page.getByTestId('collapsible-default-open-root')
    const trigger = page.getByTestId('btn-default-open-trigger')
    const content = page.getByTestId('default-open-content')

    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toBeVisible()

    await page.waitForTimeout(300)
    await snap(page, 'default-open-resting')
    await snap(defaultOpenRoot, 'collapsible-default-open-root', { maxDiffPixelRatio: 0.001 })

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'default-open-collapsed')
    await snap(defaultOpenRoot, 'collapsible-default-open-collapsed', { maxDiffPixelRatio: 0.001 })
  })
});

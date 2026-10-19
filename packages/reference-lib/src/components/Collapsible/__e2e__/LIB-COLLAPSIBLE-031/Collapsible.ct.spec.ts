/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Composition Gates & Browser Proofs', () => {
  test('CO-DOM-01, CO-DOM-02 & CO-DOM-04: Toggles Collapsible open/closed and updates ARIA attributes', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/Basic')
    const trigger = page.getByTestId('btn-collapsible-trigger')
    const content = page.getByTestId('collapsible-content')

    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveCount(0)

    const root = page.getByTestId('collapsible-fixture-root')

    await page.waitForTimeout(300)
    await snap(page, 'resting-closed')
    await snap(root, 'collapsible-root-resting', { maxDiffPixelRatio: 0.001 })
    await snap(trigger, 'collapsible-trigger-resting', { maxDiffPixelRatio: 0.001 })

    // Hover trigger
    await trigger.hover()
    await page.waitForTimeout(200)
    await snap(page, 'hover-trigger')

    // Click to open
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'open')
    await expect(content.getByTestId('collapsible-text')).toHaveText('Detailed collapsible content.')

    const contentId = await content.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)

    await page.waitForTimeout(300)
    await snap(page, 'opened')
    await snap(root, 'collapsible-root-opened', { maxDiffPixelRatio: 0.001 })
    await snap(content, 'collapsible-content-opened', { maxDiffPixelRatio: 0.001 })

    // Click to close
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'closed')
    await snap(root, 'collapsible-root-closed', { maxDiffPixelRatio: 0.001 })
  })
});

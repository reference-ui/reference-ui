/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-COMP-01: A plain Collapsible should provide a complete controlled disclosure without requiring motion CSS', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/FollowClosed')
    const trigger = page.getByTestId('follow-trigger')
    const content = page.getByTestId('follow-content')
    const adjacentInput = page.getByTestId('follow-adjacent-input')

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()

    await trigger.focus()
    await page.keyboard.press('Space')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()

    await page.keyboard.press('Tab')
    await expect(adjacentInput).toBeFocused()
  })
});

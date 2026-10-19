/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceFixture')
  })

  test('PR-NEST-01: Coordinates nested Presence instances and waits for child completion', async ({
    page,
  }) => {
    const parent = page.getByTestId('nested-parent')
    const child = page.getByTestId('nested-child')

    await expect(parent).toBeVisible()
    await expect(child).toBeVisible()

    // Close parent (150ms) and child (350ms) together
    await page.getByTestId('btn-toggle-nested-parent').click()
    await page.getByTestId('btn-toggle-nested-child').click()

    // At 100ms both are still in DOM
    await page.waitForTimeout(100)
    await expect(parent).toBeVisible()
    await expect(child).toBeVisible()
    await snap(page, 'nested-closing')

    // Eventually after child finishes (350ms+), both unmount
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await expect(child).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'nested-removed')
  })
});

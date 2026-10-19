/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence onExitComplete', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceExitCompleteFixture')
  })

  test('PR-EXIT-06: Fires once per Presence when nested parent and child exit together', async ({
    page,
  }) => {
    const parent = page.getByTestId('exit-coord-parent')
    const child = page.getByTestId('exit-coord-child')
    const parentCount = page.getByTestId('exitcount-coord-parent')
    const childCount = page.getByTestId('exitcount-coord-child')

    await expect(parent).toBeVisible()
    await expect(child).toBeVisible()

    await page.getByTestId('btn-toggle-exit-coord-parent').click()
    await page.getByTestId('btn-toggle-exit-coord-child').click()

    await expect(parent).toHaveCount(0, { timeout: 3000 })
    await expect(child).toHaveCount(0, { timeout: 3000 })
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('1')
  })
});

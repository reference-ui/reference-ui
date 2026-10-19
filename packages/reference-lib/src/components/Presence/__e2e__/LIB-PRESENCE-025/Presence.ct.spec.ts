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

  test('PR-EXIT-05: Fires through the born-closed nested wedge (overlay shape)', async ({
    page,
  }) => {
    const parent = page.getByTestId('exit-wedge-parent')
    const parentCount = page.getByTestId('exitcount-wedge-parent')
    const childCount = page.getByTestId('exitcount-wedge-child')

    await expect(parent).toBeVisible()
    await expect(page.getByTestId('exit-wedge-child')).toHaveCount(0)

    await page.getByTestId('btn-toggle-exit-wedge-parent').click()
    await expect(parent).toHaveAttribute('data-state', 'closed')
    await expect(parent).toHaveCount(0, { timeout: 2000 })
    await expect(parentCount).toHaveText('1')
    await expect(childCount).toHaveText('0')
  })
});

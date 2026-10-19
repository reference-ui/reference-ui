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

  test('PR-EXIT-02: Fires onExitComplete for instant exits', async ({ page }) => {
    const box = page.getByTestId('exit-instant-box')
    const count = page.getByTestId('exitcount-instant')
    await expect(box).toBeVisible()

    await page.getByTestId('btn-toggle-exit-instant').click()
    await expect(box).toHaveCount(0)
    await expect(count).toHaveText('1')
  })
});

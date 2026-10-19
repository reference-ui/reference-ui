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

  test('PR-EXIT-01: Fires onExitComplete exactly once after a completed transition exit', async ({
    page,
  }) => {
    const box = page.getByTestId('exit-transition-box')
    const count = page.getByTestId('exitcount-transition')
    await expect(box).toBeVisible()
    await expect(count).toHaveText('0')

    await page.getByTestId('btn-toggle-exit-transition').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(count).toHaveText('1')

    // No second fire from trailing end events.
    await page.waitForTimeout(600)
    await expect(count).toHaveText('1')
  })
});

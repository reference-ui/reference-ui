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

  test('PR-EXIT-03: Does not fire onExitComplete on interrupted exits', async ({
    page,
  }) => {
    const box = page.getByTestId('exit-interrupt-box')
    const count = page.getByTestId('exitcount-interrupt')
    await expect(box).toBeVisible()

    await page.getByTestId('btn-toggle-exit-interrupt').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-exit-interrupt').click()

    await expect(box).toHaveAttribute('data-state', 'open')
    await page.waitForTimeout(500)
    await expect(box).toBeVisible()
    await expect(count).toHaveText('0')

    // The next completed exit still fires exactly once.
    await page.getByTestId('btn-toggle-exit-interrupt').click()
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(count).toHaveText('1')
  })
});

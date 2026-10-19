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

  test('PR-ANIMATION-01: Retains closing child during CSS animation and removes after completion', async ({
    page,
  }) => {
    const animationBox = page.getByTestId('animation-box')
    await expect(animationBox).toBeVisible()
    await expect(animationBox).toHaveAttribute('data-state', 'open')

    await page.getByTestId('btn-toggle-animation').click()

    await expect(animationBox).toHaveAttribute('data-state', 'closed')
    await expect(animationBox).toBeVisible()
    await snap(page, 'animation-closing')

    await expect(animationBox).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'animation-removed')
  })
});

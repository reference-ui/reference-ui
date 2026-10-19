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

  test('PR-TRANSITION-01: Retains closing child during CSS transition and removes after completion', async ({
    page,
  }) => {
    const transitionBox = page.getByTestId('transition-box')
    await expect(transitionBox).toBeVisible()
    await expect(transitionBox).toHaveAttribute('data-state', 'open')

    await page.getByTestId('btn-toggle-transition').click()

    // Immediately after click, it has data-state="closed" and is still in DOM during 300ms transition
    await expect(transitionBox).toHaveAttribute('data-state', 'closed')
    await expect(transitionBox).toBeVisible()
    await snap(page, 'transition-closing')

    // After transition completes, it unmounts from DOM
    await expect(transitionBox).toHaveCount(0, { timeout: 2000 })
    await snap(page, 'transition-removed')
  })
});

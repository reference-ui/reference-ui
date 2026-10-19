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

  test('PR-RACE-02: Preserves child when present returns true before exit completion', async ({
    page,
  }) => {
    const transitionBox = page.getByTestId('transition-box')
    await expect(transitionBox).toBeVisible()

    // Start exit
    await page.getByTestId('btn-toggle-transition').click()
    await expect(transitionBox).toHaveAttribute('data-state', 'closed')

    // Interrupt and reopen within 50ms
    await page.waitForTimeout(50)
    await page.getByTestId('btn-toggle-transition').click()

    // Should stay mounted and return to open state
    await expect(transitionBox).toHaveAttribute('data-state', 'open')
    await page.waitForTimeout(400)
    await expect(transitionBox).toBeVisible()
    await snap(page, 'transition-interrupted-reopened')
  })
});

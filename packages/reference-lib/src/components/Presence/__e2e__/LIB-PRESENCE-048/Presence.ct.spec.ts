/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence mixed and interrupted lifecycles', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceRaceFixture')
  })

  test('PR-RACE-01: Waits for both effect types when a closing child runs a transition and an animation', async ({
    page,
  }) => {
    const box = page.getByTestId('race-r01')
    await page.getByTestId('btn-toggle-r01').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    // The 200ms transition completes while the 400ms animation still runs.
    await page.waitForTimeout(250)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })
});

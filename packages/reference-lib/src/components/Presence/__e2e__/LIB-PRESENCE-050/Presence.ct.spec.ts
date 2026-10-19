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

  test('PR-RACE-04: Ignores an entering animation completion when it races with a close commit', async ({
    mount,
    page,
  }) => {
    // Fresh mount so the 500ms enter animation is still running at close.
    await mount('components/Presence/Presence/PresenceRaceFixture')
    const box = page.getByTestId('race-r04')
    await expect(box).toBeVisible()
    await page.getByTestId('btn-toggle-r04').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await box.evaluate(el =>
      el.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'raceEnter' }))
    )
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })
});

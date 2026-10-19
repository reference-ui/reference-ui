/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence CSS animation exits', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceAnimationFixture')
  })

  test('PR-ANIMATION-03: Waits for all finite animations when a closing child runs more than one', async ({
    page,
  }) => {
    const box = page.getByTestId('anim-a03')
    await page.getByTestId('btn-toggle-a03').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await box.evaluate(el =>
      el.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'animFadeOut' }))
    )
    await expect(box).toHaveCount(1)
    // The real 200ms fade ends while the 400ms slide still runs.
    await page.waitForTimeout(250)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })
});

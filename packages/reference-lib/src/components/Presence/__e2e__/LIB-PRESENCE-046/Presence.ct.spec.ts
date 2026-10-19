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

  test('PR-ANIMATION-06: Ignores a descendant animation completion when the observed child is still exiting', async ({
    page,
  }) => {
    const box = page.getByTestId('anim-a06')
    await page.getByTestId('btn-toggle-a06').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page
      .getByTestId('anim-a06-child')
      .evaluate(el =>
        el.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'animSlideOut' }))
      )
    await expect(box).toHaveCount(1)
    // The descendant's real 100ms animation ends while the parent still runs.
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(page.getByTestId('anim-a06-child')).toHaveCount(0)
  })
});

/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence CSS transition exits', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceTransitionFixture')
  })

  test('PR-TRANSITION-04: Ignores descendant transition events when it observes a transitioning parent child', async ({
    page,
  }) => {
    const box = page.getByTestId('trans-t04')
    await page.getByTestId('btn-toggle-t04').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page
      .getByTestId('trans-t04-child')
      .evaluate(el => el.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true })))
    await expect(box).toHaveCount(1)
    // The descendant's real 100ms transition ends while the parent still runs.
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(page.getByTestId('trans-t04-child')).toHaveCount(0)
  })
});

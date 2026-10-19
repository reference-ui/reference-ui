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

  test('PR-ANIMATION-04: Removes immediately when the animation name does not change for the closed state', async ({
    page,
  }) => {
    const btn = page.getByTestId('btn-toggle-a04')
    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    const absent = await page.evaluate(() => !document.querySelector('[data-testid="anim-a04"]'))
    expect(absent).toBe(true)
  })
});

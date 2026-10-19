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

  test('PR-ANIMATION-05: Completes a suspended exit when the observed animation is canceled', async ({
    page,
  }) => {
    const handle = await page.$('[data-testid="anim-a05"]')
    await page.getByTestId('btn-toggle-a05').click()
    await expect(page.getByTestId('anim-a05')).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(100)
    await page.getByTestId('anim-a05').evaluate(el => ((el as HTMLElement).style.animation = 'none'))
    await expect(page.getByTestId('anim-a05')).toHaveCount(0, { timeout: 2000 })
    await handle!.evaluate(el =>
      el.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'animFadeOut' }))
    )
    await page.waitForTimeout(200)
    await expect(page.getByTestId('anim-a05')).toHaveCount(0)
  })
});

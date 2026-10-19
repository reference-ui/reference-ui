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

  test('PR-ANIMATION-02: Avoids a final-frame flash when an exit animation has delay, iterations, and fill mode', async ({
    page,
  }) => {
    const box = page.getByTestId('anim-a02')
    await page.getByTestId('btn-toggle-a02').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(50)
    await expect(box).toHaveCount(1)
    await page.waitForTimeout(100)
    await expect(box).toHaveCount(1)
    const fill = await box.evaluate(el => getComputedStyle(el).animationFillMode)
    expect(fill).toBe('backwards')
    await page.waitForTimeout(100)
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
  })
});

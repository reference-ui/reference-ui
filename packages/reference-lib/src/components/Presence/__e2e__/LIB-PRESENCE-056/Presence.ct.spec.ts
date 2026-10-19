/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence composition gates', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceCompFixture')
  })

  test('PR-COMP-02: Retains a drawer composition when its closed state uses a transform transition', async ({
    page,
  }) => {
    const box = page.getByTestId('comp-c02')
    const count = page.getByTestId('compcount-c02')
    await page.getByTestId('btn-toggle-c02').click()
    await expect(box).toHaveAttribute('data-state', 'closed')
    // Past the 100ms delay and mid-flight: the drawer holds its closed position.
    await page.waitForTimeout(150)
    await expect(box).toHaveCount(1)
    const transform = await box.evaluate(el => getComputedStyle(el).transform)
    expect(transform).not.toBe('none')

    await page
      .getByTestId('comp-c02-inner')
      .evaluate(el =>
        el.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'compInner' }))
      )
    await expect(box).toHaveCount(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })
    await expect(count).toHaveText('1')
  })
});

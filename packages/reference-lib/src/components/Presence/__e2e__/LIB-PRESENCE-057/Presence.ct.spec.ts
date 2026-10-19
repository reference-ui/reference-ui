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

  test('PR-COMP-03: Preserves a reopened composition when reduced motion makes an interrupted exit instantaneous', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
    const box = page.getByTestId('comp-c03')
    const count = page.getByTestId('compcount-c03')
    const btn = page.getByTestId('btn-toggle-c03')

    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    await expect(box).toHaveCount(0)
    await expect(count).toHaveText('1')

    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    await expect(box).toBeVisible()
    await expect(count).toHaveText('1')

    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    await expect(box).toHaveCount(0)
    await expect(count).toHaveText('2')
  })
});

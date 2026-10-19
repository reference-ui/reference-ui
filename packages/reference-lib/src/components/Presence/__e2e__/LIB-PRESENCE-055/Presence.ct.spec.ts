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

  test('PR-COMP-01: Retains a fading composition when it exits through CSS keyframes', async ({
    page,
  }) => {
    const slotChildren = await page.getByTestId('comp-c01-slot').evaluate(el => el.childElementCount)
    expect(slotChildren).toBe(1)
    await page.getByTestId('comp-c01').evaluate(el => ((el as any).__mark = 'authored'))

    await page.getByTestId('btn-toggle-c01').click()
    const box = page.getByTestId('comp-c01')
    await expect(box).toHaveAttribute('data-state', 'closed')
    await page.waitForTimeout(100)
    const mark = await box.evaluate(el => (el as any).__mark)
    expect(mark).toBe('authored')
    const midOpacity = await box.evaluate(el => parseFloat(getComputedStyle(el).opacity))
    expect(midOpacity).toBeLessThan(1)
    await expect(box).toHaveCount(0, { timeout: 2000 })

    // StrictMode double-invokes ref callbacks (React 18/19), so assert
    // symmetry: every attachment cleaned up exactly once, one final removal.
    const log = await page.evaluate(() => (window as any).__c01log as string[])
    const attaches = log.filter(e => e === 'attach').length
    const detaches = log.filter(e => e === 'detach').length
    expect(attaches).toBeGreaterThanOrEqual(1)
    expect(detaches).toBe(attaches)
  })
});

/**
 * Presence browser proof: exit lifecycles end to end. Renders the story
 * fixtures to pin instant removal, CSS transition and animation retention,
 * reopen races, nested coordination (including born-closed and mid-exit
 * children), and coordinated multi-part completion.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Presence immediate removal', () => {
  test.beforeEach(async ({ mount }) => {
    await mount('components/Presence/Presence/PresenceInstantFixture')
  })

  test('PR-INSTANT-05: Removes immediately when reduced-motion CSS computes every exit duration to zero', async ({
    page,
  }) => {
    // Control: without emulation the exit is a finite 300ms transition.
    const openDuration = await page
      .getByTestId('instant-i05')
      .evaluate(el => getComputedStyle(el).transitionDuration)
    expect(openDuration).toBe('0.3s')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches)

    // The media rule zeroes the closed duration from computed style alone
    // (Presence has no JS media-query branch for CSS). The harness floors
    // emulated durations at 10us instead of exactly 0s, so Presence — which
    // correctly treats any finite duration as finite — suspends for ~10us;
    // the exit still beats the 300ms natural duration by a wide margin.
    const closedDuration = await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.className = 'i05'
      probe.setAttribute('data-state', 'closed')
      document.body.appendChild(probe)
      const d = getComputedStyle(probe).transitionDuration
      probe.remove()
      return d
    })
    expect(parseFloat(closedDuration)).toBeLessThan(0.001)

    const btn = page.getByTestId('btn-toggle-i05')
    await btn.click()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    await page.waitForTimeout(100)
    const absent = await page.evaluate(() => !document.querySelector('[data-testid="instant-i05"]'))
    expect(absent).toBe(true)
  })
});

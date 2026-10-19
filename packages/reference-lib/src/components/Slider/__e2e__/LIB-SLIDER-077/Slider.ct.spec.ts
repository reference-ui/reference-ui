/**
 * Slider browser proof: parts, sessions, and focus rings. Renders the
 * story fixtures to pin part anatomy and clamped ARIA, keyboard and
 * pointer value changes, track-press thumb choice, RTL and vertical
 * mapping, session lifecycles, StrictMode and ShadowRoot behavior, and
 * keyboard-only focus-ring parity.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Slider pins', () => {
  test('SD-END-02: merges native key repeats into one interaction', async ({ mount, page }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 100 })
    const thumb = page.getByTestId('logged-thumb-0')
    await thumb.focus()

    // One native press: one request, one end on the matching keyup.
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('logged-changes')).toHaveText('[21]')
    await expect(page.getByTestId('logged-ends')).toHaveText('[21]')

    // An OS-style repeat stream (synthetic repeats, real handlers): four
    // requests, exactly one end carrying the last candidate. Frame gaps
    // between dispatches mirror real repeats (separate tasks, flushed).
    await page.evaluate(async () => {
      const t = document.querySelector('[data-testid="logged-thumb-0"]')!
      const tick = () => new Promise<void>(r => requestAnimationFrame(() => setTimeout(() => r(), 0)))
      t.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
      for (let i = 0; i < 3; i++) {
        await tick()
        t.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true, repeat: true })
        )
      }
    })
    await expect(page.getByTestId('logged-changes')).toHaveText('[21,22,23,24,25]')
    await page.evaluate(() => {
      document
        .querySelector('[data-testid="logged-thumb-0"]')!
        .dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }))
    })
    await expect(page.getByTestId('logged-ends')).toHaveText('[21,25]')
  })
});

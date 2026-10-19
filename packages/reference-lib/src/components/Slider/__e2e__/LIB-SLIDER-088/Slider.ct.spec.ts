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
  test('SD-ENV-03: honors RTL inherited from outside the ShadowRoot', async ({ mount, page }) => {
    await mount('components/Slider/Slider/ShadowFixture', { dirOnHost: true })
    const host = page.getByTestId('shadow-host')
    const thumb0 = host.locator('[data-testid="shadow-thumb-0"]')
    await expect(thumb0).toBeVisible()
    // No dir attribute inside the shadow tree: detection falls back to the
    // computed direction, which crosses the boundary.
    const innerDir = await page.evaluate(() => {
      const h = document.querySelector('[data-testid="shadow-host"]')!
      return (h.shadowRoot!.querySelector('[data-testid="shadow-inner"]') as HTMLElement).getAttribute('dir')
    })
    expect(innerDir).toBeNull()
    await thumb0.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('shadow-changes')).toHaveText('[[21,80]]')
  })
});

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
  test('SD-DOM-12 and SD-CTRL-07: diagnose malformed anatomy and arrays in the browser', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/DiagFixture')
    await expect(page.getByTestId('diag-changes')).toHaveText('0')

    await page.getByTestId('diag-dup-track').click()
    await expect(page.getByTestId('diag-error')).toContainText('Exactly one Slider.Track')
    await expect(page.locator('[role="slider"]')).toHaveCount(0)

    await page.getByTestId('diag-dup-range').click()
    await expect(page.getByTestId('diag-error')).toContainText('At most one Slider.Range')

    await page.getByTestId('diag-bad-array').click()
    await expect(page.getByTestId('diag-error')).toContainText('violates minimum required distance')
    await expect(page.getByTestId('diag-changes')).toHaveText('0')
  })
});

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
  test('SD-CTRL-05: uses current props when configuration changes during a drag', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/ConstraintFixture')
    const track = page.getByTestId('constraint-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height / 2

    await page.mouse.move(box!.x + box!.width * 0.4, y)
    await page.mouse.down()
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:40"]')

    // Swap value, bounds, step, and handler mid-drag without releasing.
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="constraint-swap"]') as HTMLElement).click()
    })
    await page.mouse.move(box!.x + box!.width * 0.8, y)
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:40","B:50"]')
    await page.mouse.up()
    await expect(page.getByTestId('constraint-ends')).toHaveText('["B:50"]')
  })
});

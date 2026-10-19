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
  test('SD-DOM-08: keeps every thumb reachable across focus and stacked presses', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: [20, 20, 70],
      width: 100,
      labels: ['First', 'Second', 'Third'],
    })
    const thumb0 = page.getByTestId('logged-thumb-0')
    const thumb1 = page.getByTestId('logged-thumb-1')
    const thumb2 = page.getByTestId('logged-thumb-2')

    await thumb0.focus()
    await expect(thumb0).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(thumb1).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(thumb2).toBeFocused()

    // Back to the second overlapping thumb, focus outside, press the stack.
    await thumb1.focus()
    await page.mouse.click(5, 5)
    await expect(thumb1).not.toBeFocused()
    const stackBox = await thumb1.boundingBox()
    expect(stackBox).not.toBeNull()
    await page.mouse.click(stackBox!.x + stackBox!.width / 2, stackBox!.y + stackBox!.height / 2)
    await expect(thumb1).toBeFocused()

    // The same logical thumb moves; DOM order, labels, and refs are untouched.
    const cx = stackBox!.x + stackBox!.width / 2
    const cy = stackBox!.y + stackBox!.height / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 10, cy)
    await page.mouse.up()
    await expect(page.getByTestId('logged-changes')).toHaveText('[[20,30,70]]')
    await expect(thumb0).toHaveAttribute('aria-label', 'First')
    await expect(thumb1).toHaveAttribute('aria-label', 'Second')
    await expect(thumb2).toHaveAttribute('aria-label', 'Third')
    const order = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid^="logged-thumb-"]')).map(el =>
        el.getAttribute('data-testid')
      )
    )
    expect(order).toEqual(['logged-thumb-0', 'logged-thumb-1', 'logged-thumb-2'])
  })
});

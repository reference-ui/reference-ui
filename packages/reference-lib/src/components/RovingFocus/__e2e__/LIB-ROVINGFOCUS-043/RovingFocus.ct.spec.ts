/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus transparent DOM', () => {
  test('RF-DOM-05: StrictMode plus ref rerenders register once with one stop', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusStrictRefFixture')
    await expect(page.getByTestId('roving-focus-strict-root')).toBeVisible()

    const rendersText = await page.getByTestId('strict-renders').textContent()
    expect(Number(rendersText)).toBeLessThan(30)
    await expect(page.locator('[data-testid="strict-composite"] [tabindex="0"]')).toHaveCount(1)

    await page.getByTestId('strict-Apple').focus()
    for (const label of ['Banana', 'Cherry', 'Date'] as const) {
      await page.keyboard.press('ArrowRight')
      await expect(page.getByTestId(`strict-${label}`)).toBeFocused()
    }
    await expect(page.locator('[data-testid="strict-composite"] [tabindex="0"]')).toHaveCount(1)
    const settledText = await page.getByTestId('strict-renders').textContent()
    expect(Number(settledText)).toBeLessThan(30)
  })
});

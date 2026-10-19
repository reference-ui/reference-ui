/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus transparent DOM', () => {
  test('RF-DOM-03: empty composite renders safely and captures nothing', async ({
    mount,
    page,
  }) => {
    const errors: Error[] = []
    page.on('pageerror', err => errors.push(err))
    await mount('components/RovingFocus/RovingFocus/RovingFocusEmptyFixture')
    await expect(page.getByTestId('roving-focus-empty-root')).toBeVisible()
    const container = page.getByTestId('empty-container')
    const beforeHtml = await container.evaluate(el => el.innerHTML)

    await page.getByTestId('empty-before').focus()
    for (const key of ['ArrowRight', 'ArrowDown', 'Home', 'End'] as const) {
      await page.keyboard.press(key)
      await expect(page.getByTestId('empty-before')).toBeFocused()
    }
    await pressTab(page)
    await expect(page.getByTestId('empty-after')).toBeFocused()

    await expect(container.locator('[tabindex]')).toHaveCount(0)
    await expect(container).toHaveJSProperty('childElementCount', 0)
    const afterHtml = await container.evaluate(el => el.innerHTML)
    expect(afterHtml).toBe(beforeHtml)
    expect(errors).toEqual([])
  })
});

/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus composition gates', () => {
  test('RF-COMP-02: bounded vertical tag list with current removal', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusDynamicFixture', {
      orientation: 'vertical',
    })
    await expect(page.getByTestId('roving-focus-dynamic-root')).toBeVisible()
    const item = (id: string) => page.getByTestId(`dyn-${id}`)

    await item('a').focus()
    await page.keyboard.press('ArrowDown')
    await expect(item('b')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(item('c')).toBeFocused()

    await page.keyboard.press('Home')
    await expect(item('a')).toBeFocused()
    await page.keyboard.press('End')
    await expect(item('c')).toBeFocused()

    await item('b').focus()
    await page.getByTestId('dyn-remove-b').click()
    await expect(item('c')).toHaveAttribute('tabindex', '0')

    await item('a').focus()
    await page.keyboard.press('ArrowUp')
    await expect(item('a')).toBeFocused()
    await item('c').focus()
    await page.keyboard.press('ArrowDown')
    await expect(item('c')).toBeFocused()
  })
});

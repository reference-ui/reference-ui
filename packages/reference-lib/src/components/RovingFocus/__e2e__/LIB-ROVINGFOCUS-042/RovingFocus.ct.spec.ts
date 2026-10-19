/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus transparent DOM', () => {
  test('RF-DOM-04: navigation tracks insert, reorder, and remove in DOM order', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusDynamicFixture')
    await expect(page.getByTestId('roving-focus-dynamic-root')).toBeVisible()
    const item = (id: string) => page.getByTestId(`dyn-${id}`)

    await item('a').focus()
    await page.keyboard.press('ArrowRight')
    await expect(item('b')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(item('c')).toBeFocused()

    await page.getByTestId('dyn-insert').click()
    await item('a').focus()
    for (const id of ['b', 'd', 'c'] as const) {
      await page.keyboard.press('ArrowRight')
      await expect(item(id)).toBeFocused()
    }

    await page.getByTestId('dyn-reorder').click()
    await item('c').focus()
    for (const id of ['d', 'b', 'a'] as const) {
      await page.keyboard.press('ArrowRight')
      await expect(item(id)).toBeFocused()
    }

    await page.getByTestId('dyn-remove-b').click()
    await expect(item('b')).toHaveCount(0)
    await item('c').focus()
    await page.keyboard.press('ArrowRight')
    await expect(item('d')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(item('a')).toBeFocused()
  })
});

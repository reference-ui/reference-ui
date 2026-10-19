/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus typeahead browser behavior', () => {
  test('RF-TYPE-01: typeahead off leaves printable keys and Space untouched', async ({
    mount,
    page,
  }) => {
    const variants = [{}, { typeahead: false }] as const
    for (let i = 0; i < variants.length; i++) {
      const component = await mount(
        'components/RovingFocus/RovingFocus/RovingFocusLabelsFixture',
        variants[i]
      )
      await expect(page.getByTestId('roving-focus-labels-root')).toBeVisible()
      const bravo = page.getByTestId('labels-bravo')

      await bravo.focus()
      await page.keyboard.press('b')
      await expect(bravo).toBeFocused()
      await expect(bravo).toHaveAttribute('tabindex', '0')

      await page.keyboard.press('Space')
      await expect(page.getByTestId('labels-activation-count')).toHaveText('1')
      await expect(bravo).toBeFocused()
      if (i < variants.length - 1) await component.unmount()
    }
  })
});

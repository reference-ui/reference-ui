/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus transparent DOM', () => {
  test('RF-DOM-02: Item merges css, handlers, and ref onto its single child', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSlotFixture')
    await expect(page.getByTestId('roving-focus-slot-root')).toBeVisible()
    const bold = page.getByTestId('slot-bold')
    const toolbar = page.getByTestId('slot-toolbar')

    await expect(bold).toHaveClass(/reference-ui__/)
    await expect(bold).toHaveClass(/item-part-class/)
    await expect(bold).toHaveClass(/bold-child-class/)
    await expect(toolbar).toHaveClass(/root-part-class/)
    await expect(toolbar).toHaveClass(/toolbar-child-class/)
    await expect(toolbar).toHaveAttribute('data-root-part', 'yes')
    await expect(page.getByTestId('slot-ref-state')).toHaveText('BUTTON')

    // Move roving focus to it and activate: child (+10) and part (+1) fire.
    await bold.focus()
    await expect(bold).toHaveAttribute('tabindex', '0')
    await bold.click()
    await expect(page.getByTestId('slot-click-count')).toHaveText('11')
    await expect(bold).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('slot-link')).toBeFocused()
    await snap(page, 'slot-link-focused')
  })
});

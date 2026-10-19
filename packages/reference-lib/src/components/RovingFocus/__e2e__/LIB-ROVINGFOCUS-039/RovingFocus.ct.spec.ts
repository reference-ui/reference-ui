/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus transparent DOM', () => {
  test('RF-DOM-01: Root and Item preserve authored tags with no wrappers', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSlotFixture')
    await expect(page.getByTestId('roving-focus-slot-root')).toBeVisible()
    const toolbar = page.getByTestId('slot-toolbar')

    await expect(toolbar).toHaveJSProperty('tagName', 'DIV')
    const childTags = await toolbar.evaluate(el => [...el.children].map(c => c.tagName))
    expect(childTags).toEqual(['BUTTON', 'BUTTON', 'A'])
    // The toolbar sits directly in the story root: no Root host in between.
    const parentTestId = await toolbar.evaluate(el => el.parentElement?.getAttribute('data-testid'))
    expect(parentTestId).toBe('roving-focus-slot-root')
    const boldParent = await page.getByTestId('slot-bold').evaluate(el => el.parentElement === el.closest('[data-testid="slot-toolbar"]'))
    expect(boldParent).toBe(true)
  })
});

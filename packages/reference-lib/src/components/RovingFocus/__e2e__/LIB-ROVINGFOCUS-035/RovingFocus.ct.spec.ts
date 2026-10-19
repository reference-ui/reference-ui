/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus tab stops and currentness', () => {
  test('RF-TAB-05: unrelated rerenders preserve the current Item and nodes', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture')
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const d = page.getByTestId('keys-d')

    await d.focus()
    await d.evaluate(el => el.setAttribute('data-marked', 'yes'))

    // Synthetic click: rerenders the parent without moving DOM focus (a real
    // click would focus the button itself).
    await page.getByTestId('keys-rerender').dispatchEvent('click')
    await expect(page.getByTestId('keys-rerender')).toHaveText('Rerender 1')
    await expect(page.locator('[data-testid="keys-d"][data-marked="yes"]')).toBeVisible()
    await expect(d).toBeFocused()
    await expect(d).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('keys-a')).toHaveAttribute('tabindex', '-1')
    await expect(page.getByTestId('keys-b')).toHaveAttribute('tabindex', '-1')
  })
});

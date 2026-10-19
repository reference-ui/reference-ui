/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus one-dimensional keys', () => {
  test('RF-KEY-10: dir changes apply without remounting', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', { dir: 'ltr' })
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const b = page.getByTestId('keys-b')
    const d = page.getByTestId('keys-d')

    await b.focus()
    await expect(b).toBeFocused()
    await b.evaluate(el => el.setAttribute('data-marked', 'yes'))

    await page.getByTestId('keys-toggle-dir').click()
    await expect(page.getByTestId('keys-toggle-dir')).toHaveText('Dir: rtl')
    // Same node (no remount), same current item — then RTL arrows apply.
    await expect(page.locator('[data-testid="keys-b"][data-marked="yes"]')).toBeVisible()
    await expect(b).toHaveAttribute('tabindex', '0')
    await b.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(d).toBeFocused()
  })
});

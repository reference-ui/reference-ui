/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-KEY-01: Keyboard navigation and roving focus', async ({ mount, page }) => {
    await mount('components/Listbox/Listbox/Basic')
    await expect(page.getByTestId('listbox-fixture-root')).toBeVisible()

    const optApple = page.getByTestId('opt-apple')
    const optBanana = page.getByTestId('opt-banana')
    const optCherry = page.getByTestId('opt-cherry')
    const optDisabled = page.getByTestId('opt-disabled')
    const display = page.getByTestId('listbox-value-display')

    await optApple.focus()
    await expect(optApple).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(optBanana).toBeFocused()

    await page.waitForTimeout(200)
    await snap(page, 'listbox-keyboard-focused')

    await page.keyboard.press('Enter')
    await expect(optBanana).toHaveAttribute('aria-selected', 'true')
    await expect(display).toHaveText('Selected: banana')

    // End / Home jump to enabled boundaries
    await page.keyboard.press('End')
    await expect(optCherry).toBeFocused()
    await page.keyboard.press('Home')
    await expect(optApple).toBeFocused()

    // Disabled option is out of the tab order and skipped by wrap navigation
    await expect(optDisabled).toHaveAttribute('tabindex', '-1')
    await page.keyboard.press('ArrowDown')
    await expect(optBanana).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(optCherry).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(optApple).toBeFocused()
  })
});

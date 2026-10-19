/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-VIRT-08: Virtual Listbox should preserve logical metadata and active visibility through resize', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/VirtualResize')
    await expect(page.getByTestId('vrz-root')).toBeVisible()

    const opt2 = page.getByTestId('vrz-opt-2')
    await opt2.focus()
    await expect(opt2).toHaveAttribute('aria-setsize', '50')
    await expect(opt2).toHaveAttribute('aria-posinset', '3')

    // Viewport resize + application window recalculation
    await page.getByTestId('vrz-recalc').click()
    await expect(opt2).toBeFocused()
    expect(await opt2.evaluate(el => el.getAttribute('data-value'))).toBe('item-2')
    await expect(opt2).toHaveAttribute('aria-setsize', '50')
    await expect(opt2).toHaveAttribute('aria-posinset', '3')
    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    // Navigation past the recalculated window still requests + mounts
    await page.getByTestId('vrz-opt-5').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vrz-scroll-log')).toHaveText('[6]')
    await page.getByTestId('vrz-mount-5-10').click()
    await expect(page.getByTestId('vrz-opt-6')).toBeFocused()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })
});

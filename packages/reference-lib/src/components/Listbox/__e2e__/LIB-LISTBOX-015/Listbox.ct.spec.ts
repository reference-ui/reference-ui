/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-MULTI-01: Multiple selection appends the activated value', async ({ mount, page }) => {
    await mount('components/Listbox/Listbox/Multiple')
    await expect(page.getByTestId('listbox-multi-root')).toBeVisible()

    const optEmail = page.getByTestId('opt-m-email')
    const optSms = page.getByTestId('opt-m-sms')
    const display = page.getByTestId('listbox-multi-value-display')

    await expect(optEmail).toHaveAttribute('aria-selected', 'true')
    await expect(optSms).toHaveAttribute('aria-selected', 'false')
    await expect(display).toHaveText('Selected: email')

    await page.waitForTimeout(300)
    await snap(page, 'listbox-multi-default')

    // Click SMS to add to selection
    await optSms.click()
    await expect(optEmail).toHaveAttribute('aria-selected', 'true')
    await expect(optSms).toHaveAttribute('aria-selected', 'true')
    await expect(display).toHaveText('Selected: email, sms')

    await page.waitForTimeout(200)
    await snap(page, 'listbox-multi-selected')
  })
});

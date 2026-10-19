/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Combobox reconciliation CT', () => {
  test('FI-COMP-04 Combobox side: token picker commits one scalar value; chip removal is silent', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TokenPicker')

    const opener = page.getByTestId('token-opener')
    await expect(opener).toHaveAttribute('type', 'button')
    await expect(opener).not.toHaveAttribute('role', 'combobox')
    const labelFor = await page.locator('label[for="people"]').getAttribute('for')
    expect(labelFor).toBe('people')

    await opener.click()
    const input = page.getByTestId('token-input')
    await expect(input).toBeFocused()
    const popover = page.getByTestId('token-popover')
    await expect(popover).toBeVisible()
    const listInsideField = await page.evaluate(() => {
      const field = document.querySelector('[data-testid="token-field"]')!
      const list = document.querySelector('[data-testid="token-popover"] [role="listbox"]')!
      return field.contains(list)
    })
    expect(listInsideField).toBe(false)

    await page.getByTestId('token-opt-grace').click()
    await expect(page.getByTestId('token-change-count')).toHaveText('1')
    await expect(page.getByTestId('token-value')).toHaveText('grace')
    const chip = page.getByTestId('chip-grace')
    await expect(chip).toBeVisible()
    await expect(chip).toHaveText('Grace')
    expect(await chip.evaluate(el => el.tagName)).toBe('BUTTON')
    // The popover carries no token nodes; chips are application chrome in Field.
    expect(await popover.locator('[data-testid^="chip-"]').count()).toBe(0)

    await chip.click()
    await expect(page.getByTestId('chip-grace')).toHaveCount(0)
    await expect(page.getByTestId('token-change-count')).toHaveText('1')
  })
});

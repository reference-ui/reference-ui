/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('Async loading: busy collection and shared-announcer status, no private live region', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/LoadingLog')

    const input = page.getByTestId('ld-input')
    const popover = page.getByTestId('ld-popover')
    const listbox = page.getByTestId('ld-listbox')
    const polite = page.locator('[data-reference-announcer="polite"]')
    await input.click()
    await expect(popover).toBeVisible()

    // Loading marks the nested listbox busy until it resolves.
    await expect(listbox).not.toHaveAttribute('aria-busy', 'true')
    await page.getByTestId('ld-loading').click()
    await expect(listbox).toHaveAttribute('aria-busy', 'true')
    await page.getByTestId('ld-loading').click()
    await expect(listbox).not.toHaveAttribute('aria-busy', 'true')

    // Empty collections announce once through the shared announcer.
    await page.getByTestId('ld-clear').click()
    await expect(polite).toHaveText('No options available')

    // Unmatched text switches the message to no-results, still once.
    await input.fill('zzz')
    await expect(polite).toHaveText('No results found')

    // An authored Empty node speaks for itself: suppression, and never
    // a Combobox-owned live region inside the popover.
    await page.getByTestId('ld-empty').click()
    await page.getByTestId('ld-fill').click()
    await page.getByTestId('ld-clear').click()
    await page.waitForTimeout(300)
    await expect(polite).not.toHaveText('No options available')
    await expect(popover.locator('[aria-live]')).toHaveCount(1)
    await expect(popover.locator('[data-testid="ld-empty-node"]')).toHaveCount(1)
  })
});

/**
 * Tree composition gates and browser proofs. Pins hierarchy rendering,
 * controlled selection and expansion with deterministic emission, APG
 * keyboard traversal with RTL mirroring, typeahead over the visible set,
 * dynamic recovery, Combobox bridge commits and virtual focus, ShadowRoot
 * traversal, and an accessibility-clean sweep.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Tree parity', () => {
  test('TR-EXPAND-09: Tree should keep a disabled branch expansion-controlled while allowing independently enabled descendants', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('toggle-ancestor-disabled').click()
    const disabledBranch = page.getByTestId('tree-item-disabled-branch')
    await expect(disabledBranch).toHaveAttribute('aria-disabled', 'true')

    await page.getByTestId('set-expanded-multi').click()
    const child = page.getByTestId('tree-item-child-under-disabled')
    await expect(child).not.toHaveAttribute('aria-disabled')
    await child.focus()
    await expect(child).toBeFocused()

    // Expander and arrow actions on the disabled branch request nothing
    const logBefore = await page.getByTestId('tree-expansion-log').textContent()
    // Forced: Playwright treats aria-disabled descendants as unactionable,
    // but the pointer event itself must still be ignored by the component.
    await page.getByTestId('expander-disabled-branch').click({ force: true })
    await expect(disabledBranch).toHaveAttribute('aria-expanded', 'true')
    await disabledBranch.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('tree-expansion-log')).toHaveText(logBefore ?? '')
  })
});

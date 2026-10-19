/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Combobox cluster B CT', () => {
  test('CB-REVERT-02: onEscape runs first; preventDefault stops revert and dismissal', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/EscapeLog')
    const input = page.getByTestId('esc-input')

    // Passing hook: escape runs first, then the documented revert + dismiss.
    await input.click()
    await input.fill('AlphaZ')
    await clickNoFocus(page, 'esc-clear')
    await input.press('Escape')
    expect(await logOf(page, 'esc-log')).toEqual(['escape:Escape', 'input:Alpha', 'dismiss'])
    await expect(input).toHaveAttribute('aria-expanded', 'false')

    // Preventing hook: nothing follows, open DOM stays controlled.
    await clickNoFocus(page, 'esc-toggle')
    await input.click()
    await input.fill('AlphaZ')
    await clickNoFocus(page, 'esc-clear')
    await input.press('Escape')
    expect(await logOf(page, 'esc-log')).toEqual(['escape:Escape'])
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('esc-popover')).toBeVisible()
    expect((await inputState(input)).value).toBe('AlphaZ')
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(
      'esc-input'
    )
  })
});

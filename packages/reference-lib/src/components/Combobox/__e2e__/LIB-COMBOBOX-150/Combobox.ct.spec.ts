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
  test('CB-ADAPTER-05: invalid grid metadata, targets, and children diagnose before activation', async ({
    mount,
    page,
  }) => {
    test.setTimeout(60000)
    const errors = captureComboboxDiagnostics(page)
    await mount('components/Combobox/Combobox/GridInvalidLog')
    await expect(page.getByTestId('gi-nav-cell')).toBeVisible()

    expect(errors.some(text => text.includes('must have unique values'))).toBe(true)
    expect(errors.some(text => text.includes('index 7') && text.includes('out of range'))).toBe(true)
    expect(errors.some(text => text.includes('Duplicate Combobox.VirtualItem mount'))).toBe(true)
    expect(errors.some(text => text.includes('exactly one native child'))).toBe(true)
    expect(errors.some(text => text.includes('not ref-capable'))).toBe(true)

    // Invalid navigation targets diagnose with no active ID, scroll, or commit.
    // Programmatic focus: stacked open popovers cover the inputs below.
    const navInput = page.getByTestId('gi-nav-input')
    await navInput.focus()
    const before = errors.length
    await navInput.press('ArrowDown')
    await navInput.press('ArrowUp')
    const navErrors = errors.slice(before).filter(text => text.includes('out of range or disabled'))
    expect(navErrors.length).toBeGreaterThanOrEqual(2)
    await expect(navInput).not.toHaveAttribute('aria-activedescendant', /.+/)
  })
});

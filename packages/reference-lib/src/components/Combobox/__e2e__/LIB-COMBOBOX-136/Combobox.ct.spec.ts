/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function logOf(page: Page, testid: string): Promise<string[]> {
  return JSON.parse((await page.getByTestId(testid).textContent()) ?? '[]')
}

async function inputState(input: Locator) {
  return input.evaluate((el: HTMLInputElement) => ({
    value: el.value,
    start: el.selectionStart,
    end: el.selectionEnd,
  }))
}

async function clickNoFocus(page: Page, testid: string) {
  await page.getByTestId(testid).evaluate((el: HTMLElement) => el.click())
}

test.describe('Combobox cluster B CT', () => {
  test('CB-MODE-06: mode switches clear obsolete completion with the source focused', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ModeSwitchLog')
    const input = page.getByTestId('mode-input')
    await input.click()
    await input.pressSequentially('Al')
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })
    const typedLog = await logOf(page, 'mode-log')

    await clickNoFocus(page, 'mode-set-list')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(await inputState(input)).toEqual({ value: 'Al', start: 2, end: 2 })

    await clickNoFocus(page, 'mode-set-none')
    await expect(input).toHaveAttribute('aria-autocomplete', 'none')
    expect(await inputState(input)).toEqual({ value: 'Al', start: 2, end: 2 })

    await clickNoFocus(page, 'mode-set-both')
    await expect(input).toHaveAttribute('aria-autocomplete', 'both')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })

    // Inline completes like both; switching back to list clears again.
    await clickNoFocus(page, 'mode-set-inline')
    await expect(input).toHaveAttribute('aria-autocomplete', 'inline')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })

    await clickNoFocus(page, 'mode-set-list')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(await inputState(input)).toEqual({ value: 'Al', start: 2, end: 2 })

    expect(await logOf(page, 'mode-log')).toEqual(typedLog)
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(
      'mode-input'
    )
  })
});

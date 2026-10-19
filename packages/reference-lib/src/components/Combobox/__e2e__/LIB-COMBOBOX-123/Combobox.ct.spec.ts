/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function readLog(page: Page, testid: string): Promise<string[]> {
  const text = await page.getByTestId(testid).textContent()
  return JSON.parse(text ?? '[]')
}

test.describe('Combobox reconciliation CT', () => {
  test('CB-REVERT-07: closeOnBlur=false preserves open and text on blur; escape still closes', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/BlurPersist')

    const input = page.getByTestId('blur-input')
    await input.click()
    await input.press('End')
    await page.keyboard.type('Z')
    await expect(input).toHaveValue('AlphaZ')

    // Programmatic focus (the open popover overlaps the outside button):
    // a real blur with an outside relatedTarget, no pointer involved.
    await page.getByTestId('blur-outside').focus()
    await expect(page.getByTestId('blur-outside')).toBeFocused()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect(input).toHaveValue('AlphaZ')
    expect(await readLog(page, 'blur-log')).toEqual(['open', 'input:AlphaZ'])

    // Escape still runs its documented revert-then-dismiss sequence.
    await input.click()
    await page.keyboard.press('Escape')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('Alpha')
    expect(await readLog(page, 'blur-log')).toEqual([
      'open',
      'input:AlphaZ',
      'input:Alpha',
      'dismiss',
    ])
  })
});

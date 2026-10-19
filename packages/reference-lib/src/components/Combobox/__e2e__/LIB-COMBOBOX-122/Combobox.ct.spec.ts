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
  test('CB-REVERT-03: outside press blurs, reverts unmatched text, dismisses once', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    await input.click()
    await page.keyboard.type('Zulu')
    await expect(input).toHaveValue('Zulu')

    // Click fixture padding: blur reverts before Overlay's deferred
    // click-dismiss collapses into the same single dismissal.
    await page.mouse.click(6, 6)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('')
    expect(await readLog(page, 'log-counts')).toEqual([
      'open',
      'input:Z',
      'input:Zu',
      'input:Zul',
      'input:Zulu',
      'input:',
      'dismiss',
    ])
  })
});

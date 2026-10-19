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
  test('CB-ADAPTER-02: root onChange is the sole commit authority', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')
    await page.getByTestId('log-input').click()
    await page.getByTestId('log-opt-bravo').click()
    expect((await logOf(page, 'log-counts')).filter(entry => entry.startsWith('change:'))).toEqual([
      'change:bravo',
    ])
  })
});

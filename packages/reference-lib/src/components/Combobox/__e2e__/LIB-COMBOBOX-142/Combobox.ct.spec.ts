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
  test('CB-DOM-02: autocomplete modes and popup roles map to input relationships', async ({
    mount,
    page,
  }) => {
    for (const [story, mode] of [
      ['NoneLog', 'none'],
      ['InlineLog', 'inline'],
      ['ControlledLog', 'list'],
      ['BothLog', 'both'],
    ] as const) {
      await mount(`components/Combobox/Combobox/${story}`)
      const input = page.getByTestId('log-input')
      await expect(input).toHaveAttribute('role', 'combobox')
      await expect(input).toHaveAttribute('aria-autocomplete', mode)
      await expect(input).toHaveAttribute('aria-haspopup', 'listbox')
      await input.click()
      const controls = await input.getAttribute('aria-controls')
      expect(controls).toBe(await page.getByTestId('log-popover').getAttribute('id'))
    }

    await mount('components/Combobox/Combobox/TreePopupLog')
    await expect(page.getByTestId('tp-input')).toHaveAttribute('aria-haspopup', 'tree')
    await page.getByTestId('tp-input').click()
    await expect(page.getByTestId('tp-input')).toHaveAttribute('aria-controls', await page.getByTestId('tp-popover').getAttribute('id') ?? '')

    await mount('components/Combobox/Combobox/GridLog')
    await expect(page.getByTestId('grid-input')).toHaveAttribute('aria-haspopup', 'grid')
    await page.getByTestId('grid-input').click()
    await expect(page.getByTestId('grid-input')).toHaveAttribute('aria-controls', await page.getByTestId('grid-popover').getAttribute('id') ?? '')
  })
});

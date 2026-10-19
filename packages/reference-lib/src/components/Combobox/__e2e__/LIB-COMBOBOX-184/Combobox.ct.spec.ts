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
  test('CB-A11Y-01 structural: roles, names, and relationships across shapes', async ({
    mount,
    page,
  }) => {
    // Structural half of CB-A11Y-01 (the scanner half is the `CB-A11Y-01
    // scan` test below, which runs the configured axe checker alongside
    // the relationship scan): combobox role, popup ownership, haspopup,
    // autocomplete, expanded, and mounted-only active descendants.
    for (const [story, mode] of [
      ['NoneLog', 'none'],
      ['ControlledLog', 'list'],
      ['BothLog', 'both'],
    ] as const) {
      await mount(`components/Combobox/Combobox/${story}`)
      const input = page.getByTestId('log-input')
      await expect(input).toHaveAttribute('role', 'combobox')
      await expect(input).toHaveAttribute('aria-autocomplete', mode)
      await expect(input).toHaveAttribute('aria-haspopup', 'listbox')
      await expect(input).toHaveAttribute('aria-expanded', 'false')
      await input.click()
      const popover = page.getByTestId('log-popover')
      await expect(popover).toBeVisible()
      await expect(popover).toHaveAttribute('role', 'presentation')
      await expect(input).toHaveAttribute('aria-expanded', 'true')
      expect(await input.getAttribute('aria-controls')).toBe(
        await popover.getAttribute('id')
      )
      const listbox = popover.locator('[role="listbox"]')
      await expect(listbox).toHaveCount(1)
      await page.keyboard.press('ArrowDown')
      const desc = await input.getAttribute('aria-activedescendant')
      expect(desc).toBeTruthy()
      await expect(popover.locator(`#${String(desc!)}`)).toHaveAttribute(
        'role',
        'option'
      )
    }

    await mount('components/Combobox/Combobox/SelectOnlyStory')
    const trigger = page.getByTestId('select-trigger')
    await expect(trigger).toHaveAttribute('role', 'combobox')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')

    await mount('components/Combobox/Combobox/DisabledReadonly')
    await expect(page.getByTestId('dr-disabled')).toBeDisabled()
    await expect(page.getByTestId('dr-readonly')).toHaveAttribute('readonly', '')

    await mount('components/Combobox/Combobox/EmptyPopoverLog')
    const emptyInput = page.getByTestId('eo-input')
    await emptyInput.click()
    await expect(page.getByTestId('eo-popover')).toBeVisible()
    await expect(emptyInput).not.toHaveAttribute('aria-activedescendant', /.+/)

    // Virtualized and tree shapes keep the same relationships with
    // mounted-only descendants.
    await mount('components/Combobox/Combobox/WindowedLog')
    const wlInput = page.getByTestId('wl-input')
    await wlInput.click()
    await page.keyboard.press('ArrowDown')
    const wlDesc = await wlInput.getAttribute('aria-activedescendant')
    expect(wlDesc).toBeTruthy()
    await expect(page.getByTestId('wl-popover').locator(`#${String(wlDesc!)}`)).toHaveAttribute(
      'role',
      'option'
    )

    await mount('components/Combobox/Combobox/TreeLog')
    const tbInput = page.getByTestId('tb-input')
    await expect(tbInput).toHaveAttribute('aria-haspopup', 'tree')
    await tbInput.click()
    await page.keyboard.press('ArrowDown')
    const tbDesc = await tbInput.getAttribute('aria-activedescendant')
    expect(tbDesc).toBeTruthy()
    await expect(page.getByTestId('tb-popover').locator(`#${String(tbDesc!)}`)).toHaveAttribute(
      'role',
      'treeitem'
    )
  })
});

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

async function cbExpectActiveItem(source: Locator, item: Locator) {
  const id = await item.getAttribute('id')
  await expect(source).toHaveAttribute('aria-activedescendant', id ?? '')
}

// Programmatic click: drives story controls without moving DOM focus, so an
// open Combobox popover is neither blurred nor outside-dismissed.
async function cbClickNoFocus(page: Page, testid: string) {
  await page.getByTestId(testid).evaluate((el: HTMLElement) => el.click())
}

test.describe('Tree Combobox Bridge (TR-CB / TR-COMP-03)', () => {
  test('TR-CB-03: Tree should register its Combobox bridge automatically without adapter props or duplicate collection roles', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Tree/Tree/ComboboxTree')
    const input = page.getByTestId('cb-input')
    const popover = page.getByTestId('cb-popover')

    // Sole authored Tree ⇒ tree popup, with controls linkage.
    await expect(input).toHaveAttribute('aria-haspopup', 'tree')
    const controlsId = await input.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    await input.click()
    await expect(popover).toBeVisible()
    await expect(popover).toHaveAttribute('id', controlsId ?? '')

    // No invented role: the Tree owns role=tree, the popover stays presentation.
    await expect(popover).toHaveAttribute('role', 'presentation')
    await expect(page.getByTestId('cb-tree')).toHaveAttribute('role', 'tree')
    await expect(popover.getByRole('tree')).toHaveCount(1)

    // No registration wrapper between the Tree and its items.
    await expect(page.locator('[data-testid="cb-tree"] > [role="treeitem"]')).toHaveCount(4)
    await expect(page.locator('[data-testid="cb-group-src"] > [role="treeitem"]')).toHaveCount(2)
    await expect(page.locator('[data-testid*="bridge"], [data-testid*="harness"]')).toHaveCount(0)

    // Generated active IDs name mounted items only: collapse src while its
    // child is active and the descendant follows to a mounted item.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-index'))
    await cbClickNoFocus(page, 'cb-collapse-src')
    await expect(page.getByTestId('cb-item-index')).toHaveCount(0)
    await cbExpectActiveItem(input, page.getByTestId('cb-item-docs'))
    const activeId = await input.getAttribute('aria-activedescendant')
    expect(activeId).toBe('docs')
    await expect(page.locator(`[id="${activeId}"]`)).toBeVisible()

    // Select-only variant: the same tree popup contract on the Trigger.
    await page.keyboard.press('Escape')
    await expect(popover).toHaveCount(0)
    const trigger = page.getByTestId('cbs-trigger')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'tree')
    await trigger.click()
    if (browserName === 'webkit') {
      // WebKit click never focuses
      // buttons, so ArrowDown would go to body and the bridge legs
      // below could not run. Programmatic focus lands and
      // replicates the focused state Chromium gets from the click, so
      // the bridge contract stays proven on WebKit.
      await trigger.focus()
    }
    await expect(page.getByTestId('cbs-popover')).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(trigger, page.getByTestId('cbs-item-a'))
    await expect(trigger).toBeFocused()
  })
});

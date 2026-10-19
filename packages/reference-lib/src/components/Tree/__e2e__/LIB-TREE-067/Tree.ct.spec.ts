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

async function cbReadLog(page: Page, testid: string): Promise<string[]> {
  return JSON.parse((await page.getByTestId(testid).textContent()) ?? '[]')
}

async function cbExpectLogSoon(page: Page, testid: string, expected: string[]) {
  await expect.poll(async () => cbReadLog(page, testid)).toEqual(expected)
}

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
  test('TR-CB-04: Tree activation inside Combobox should route one scalar commit only through the Combobox root', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Tree/Tree/ComboboxTree')
    const input = page.getByTestId('cb-input')

    // Pointer activation commits one scalar and dismisses; input kept focus.
    await input.click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()
    await page.getByTestId('cb-item-readme').click()
    await cbExpectLogSoon(page, 'cb-log', ['open', 'change:readme', 'dismiss'])
    await expect(page.getByTestId('cb-popover')).toHaveCount(0)
    await expect(input).toBeFocused()
    await expect(page.getByTestId('cb-value')).toHaveText('Selected: readme')

    // Enter activation on the virtual-active item commits once.
    await input.click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()
    await cbExpectActiveItem(input, page.getByTestId('cb-item-readme'))
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-docs'))
    await page.keyboard.press('Enter')
    await cbExpectLogSoon(page, 'cb-log', [
      'open',
      'change:readme',
      'dismiss',
      'open',
      'change:docs',
      'dismiss',
    ])
    await expect(input).toBeFocused()

    // Space activation in the select-only variant commits once.
    const trigger = page.getByTestId('cbs-trigger')
    await trigger.click()
    if (browserName === 'webkit') {
      // Click-focus probe: same workaround as
      // TR-CB-03 — without it ArrowDown/Space go to body on WebKit.
      await trigger.focus()
    }
    await expect(page.getByTestId('cbs-popover')).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(trigger, page.getByTestId('cbs-item-a'))
    await page.keyboard.press('Space')
    await cbExpectLogSoon(page, 'cbs-log', ['open', 'change:tb-a', 'dismiss'])

    // Rejected controlled value: one request, no state change, no duplicate.
    await cbClickNoFocus(page, 'cb-toggle-reject')
    await input.click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()
    await cbExpectActiveItem(input, page.getByTestId('cb-item-docs'))
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-readme'))
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cb-popover')).toHaveCount(0)
    const log = await cbReadLog(page, 'cb-log')
    expect(log.filter((entry) => entry.startsWith('change:'))).toEqual([
      'change:readme',
      'change:docs',
      'change:readme',
    ])
    await expect(page.getByTestId('cb-value')).toHaveText('Selected: docs')
    await input.click()
    await expect(page.getByTestId('cb-item-docs')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('cb-item-readme')).toHaveAttribute('aria-selected', 'false')
  })
});

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

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-SELECT-08 windowed: trigger Home and End wait behind one scroll for offscreen targets', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/WindowedTriggerLog')

    const trigger = page.getByTestId('wt-trigger')
    await trigger.click()
    if (browserName === 'webkit') {
      // same click-focus workaround
      // as CB-VIRT-03 — without it End/Home go to body and no scroll
      // pends on WebKit.
      await trigger.focus()
    }
    await expect(page.getByTestId('wt-popover')).toBeVisible()

    // End targets the last ENABLED logical option (99 is disabled).
    await page.keyboard.press('End')
    expect(await readLog(page, 'wt-scroll-log')).toEqual(['scroll:98'])
    await expect(trigger).not.toHaveAttribute('aria-activedescendant', /.+/)
    await page.getByTestId('wt-apply').click()
    await expectActiveDescendant(trigger, page.getByTestId('wt-opt-98'))
    await expect(trigger).toBeFocused()

    // Home targets the first option, unmounted after the window moved.
    await page.keyboard.press('Home')
    expect(await readLog(page, 'wt-scroll-log')).toEqual(['scroll:98', 'scroll:0'])
    await expect(trigger).not.toHaveAttribute('aria-activedescendant', /.+/)
    await page.getByTestId('wt-apply').click()
    await expectActiveDescendant(trigger, page.getByTestId('wt-opt-0'))
    await expect(trigger).toBeFocused()

    // Navigation is silent: no value, text, commit, or dismissal.
    expect(await readLog(page, 'wt-log')).toEqual(['open'])
  })
});

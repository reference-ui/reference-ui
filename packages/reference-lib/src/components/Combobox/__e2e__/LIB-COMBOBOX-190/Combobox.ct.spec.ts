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
  test('CB-SELECT-06: select-only trigger never submits its form until type=submit', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/SelectFormLog')

    const trigger = page.getByTestId('sf-trigger')
    const popover = page.getByTestId('sf-popover')
    await expect(trigger).toHaveAttribute('type', 'button')

    // Open and select by pointer: no submit.
    await trigger.click()
    await expect(popover).toBeVisible()
    await page.getByTestId('sf-opt-bravo').click()
    expect(await readLog(page, 'sf-log')).toEqual(['open', 'change:bravo', 'dismiss'])
    await expect(trigger).toHaveText('Bravo')

    // Open and select by keyboard: no submit.
    await trigger.click()
    if (browserName === 'webkit') {
      // WebKit click leaves focus on
      // body (proven: ArrowDown no-op, active stuck at bravo), so the
      // keyboard legs below need the programmatic-focus workaround.
      await trigger.focus()
    }
    await expect(popover).toBeVisible()
    await expectActiveDescendant(trigger, page.getByTestId('sf-opt-bravo'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(trigger, page.getByTestId('sf-opt-charlie'))
    await page.keyboard.press('Enter')
    expect(await readLog(page, 'sf-log')).toEqual([
      'open',
      'change:bravo',
      'dismiss',
      'open',
      'change:charlie',
      'dismiss',
    ])
    await expect(trigger).toHaveText('Charlie')

    // An explicit type=submit stays application-owned: clicking the
    // closed trigger opens the popover AND submits natively.
    await page.getByTestId('sf-type').click()
    await expect(trigger).toHaveAttribute('type', 'submit')
    await trigger.click()
    await expect(popover).toBeVisible()
    expect(await readLog(page, 'sf-log')).toContain('submit')
  })
});

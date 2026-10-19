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

async function focusedTestId(page: Page) {
  return page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid')
  )
}

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox reconciliation CT', () => {
  test('CB-SELECT-08 trigger home/end: jump to first and last enabled options', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')

    const trigger = page.getByTestId('select-trigger')
    await trigger.click()
    if (browserName === 'webkit') {
      // WebKit click never focuses the
      // trigger, so Home/End would go to body (proven: active=body,
      // activedescendant stuck). Programmatic focus lands and the
      // control leg proves the handler jumps correctly given focus.
      await trigger.focus()
    }
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // Wait for content mount before Home/End navigation.
    await expect(page.getByTestId('select-opt-alpha')).toBeVisible()
    await page.keyboard.press('End')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-charlie'))
    await page.keyboard.press('Home')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-alpha'))
    expect(await focusedTestId(page)).toBe('select-trigger')
    expect(await readLog(page, 'select-log')).toEqual(['open'])
  })
});

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

async function clickPopoverChrome(page: Page, popover: Locator) {
  const box = await popover.boundingBox()
  const firstOption = popover.locator('[role="option"]').first()
  const optBox = await firstOption.boundingBox()
  expect(box).toBeTruthy()
  expect(optBox).toBeTruthy()
  const gap = optBox!.y - box!.y
  expect(gap).toBeGreaterThan(0)
  await page.mouse.click(box!.x + 3, box!.y + gap / 2)
}

test.describe('Combobox reconciliation CT', () => {
  test('CB-CLOSE-01: true outside press dismisses once; internal chrome stays open', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    const popover = page.getByTestId('log-popover')
    await input.click()
    await clickPopoverChrome(page, popover)
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    // Click fixture padding above the input: guaranteed outside the popover.
    await page.mouse.click(6, 6)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    const log = await readLog(page, 'log-counts')
    expect(log.filter(e => e === 'dismiss').length).toBe(1)
  })
});

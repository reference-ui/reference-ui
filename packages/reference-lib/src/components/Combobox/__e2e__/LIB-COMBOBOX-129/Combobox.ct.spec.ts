/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function expectAnchoredBottomStart(trigger: Locator, content: Locator) {
  const triggerBox = await trigger.boundingBox()
  const contentBox = await content.boundingBox()
  expect(triggerBox).toBeTruthy()
  expect(contentBox).toBeTruthy()

  expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 2)
  expect(contentBox!.y).toBeLessThan(triggerBox!.y + triggerBox!.height + 24)
  expect(Math.abs(contentBox!.x - triggerBox!.x)).toBeLessThan(16)
}

async function readLog(page: Page, testid: string): Promise<string[]> {
  const text = await page.getByTestId(testid).textContent()
  return JSON.parse(text ?? '[]')
}

test.describe('Combobox CT', () => {
  test('CB-CLOSE-03 outside: one layer, one positioned popover, one dismissal', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/LayerAudit')

    const input = page.getByTestId('layer-input')
    const popover = page.getByTestId('layer-popover')
    await input.click()
    await expect(popover).toBeVisible()

    await expect(page.getByTestId('layer-popover')).toHaveCount(1)
    await expect(page.getByTestId('layer-count')).toHaveText('1')
    await expect(popover).toHaveAttribute('data-side', 'bottom')
    await expect(popover).toHaveAttribute('data-align', 'start')
    await expectAnchoredBottomStart(input, popover)

    // Click fixture padding above the input: guaranteed outside the popover.
    await page.mouse.click(6, 6)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).toHaveCount(0)
    expect(await readLog(page, 'layer-log')).toEqual(['open', 'dismiss'])
    await expect(page.getByTestId('layer-count')).toHaveText('0')
  })
});

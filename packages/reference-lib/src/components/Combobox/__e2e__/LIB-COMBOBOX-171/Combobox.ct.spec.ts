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

async function expectLogSoon(page: Page, testid: string, expected: string[]) {
  await expect.poll(async () => readLog(page, testid)).toEqual(expected)
}

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-VIRT-03: windowed collection keeps set metadata, selection, and value identity', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/WindowedTriggerLog')

    const trigger = page.getByTestId('wt-trigger')
    const popover = page.getByTestId('wt-popover')
    // WebKit click never focuses the
    // trigger, so arrows after click-open would go to body and no
    // scroll would pend. Programmatic focus replicates the Chromium
    // click-focused state; the window/scroll contract stays proven.
    const isWebKit = browserName === 'webkit'
    const openTrigger = async () => {
      await trigger.click()
      if (isWebKit) await trigger.focus()
    }
    await openTrigger()
    await expect(popover).toBeVisible()

    // Navigate beyond the mounted window (skipping disabled index 5):
    // unmounted index 10 pends behind one scroll request.
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowDown')
    }
    expect(await readLog(page, 'wt-scroll-log')).toEqual(['scroll:10'])
    await expect(trigger).not.toHaveAttribute('aria-activedescendant', /.+/)
    await page.getByTestId('wt-apply').click()
    await expectActiveDescendant(trigger, page.getByTestId('wt-opt-10'))

    // Selecting offscreen index 75 while open pends + scrolls to it.
    await page.getByTestId('wt-select-75').click()
    await expectLogSoon(page, 'wt-scroll-log', ['scroll:10', 'scroll:75'])
    await expect(trigger).not.toHaveAttribute('aria-activedescendant', /.+/)
    await page.getByTestId('wt-apply').click()

    // Mounted options carry logical set metadata; the selected value is
    // selected immediately with its logical value intact.
    const opt75 = page.getByTestId('wt-opt-75')
    await expectActiveDescendant(trigger, opt75)
    await expect(opt75).toHaveAttribute('aria-setsize', '100')
    await expect(opt75).toHaveAttribute('aria-posinset', '76')
    await expect(opt75).toHaveAttribute('aria-selected', 'true')

    // Recommitting the already-selected value is silent while
    // dismissal still runs.
    await trigger.focus()
    await page.keyboard.press('Enter')
    expect(await readLog(page, 'wt-log')).toEqual(['open', 'dismiss'])
    await expect(trigger).toHaveText('WTItem75')
    await expect(popover).toHaveCount(0)

    // Reopening re-requests the selection deterministically (registrations
    // always land after the open commit, so resolution pends first); the
    // already-mounted window resolves it with no further scroll.
    await openTrigger()
    await expect(popover).toBeVisible()
    await expectLogSoon(page, 'wt-scroll-log', ['scroll:10', 'scroll:75', 'scroll:75'])
    await expectActiveDescendant(trigger, page.getByTestId('wt-opt-75'))

    // One commit of a newly mounted target returns the logical value,
    // never the DOM index.
    await page.keyboard.press('ArrowDown')
    expect(await readLog(page, 'wt-scroll-log')).toEqual([
      'scroll:10',
      'scroll:75',
      'scroll:75',
      'scroll:76',
    ])
    await page.getByTestId('wt-apply').click()
    await expectActiveDescendant(trigger, page.getByTestId('wt-opt-76'))
    await page.keyboard.press('Enter')
    expect(await readLog(page, 'wt-log')).toEqual([
      'open',
      'dismiss',
      'open',
      'change:wt-item-76',
      'dismiss',
    ])
    await expect(trigger).toHaveText('WTItem76')
    await expect(popover).toHaveCount(0)
  })
});

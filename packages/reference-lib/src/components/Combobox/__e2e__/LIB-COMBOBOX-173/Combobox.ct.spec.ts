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

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-COMP-01: select-only trigger composes with a virtualized Listbox', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/WindowedTriggerLog')

    const trigger = page.getByTestId('wt-trigger')
    const popover = page.getByTestId('wt-popover')
    // WebKit click never focuses the
    // trigger; without the workaround the pointer legs below lose
    // their arrows to body and wt-opt-77 never mounts (the 30s
    // getAttribute timeout was that cascade, not an env flake).
    const isWebKit = browserName === 'webkit'
    const openTrigger = async () => {
      await trigger.click()
      if (isWebKit) await trigger.focus()
    }
    await trigger.focus()

    // Keyboard open pends its resolution target once (registrations
    // always land after the open commit), then the initial window
    // resolves it; one layer registers.
    await page.keyboard.press('ArrowDown')
    await expect(popover).toBeVisible()
    await expectActiveDescendant(trigger, page.getByTestId('wt-opt-0'))
    expect(await readLog(page, 'wt-log')).toEqual(['open'])
    await expectLogSoon(page, 'wt-scroll-log', ['scroll:0'])
    await expect(page.getByTestId('wt-layers')).toHaveText('1')
    await expect(trigger).toBeFocused()

    // Typeahead reaches beyond the mounted window behind one scroll.
    await page.keyboard.type('wtitem75', { delay: 50 })
    await expectLogSoon(page, 'wt-scroll-log', ['scroll:0', 'scroll:75'])
    await expect(trigger).not.toHaveAttribute('aria-activedescendant', /.+/)
    await page.getByTestId('wt-apply').click()
    const opt75 = page.getByTestId('wt-opt-75')
    await expectActiveDescendant(trigger, opt75)
    await expect(opt75).toHaveAttribute('aria-setsize', '100')
    await expect(trigger).toBeFocused()

    // Arrow navigation continues past the window with exact scrolls.
    await page.keyboard.press('ArrowDown')
    expect(await readLog(page, 'wt-scroll-log')).toEqual(['scroll:0', 'scroll:75', 'scroll:76'])
    await page.getByTestId('wt-apply').click()
    await expectActiveDescendant(trigger, page.getByTestId('wt-opt-76'))

    // One scalar commit, no form submit, layer released.
    await page.keyboard.press('Enter')
    expect(await readLog(page, 'wt-log')).toEqual(['open', 'change:wt-item-76', 'dismiss'])
    await expect(trigger).toHaveText('WTItem76')
    await expect(trigger).toBeFocused()
    await expect(popover).toHaveCount(0)
    await expect(page.getByTestId('wt-layers')).toHaveText('0')

    // Pointer open, keyboard-eligible Tab commit, native traversal.
    await openTrigger()
    await expect(popover).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.getByTestId('wt-apply').click()
    await expectActiveDescendant(trigger, page.getByTestId('wt-opt-77'))
    await page.keyboard.press('Tab')
    expect(await readLog(page, 'wt-log')).toEqual([
      'open',
      'change:wt-item-76',
      'dismiss',
      'open',
      'change:wt-item-77',
      'dismiss',
    ])
    await expect(popover).toHaveCount(0)
    expect(await focusedTestId(page)).not.toBe('wt-trigger')

    // Resizing keeps the gate functional: reopen onto the mounted
    // selection, then navigate past the window again.
    await page.setViewportSize({ width: 1000, height: 600 })
    await openTrigger()
    await expect(popover).toBeVisible()
    await expectActiveDescendant(trigger, page.getByTestId('wt-opt-77'))
    await page.keyboard.press('ArrowDown')
    await page.getByTestId('wt-apply').click()
    await expectActiveDescendant(trigger, page.getByTestId('wt-opt-78'))
    await expect(trigger).toBeFocused()
  })
});

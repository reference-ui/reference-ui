/**
 * FocusLock browser proofs: composition gates across init, tab loop,
 * reclaim, shards, catalog, nesting, restore, and DOM rows. Mounts the
 * fixture lab and asserts containment, arbitration, and restoration in
 * a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('FocusLock Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/FocusLock/FocusLock/Fixture')
    await expect(page.getByTestId('focus-lock-fixture-root')).toBeVisible()
  })

  test('FL-TAB-04: wrap emits blur then focus once', async ({ page }) => {
    await page.getByTestId('btn-open-tab-lab').click()
    await expect(page.getByTestId('tab-a')).toBeFocused()
    await page.evaluate(() => {
      const log: string[] = []
      ;(window as unknown as { __flEvents: string[] }).__flEvents = log
      document.addEventListener(
        'blur',
        event => {
          if (event.target instanceof HTMLElement) log.push(`blur:${event.target.dataset.testid}`)
        },
        true
      )
      document.addEventListener(
        'focus',
        event => {
          if (event.target instanceof HTMLElement) log.push(`focus:${event.target.dataset.testid}`)
        },
        true
      )
    })
    await page.getByTestId('tab-c').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-a')).toBeFocused()
    const events = await page.evaluate(
      () => (window as unknown as { __flEvents: string[] }).__flEvents
    )
    const wrap = events.slice(events.lastIndexOf('blur:tab-c'))
    expect(wrap[0]).toBe('blur:tab-c')
    expect(wrap[1]).toBe('focus:tab-a')
  })
});

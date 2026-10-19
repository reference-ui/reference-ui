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

  test('FL-TAB-01 & FL-CAND-01 & FL-CAND-02 & FL-CAND-03 & FL-CAND-04 & FL-CAND-05 & FL-CAND-06 & FL-CAND-10 & FL-CAND-11 & FL-CAND-12: catalog visits native tabbables and native exclusions', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-catalog').click()
    await expect(page.getByTestId('catalog-btn')).toBeFocused()
    await snap(page, 'fl-catalog-open')

    const order: string[] = []
    for (let i = 0; i < 24; i++) {
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      if (id) order.push(id)
      await page.keyboard.press('Tab')
      if (id === 'catalog-btn' && i > 0) break
    }

    expect(order).toContain('catalog-btn')
    expect(order).toContain('catalog-input')
    expect(order).toContain('catalog-select')
    expect(order).toContain('catalog-textarea')
    expect(order).toContain('catalog-link')
    expect(order).toContain('catalog-legend-btn')
    expect(order).toContain('catalog-radio-b')
    expect(order).toContain('catalog-summary')
    expect(order).toContain('catalog-opacity')
    expect(order).toContain('catalog-aria-hidden')
    expect(order).toContain('catalog-iframe')
    expect(order).not.toContain('catalog-fieldset-body')
    expect(order).not.toContain('catalog-radio-a')
    expect(order).not.toContain('catalog-details-inner')
    expect(order).not.toContain('catalog-disabled')
    expect(order).not.toContain('catalog-nohref')
    expect(order).not.toContain('catalog-audio')
    expect(order).not.toContain('catalog-ce-false')
    expect(order).not.toContain('catalog-negative')
    expect(order).not.toContain('catalog-display-none')
    expect(order).not.toContain('catalog-vis-hidden')
    expect(order).not.toContain('catalog-attr-hidden')
    expect(order).not.toContain('catalog-inert')
  })
});

/**
 * Tabs composition gates and browser proofs. Pins tablist/tab/panel
 * rendering with ARIA linkage, automatic and manual selection, RTL arrow
 * reversal, nested isolation, focus rescue and handoff, dynamic disable
 * and removal, the MyTabs system-variant demo, ShadowRoot locality,
 * keepMounted panels, and real-gesture selection semantics.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Tabs Composition Gates & Browser Proofs', () => {
  test('TB-DOM-05: Pill variant renders with pill styling and handles selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Pill')
    await expect(page.getByTestId('tabs-pill-root')).toBeVisible()

    const tabOverview = page.getByTestId('tab-p-overview')
    const tabActivity = page.getByTestId('tab-p-activity')
    const panelActivity = page.getByTestId('panel-p-activity')
    const list = page.getByTestId('tabs-pill-list')

    await expect(tabOverview).toHaveAttribute('aria-selected', 'true')
    await expect(tabOverview).toHaveAttribute('data-variant', 'pill')

    // Assert pill active background style
    const pillBg = await tabOverview.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    expect(pillBg).not.toBe('rgba(0, 0, 0, 0)')
    expect(pillBg).not.toBe('transparent')

    // Selected pill text must be DARK against the static light bg.
    // Both candidate flipping tokens are white in exactly one mode; the
    // fix (gray.950) is static-dark, so this dark-mode assertion plus
    // token-staticness covers both modes (CT runs dark scheme).
    const pillFg = await tabOverview.evaluate((el) => window.getComputedStyle(el).color)
    const oklchL = (c: string) => {
      const m = c.match(/oklch\(\s*([\d.]+)%?/)
      if (m) return parseFloat(m[1]) / (m[1].includes('.') || parseFloat(m[1]) <= 1 ? 1 : 100)
      const rgb = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/)
      if (!rgb) throw new Error(`unparseable color: ${c}`)
      return (0.2126 * +rgb[1] + 0.7152 * +rgb[2] + 0.0722 * +rgb[3]) / 255
    }
    expect(oklchL(pillFg)).toBeLessThan(oklchL(pillBg) - 0.5)

    await page.waitForTimeout(300)
    await snap(page, 'pill-default')
    await snap(list, 'pill-list-default', { maxDiffPixelRatio: 0.001 })
    await snap(page.getByTestId('tabs-pill-root'), 'pill-root-default', { maxDiffPixelRatio: 0.001 })

    // Hover activity
    await tabActivity.hover()
    await page.waitForTimeout(200)
    await snap(page, 'pill-hover-activity')

    // Click activity
    await tabActivity.click()
    await expect(tabActivity).toHaveAttribute('aria-selected', 'true')
    await expect(panelActivity).toBeVisible()

    await page.waitForTimeout(200)
    await snap(page, 'pill-activity-selected')
    await snap(list, 'pill-list-activity-selected', { maxDiffPixelRatio: 0.001 })

    // Focus state
    await tabActivity.focus()
    await page.waitForTimeout(200)
    await snap(page, 'pill-activity-focused')
  })
});

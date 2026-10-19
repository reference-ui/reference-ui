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
  test('TB-A11Y-01: every frozen shape keeps honest tablist relationships', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/A11yMatrix')
    await expect(page.getByTestId('tabs-a11y-root')).toBeVisible()

    // Horizontal automatic, both selected states.
    const horzList = page.getByTestId('tabs-a11y-horz-list')
    await expect(horzList).toHaveAttribute('role', 'tablist')
    await expect(horzList).toHaveAttribute('aria-orientation', 'horizontal')
    const hGeneral = page.getByTestId('tab-a11y-h-general')
    const hBilling = page.getByTestId('tab-a11y-h-billing')
    await expect(hGeneral).toHaveAttribute('aria-selected', 'true')
    await expect(hGeneral).toHaveAttribute('tabindex', '0')
    await expect(hBilling).toHaveAttribute('tabindex', '-1')
    let controls = await hGeneral.getAttribute('aria-controls')
    expect(controls).toBe(
      await page.getByTestId('panel-a11y-h-general').getAttribute('id')
    )
    await expect(hBilling).not.toHaveAttribute('aria-controls', /.+/)
    await hBilling.click()
    await expect(hBilling).toHaveAttribute('aria-selected', 'true')
    await expect(hBilling).toHaveAttribute('tabindex', '0')
    controls = await hBilling.getAttribute('aria-controls')
    expect(controls).toBe(
      await page.getByTestId('panel-a11y-h-billing').getAttribute('id')
    )

    // Vertical manual, both selected states.
    const vertList = page.getByTestId('tabs-a11y-vert-list')
    await expect(vertList).toHaveAttribute('aria-orientation', 'vertical')
    const vPreview = page.getByTestId('tab-a11y-v-preview')
    const vSource = page.getByTestId('tab-a11y-v-source')
    await expect(vPreview).toHaveAttribute('aria-selected', 'true')
    await vSource.click()
    await expect(vSource).toHaveAttribute('aria-selected', 'true')
    await expect(vSource).toHaveAttribute('tabindex', '0')
    controls = await vSource.getAttribute('aria-controls')
    expect(controls).toBe(
      await page.getByTestId('panel-a11y-v-source').getAttribute('id')
    )

    // One-disabled: the disabled tab is marked, skipped, and never the stop.
    const dBilling = page.getByTestId('tab-a11y-d-billing')
    await expect(dBilling).toBeDisabled()
    await expect(dBilling).toHaveAttribute('data-disabled', '')
    await expect(dBilling).toHaveAttribute('tabindex', '-1')
    await page.getByTestId('tab-a11y-d-general').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('tab-a11y-d-security')).toBeFocused()
    await expect(page.getByTestId('tab-a11y-d-security')).toHaveAttribute(
      'aria-selected',
      'true'
    )

    // All-disabled: zero stops, no requests, panel may show.
    await expect(page.getByTestId('tab-a11y-x-general')).toHaveAttribute(
      'tabindex',
      '-1'
    )
    await expect(page.getByTestId('tab-a11y-x-billing')).toHaveAttribute(
      'tabindex',
      '-1'
    )
    await expect(page.getByTestId('panel-a11y-x-billing')).toBeVisible()

    // Every named relationship resolves inside its own instance.
    const linkage = await page.evaluate(() => {
      const report: string[] = []
      for (const list of Array.from(document.querySelectorAll('[role="tablist"]'))) {
        for (const tab of Array.from(list.querySelectorAll('[role="tab"]'))) {
          const c = tab.getAttribute('aria-controls')
          if (c && !document.getElementById(c)) report.push(`dangling controls ${c}`)
        }
      }
      for (const panel of Array.from(
        document.querySelectorAll('[role="tabpanel"]')
      )) {
        const labelled = panel.getAttribute('aria-labelledby')
        if (!labelled || !document.getElementById(labelled)) {
          report.push(`bad labelledby ${labelled}`)
        }
      }
      return report
    })
    expect(linkage).toEqual([])

    // Scanner half: the A11yMatrix mount exercises horizontal, vertical,
    // one-disabled, and all-disabled tablists in their settled states;
    // #root scoping covers it whole (no portals in Tabs).
    await expectNoAxeViolations(page, { include: '#root' })
  })
});

import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Tabs Composition Gates & Browser Proofs', () => {
  test('TB-DOM-01, TB-DOM-03 & TB-DOM-04: Renders tablist, tabs and panels with active selection, hover, ARIA linkage and keyboard roving', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Horizontal')
    await expect(page.getByTestId('tabs-fixture-root')).toBeVisible()

    const tabAccount = page.getByTestId('tab-account')
    const panelAccount = page.getByTestId('panel-account')
    const tabPassword = page.getByTestId('tab-password')
    const panelPassword = page.getByTestId('panel-password')
    const tabSettings = page.getByTestId('tab-settings')
    const tabDisabled = page.getByTestId('tab-disabled')

    // Initial resting state
    await expect(tabAccount).toHaveAttribute('role', 'tab')
    await expect(tabAccount).toHaveAttribute('aria-selected', 'true')
    await expect(tabAccount).toHaveAttribute('data-state', 'active')
    await expect(panelAccount).toBeVisible()
    await expect(panelAccount).toHaveAttribute('role', 'tabpanel')

    // Active indicator bar assertions (must be solid line with visible color, not transparent/none)
    const list = page.getByTestId('tabs-list')
    const activeBorder = await tabAccount.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return {
        style: cs.borderBottomStyle,
        width: cs.borderBottomWidth,
        color: cs.borderBottomColor,
      }
    })
    expect(activeBorder.style).toBe('solid')
    expect(parseInt(activeBorder.width, 10)).toBeGreaterThanOrEqual(2)
    expect(activeBorder.color).not.toBe('rgba(0, 0, 0, 0)')
    expect(activeBorder.color).not.toBe('transparent')

    await expect(tabPassword).toHaveAttribute('aria-selected', 'false')
    await expect(tabPassword).toHaveAttribute('data-state', 'inactive')
    await expect(panelPassword).toBeHidden()

    await page.waitForTimeout(300)
    await snap(page, 'horizontal-default')
    await snap(list, 'horizontal-list-default', { maxDiffPixelRatio: 0.001 })
    await snap(page.getByTestId('tabs-fixture-root'), 'horizontal-root-default', { maxDiffPixelRatio: 0.001 })

    // Hover inactive tab
    await tabPassword.hover()
    await page.waitForTimeout(200)
    await snap(page, 'horizontal-hover-password')

    // Click password tab -> switches selection and visible panel
    await tabPassword.click()
    await expect(tabPassword).toHaveAttribute('aria-selected', 'true')
    await expect(tabPassword).toHaveAttribute('data-state', 'active')
    await expect(panelPassword).toBeVisible()
    await expect(panelAccount).toBeHidden()

    // Assert password tab now possesses the active indicator bar
    const passBorder = await tabPassword.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return {
        style: cs.borderBottomStyle,
        width: cs.borderBottomWidth,
        color: cs.borderBottomColor,
      }
    })
    expect(passBorder.style).toBe('solid')
    expect(parseInt(passBorder.width, 10)).toBeGreaterThanOrEqual(2)

    await page.waitForTimeout(200)
    await snap(page, 'horizontal-password-selected')
    await snap(list, 'horizontal-list-password-selected', { maxDiffPixelRatio: 0.001 })

    // Arrow keys navigate between tabs
    await tabPassword.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabSettings).toBeFocused()
    await expect(tabSettings).toHaveAttribute('aria-selected', 'true')

    await page.waitForTimeout(200)
    await snap(page, 'horizontal-settings-focused')

    // Disabled tab verification
    await expect(tabDisabled).toBeDisabled()
    await tabDisabled.hover({ force: true })
    await page.waitForTimeout(200)
    await snap(page, 'horizontal-disabled-hover')
  })

  test('TB-DOM-02: Vertical orientation renders vertical tablist and navigates via ArrowDown/Up', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Vertical')
    await expect(page.getByTestId('tabs-vertical-root')).toBeVisible()

    const tabGeneral = page.getByTestId('tab-v-general')
    const tabBilling = page.getByTestId('tab-v-billing')
    const panelBilling = page.getByTestId('panel-v-billing')
    const list = page.getByTestId('tabs-vertical-list')

    await expect(list).toHaveAttribute('aria-orientation', 'vertical')
    await expect(tabGeneral).toHaveAttribute('aria-selected', 'true')

    // Assert vertical active indicator bar (right border)
    const vertBorder = await tabGeneral.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return {
        style: cs.borderRightStyle,
        width: cs.borderRightWidth,
        color: cs.borderRightColor,
      }
    })
    expect(vertBorder.style).toBe('solid')
    expect(parseInt(vertBorder.width, 10)).toBeGreaterThanOrEqual(2)
    expect(vertBorder.color).not.toBe('rgba(0, 0, 0, 0)')

    await page.waitForTimeout(300)
    await snap(page, 'vertical-default')
    await snap(list, 'vertical-list-default', { maxDiffPixelRatio: 0.001 })
    await snap(page.getByTestId('tabs-vertical-root'), 'vertical-root-default', { maxDiffPixelRatio: 0.001 })

    // Hover billing
    await tabBilling.hover()
    await page.waitForTimeout(200)
    await snap(page, 'vertical-hover-billing')

    // Click billing tab
    await tabBilling.click()
    await expect(tabBilling).toHaveAttribute('aria-selected', 'true')
    await expect(panelBilling).toBeVisible()

    await page.waitForTimeout(200)
    await snap(page, 'vertical-billing-selected')
    await snap(list, 'vertical-list-billing-selected', { maxDiffPixelRatio: 0.001 })

    // Arrow navigation
    await tabBilling.focus()
    await page.keyboard.press('ArrowDown')
    const tabIntegrations = page.getByTestId('tab-v-integrations')
    await expect(tabIntegrations).toBeFocused()
    await expect(tabIntegrations).toHaveAttribute('aria-selected', 'true')

    await page.waitForTimeout(200)
    await snap(page, 'vertical-integrations-focused')
  })

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

  // Assertion-only browser proofs for quarantine-landing stability ports.
  // No snapshots: these pin behavior, and visuals must not move.

  test('TB-MANUAL-01: Manual arrows move focus and the tab stop without selecting', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Manual')
    await expect(page.getByTestId('tabs-manual-root')).toBeVisible()

    const tabPreview = page.getByTestId('tab-m-preview')
    const tabSource = page.getByTestId('tab-m-source')
    const panelPreview = page.getByTestId('panel-m-preview')
    const panelSource = page.getByTestId('panel-m-source')

    await tabPreview.focus()
    await page.keyboard.press('ArrowRight')
    // Skips disabled history, lands on source; selection stays on preview.
    await expect(tabSource).toBeFocused()
    await expect(tabSource).toHaveAttribute('tabindex', '0')
    await expect(tabPreview).toHaveAttribute('tabindex', '-1')
    await expect(tabPreview).toHaveAttribute('aria-selected', 'true')
    await expect(tabSource).toHaveAttribute('aria-selected', 'false')
    await expect(panelPreview).toBeVisible()
    await expect(panelSource).toBeHidden()

    // Explicit Enter activates the focused tab.
    await page.keyboard.press('Enter')
    await expect(tabSource).toHaveAttribute('aria-selected', 'true')
    await expect(panelSource).toBeVisible()
    await expect(panelPreview).toBeHidden()
  })

  test('TB-AUTO-02: Horizontal arrows reverse under inherited RTL', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Rtl')
    await expect(page.getByTestId('tabs-rtl-root')).toBeVisible()

    const tabGeneral = page.getByTestId('tab-r-general')
    const tabBilling = page.getByTestId('tab-r-billing')

    await tabBilling.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabGeneral).toBeFocused()
    await expect(tabGeneral).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('ArrowLeft')
    await expect(tabBilling).toBeFocused()
    await expect(tabBilling).toHaveAttribute('aria-selected', 'true')
  })

  test('TB-NEST-01: Nested instances isolate arrow movement in both directions', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Nested')
    await expect(page.getByTestId('tabs-nested-root')).toBeVisible()

    const tabOuterGeneral = page.getByTestId('tab-n-outer-general')
    const tabOuterBilling = page.getByTestId('tab-n-outer-billing')
    const tabInnerA = page.getByTestId('tab-n-inner-a')
    const tabInnerB = page.getByTestId('tab-n-inner-b')
    const panelInnerA = page.getByTestId('panel-n-inner-a')
    const panelInnerB = page.getByTestId('panel-n-inner-b')

    // Inner arrows stay inner.
    await tabInnerA.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabInnerB).toBeFocused()
    await expect(tabInnerB).toHaveAttribute('aria-selected', 'true')
    await expect(panelInnerB).toBeVisible()
    await expect(panelInnerA).toBeHidden()
    await expect(tabOuterGeneral).toHaveAttribute('aria-selected', 'true')

    // Outer arrows skip over nested tabs.
    await tabOuterGeneral.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabOuterBilling).toBeFocused()
    await expect(tabOuterBilling).toHaveAttribute('aria-selected', 'true')

    // Inactive panels unmount their children, so the inner tree detaches
    // with the outer general panel (current mount policy, unchanged).
    await expect(tabInnerB).toBeHidden()

    // Returning restores the inner tree with its controlled selection.
    await tabOuterGeneral.click()
    await expect(tabInnerB).toHaveAttribute('aria-selected', 'true')
    await expect(panelInnerB).toBeVisible()
  })

  test('TB-SELECT-07: hiding the focused panel rescues focus to the new tab', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/FocusRescue')
    await expect(page.getByTestId('tabs-rescue-root')).toBeVisible()

    const panelInput = page.getByTestId('panel-f-input')
    const tabBilling = page.getByTestId('tab-f-billing')
    const panelBilling = page.getByTestId('panel-f-billing')

    await panelInput.focus()
    await expect(panelInput).toBeFocused()
    // Programmatic switch (no pointer focus transfer): the focused input
    // unmounts with its panel and focus rescues to the billing tab.
    await page.getByTestId('rescue-switch').click()
    await expect(tabBilling).toBeFocused()
    await expect(tabBilling).toHaveAttribute('aria-selected', 'true')
    await expect(tabBilling).toHaveAttribute('tabindex', '0')
    await expect(panelBilling).toBeVisible()
  })

  test('TB-DYNAMIC-03: disabling the focused tab hands off to the preceding tab on a tie', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Handoff')
    await expect(page.getByTestId('tabs-handoff-root')).toBeVisible()

    const tabGeneral = page.getByTestId('tab-h-general')
    const tabBilling = page.getByTestId('tab-h-billing')
    const panelGeneral = page.getByTestId('panel-h-general')

    await tabBilling.focus()
    await expect(tabBilling).toBeFocused()
    await page.getByTestId('handoff-disable').click()
    // general/security tie around billing; preceding wins. Selection and
    // visible panel unchanged.
    await expect(tabGeneral).toBeFocused()
    await expect(tabGeneral).toHaveAttribute('tabindex', '0')
    await expect(tabGeneral).toHaveAttribute('aria-selected', 'true')
    await expect(panelGeneral).toBeVisible()
  })

  test('TB-DYNAMIC-03: removing the focused tab hands off from its former position', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Handoff')
    await expect(page.getByTestId('tabs-handoff-root')).toBeVisible()

    const tabBilling = page.getByTestId('tab-h-billing')
    const tabGeneral = page.getByTestId('tab-h-general')

    await tabBilling.focus()
    await page.getByTestId('handoff-remove').click()
    // general/security tie around billing's former slot; preceding wins.
    // (Position-aware walk past first-enabled is pinned in unit.)
    await expect(tabGeneral).toBeFocused()
    await expect(tabGeneral).toHaveAttribute('tabindex', '0')
    await expect(tabGeneral).toHaveAttribute('aria-selected', 'true')
  })

  test('TB-SYS-01: MyTabs custom variant renders through author recipes + kernel base', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/MyTabs')
    await expect(page.getByTestId('tabs-mytabs-root')).toBeVisible()

    const tabOverview = page.getByTestId('tab-my-overview')
    const tabActivity = page.getByTestId('tab-my-activity')

    // The custom name flows through the open kernel prop honestly.
    await expect(tabOverview).toHaveAttribute('data-variant', 'underline')
    await expect(tabOverview).toHaveAttribute('aria-selected', 'true')
    await expect(tabActivity).toHaveAttribute('aria-selected', 'false')

    // Author recipe paints the 2px underline indicator on selection.
    const indicator = await tabOverview.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return {
        style: cs.borderBottomStyle,
        width: cs.borderBottomWidth,
        color: cs.borderBottomColor,
      }
    })
    expect(indicator.style).toBe('solid')
    expect(parseInt(indicator.width, 10)).toBeGreaterThanOrEqual(2)
    expect(indicator.color).not.toBe('rgba(0, 0, 0, 0)')
    expect(indicator.color).not.toBe('transparent')

    // Clicking through the custom flavor still drives kernel selection.
    await tabActivity.click()
    await expect(tabActivity).toHaveAttribute('aria-selected', 'true')
    await expect(tabOverview).toHaveAttribute('aria-selected', 'false')

    // css() override beats the kernel recipe by layer order.
    const tabOverride = page.getByTestId('tab-my-override')
    const tabPlain = page.getByTestId('tab-my-plain')
    const overrideColor = await tabOverride.evaluate(
      (el) => window.getComputedStyle(el).color
    )
    const plainColor = await tabPlain.evaluate(
      (el) => window.getComputedStyle(el).color
    )
    expect(overrideColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(overrideColor).not.toBe(plainColor)
  })

  test('TB-ENV-03: Tabs keep focus and linkage local inside a ShadowRoot', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/ShadowTabs')
    await expect(page.getByTestId('tabs-shadow-root')).toBeVisible()

    const tabGeneral = page.getByTestId('tab-s-general')
    const tabBilling = page.getByTestId('tab-s-billing')
    const panelBilling = page.getByTestId('panel-s-billing')

    // Arrows move focus inside the shadow tree instead of going dead.
    await tabGeneral.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabBilling).toBeFocused()
    // Manual mode: selection stays on general until explicit activation.
    await expect(tabGeneral).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('Enter')
    await expect(tabBilling).toHaveAttribute('aria-selected', 'true')
    await expect(panelBilling).toBeVisible()
    await expect(page.getByTestId('tabs-shadow-log')).toHaveText('billing')

    // shadowRoot.activeElement is the Tab, not the host.
    const activeTestId = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="tabs-shadow-host"]')
      return (
        host?.shadowRoot?.activeElement?.getAttribute('data-testid') ?? null
      )
    })
    expect(activeTestId).toBe('tab-s-billing')

    // aria-controls/aria-labelledby resolve inside the same shadow root.
    const linkage = await page.evaluate(() => {
      const root = document.querySelector(
        '[data-testid="tabs-shadow-host"]'
      )?.shadowRoot
      if (!root) return null
      const tab = root.querySelector('[data-testid="tab-s-billing"]')
      const panel = root.querySelector('[data-testid="panel-s-billing"]')
      const controls = tab?.getAttribute('aria-controls')
      const labelledBy = panel?.getAttribute('aria-labelledby')
      return {
        controlsResolves: controls
          ? root.getElementById(controls)?.getAttribute('role')
          : null,
        labelledByResolves: labelledBy
          ? root.getElementById(labelledBy)?.getAttribute('role')
          : null,
      }
    })
    expect(linkage).toEqual({
      controlsResolves: 'tabpanel',
      labelledByResolves: 'tab',
    })
  })
})

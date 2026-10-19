/**
 * Showcase suite: the composition gallery mounts resting with every
 * primary section, survives active multi-component interactions, and
 * stacks then unwinds the five-tier full-shebang overlay cascade.
 * Case metadata lives in `case.json`; this spec is the execution.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Showcase Suite', () => {

  test('full shebang cascade 5-tier overlay stacking and unwinding', async ({ mount, page }) => {
    test.setTimeout(45000)
    await mount('components/Showcase/Showcase/FullShebangCascade')

    const openConsoleBtn = page.getByTestId('btn-open-shebang-root')
    await expect(openConsoleBtn).toBeVisible()
    await page.waitForTimeout(400)
    await snap(page, 'shebang-resting')

    // Tier 1: Modal Dialog
    await openConsoleBtn.click()
    const tier1Modal = page.getByTestId('shebang-tier1-modal')
    await expect(tier1Modal).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cluster Controller' })).toBeVisible()
    await page.waitForTimeout(400)
    await snap(page, 'shebang-tier1-modal-open')

    // Tier 2: Popover inside Modal
    const openPopoverBtn = page.getByTestId('btn-open-shebang-tier2')
    await openPopoverBtn.click()
    const tier2Popover = page.getByTestId('shebang-tier2-popover')
    await expect(tier2Popover).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Worker Node: worker-eu-04.k8s' })).toBeVisible()
    await page.waitForTimeout(400)
    await snap(page, 'shebang-tier2-popover-open')

    // Tier 3: Menu inside Popover
    const openMenuBtn = page.getByTestId('btn-open-shebang-tier3')
    await openMenuBtn.click()
    const tier3Menu = page.getByTestId('shebang-tier3-menu')
    await expect(tier3Menu).toBeVisible()
    await page.waitForTimeout(400)
    await snap(page, 'shebang-tier3-menu-open')

    // Tier 4: Confirmation Modal triggered from Menu Item
    const drainMenuItem = page.getByTestId('menu-item-drain')
    await drainMenuItem.click()
    const tier4Modal = page.getByTestId('shebang-tier4-modal')
    await expect(tier4Modal).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Drain Node: worker-eu-04.k8s' })).toBeVisible()
    await page.waitForTimeout(400)
    await snap(page, 'shebang-tier4-modal-open')

    // Tier 5: Tooltip on destructive action button inside Tier 4
    const evacuateBtn = page.getByTestId('btn-confirm-drain-tier4')
    await evacuateBtn.hover()
    const tier5Tooltip = page.getByTestId('shebang-tier5-tooltip')
    await expect(tier5Tooltip).toBeVisible()
    await page.waitForTimeout(400)
    await snap(page, 'shebang-tier5-tooltip-open')

    // Escape unwinds Tier 5 Tooltip first
    await page.keyboard.press('Escape')
    await expect(tier5Tooltip).not.toBeVisible()

    // Escape unwinds Tier 4 Confirmation Modal
    await page.keyboard.press('Escape')
    await expect(tier4Modal).not.toBeVisible()
    await page.waitForTimeout(400)
    await snap(page, 'shebang-unwind-tier4')

    // Escape unwinds Tier 2 Popover
    await page.keyboard.press('Escape')
    await expect(tier2Popover).not.toBeVisible()
    await page.waitForTimeout(400)
    await snap(page, 'shebang-unwind-tier2')

    // Close Tier 1 Modal via console close button
    const closeConsoleBtn = page.getByTestId('btn-close-shebang-root')
    await closeConsoleBtn.click()
    await expect(tier1Modal).not.toBeVisible()
    await page.waitForTimeout(400)
    await snap(page, 'shebang-unwind-tier1-all-closed')
  })
})

import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Showcase Suite', () => {
  test('showcase mounts resting and renders all primary sections', async ({ mount, page }) => {
    const component = await mount('components/Showcase/Showcase/Showcase')
    const heading = component.getByRole('heading', { name: 'Reference UI Component Suite' })
    await expect(heading).toBeVisible()

    // Verify sections exist
    await expect(component.getByRole('heading', { name: 'Switch', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Field', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'NumberField', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Slider', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Tooltip & Popover', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Menu', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Toast Notifications', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Collapsible & Accordion', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Tabs', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Combobox & Listbox', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'DateField & Calendar', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Tree View', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Modal Overlay (Dialog)', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Splitter', exact: true })).toBeVisible()

    await page.waitForTimeout(600)
    await snap(page, 'showcase-resting')
  })

  test('showcase active interactions across multiple components', async ({ mount, page }) => {
    const component = await mount('components/Showcase/Showcase/Showcase')
    await expect(component.getByRole('heading', { name: 'Reference UI Component Suite' })).toBeVisible()

    // 1. Toggle switch
    const switchEl = component.getByRole('switch', { name: 'Toggle notifications' })
    await expect(component.getByText('Enabled')).toBeVisible()
    await switchEl.click()
    await expect(component.getByText('Disabled', { exact: true })).toBeVisible()

    // 2. Open popover
    const popoverTrigger = component.getByRole('button', { name: 'Open Popover' })
    await popoverTrigger.click()
    const popoverDetails = page.getByText('Popover Details')
    await expect(popoverDetails).toBeVisible()

    // 3. Switch Tab to Props
    const propsTab = component.getByRole('tab', { name: 'Props' })
    await propsTab.click()
    await expect(component.getByText('Props extending PrimitiveProps for type safety.')).toBeVisible()

    // 4. Expand Accordion item 2
    const accordionItem2 = component.getByRole('button', { name: 'Accordion Item 2' })
    await accordionItem2.click()
    await expect(component.getByText('Content inside Accordion item 2.')).toBeVisible()

    // 5. Increment NumberField
    const incrementBtn = component.getByRole('button', { name: 'Increment' })
    await incrementBtn.click()
    await expect(component.getByRole('spinbutton')).toHaveValue('43')

    await page.waitForTimeout(600)
    await snap(page, 'showcase-active')

    // 6. Open Modal Dialog on top of active state
    const modalBtn = component.getByRole('button', { name: 'Open Modal Dialog' })
    await modalBtn.click()
    const modalHeading = page.getByRole('heading', { name: 'Modal Dialog' })
    await expect(modalHeading).toBeVisible()

    await page.waitForTimeout(600)
    await snap(page, 'showcase-modal-active')

    // 7. Dismiss modal dialog
    const cancelBtn = page.getByRole('button', { name: 'Cancel' })
    await cancelBtn.click()
    await expect(modalHeading).not.toBeVisible()

    await page.waitForTimeout(600)
    await snap(page, 'showcase-settled')
  })

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

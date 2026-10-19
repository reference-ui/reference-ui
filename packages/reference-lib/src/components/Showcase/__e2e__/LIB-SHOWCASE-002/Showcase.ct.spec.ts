/**
 * Showcase suite: the composition gallery mounts resting with every
 * primary section, survives active multi-component interactions, and
 * stacks then unwinds the five-tier full-shebang overlay cascade.
 * Case metadata lives in `case.json`; this spec is the execution.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Showcase Suite', () => {

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

    // 5. Increment NumberField (plain textbox, never spinbutton;
    // scoped to stepper root — page has multiple textboxes)
    const incrementBtn = component.getByRole('button', { name: 'Increment' })
    await incrementBtn.click()
    const stepper = component.locator('[data-reference-number-field]')
    await expect(stepper.getByRole('textbox')).toHaveValue('43')

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
})

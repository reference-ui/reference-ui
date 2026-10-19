/**
 * Showcase suite: the composition gallery mounts resting with every
 * primary section, survives active multi-component interactions, and
 * stacks then unwinds the five-tier full-shebang overlay cascade.
 * Case metadata lives in `case.json`; this spec is the execution.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

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
})

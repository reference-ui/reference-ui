import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Collapsible Composition Gates & Browser Proofs', () => {
  test('CO-DOM-01, CO-DOM-02 & CO-DOM-04: Toggles Collapsible open/closed and updates ARIA attributes', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/Basic')
    const trigger = page.getByTestId('btn-collapsible-trigger')
    const content = page.getByTestId('collapsible-content')

    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveCount(0)

    const root = page.getByTestId('collapsible-fixture-root')

    await page.waitForTimeout(300)
    await snap(page, 'resting-closed')
    await snap(root, 'collapsible-root-resting', { maxDiffPixelRatio: 0.001 })
    await snap(trigger, 'collapsible-trigger-resting', { maxDiffPixelRatio: 0.001 })

    // Hover trigger
    await trigger.hover()
    await page.waitForTimeout(200)
    await snap(page, 'hover-trigger')

    // Click to open
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'open')
    await expect(content.getByTestId('collapsible-text')).toHaveText('Detailed collapsible content.')

    const contentId = await content.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)

    await page.waitForTimeout(300)
    await snap(page, 'opened')
    await snap(root, 'collapsible-root-opened', { maxDiffPixelRatio: 0.001 })
    await snap(content, 'collapsible-content-opened', { maxDiffPixelRatio: 0.001 })

    // Click to close
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'closed')
    await snap(root, 'collapsible-root-closed', { maxDiffPixelRatio: 0.001 })
  })

  test('CO-SIZE-01: Open Content publishes border-box measurement CSS variables', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/Basic')
    const trigger = page.getByTestId('btn-collapsible-trigger')
    await trigger.click()

    const content = page.getByTestId('collapsible-content')
    await expect(content).toBeVisible()

    await expect.poll(async () => {
      return content.evaluate(el =>
        getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim()
      )
    }).toMatch(/^[1-9]/)

    const measurements = await content.evaluate(el => {
      const styles = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        heightVar: styles.getPropertyValue('--reference-collapsible-content-height').trim(),
        widthVar: styles.getPropertyValue('--reference-collapsible-content-width').trim(),
        height: rect.height,
        width: rect.width,
      }
    })

    expect(measurements.heightVar).toMatch(/^\d+(\.\d+)?px$/)
    expect(measurements.widthVar).toMatch(/^\d+(\.\d+)?px$/)
    expect(Math.abs(parseFloat(measurements.heightVar) - measurements.height)).toBeLessThanOrEqual(1)
    expect(Math.abs(parseFloat(measurements.widthVar) - measurements.width)).toBeLessThanOrEqual(1)
  })

  test('CO-DEFAULT-OPEN: Starts expanded with defaultOpen and can be collapsed', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/DefaultOpen')
    const defaultOpenRoot = page.getByTestId('collapsible-default-open-root')
    const trigger = page.getByTestId('btn-default-open-trigger')
    const content = page.getByTestId('default-open-content')

    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toBeVisible()

    await page.waitForTimeout(300)
    await snap(page, 'default-open-resting')
    await snap(defaultOpenRoot, 'collapsible-default-open-root', { maxDiffPixelRatio: 0.001 })

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'default-open-collapsed')
    await snap(defaultOpenRoot, 'collapsible-default-open-collapsed', { maxDiffPixelRatio: 0.001 })
  })
})

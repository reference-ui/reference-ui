import { expect, test } from '@playwright/test'

test.describe('Collapsible Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collapsible')
    await expect(page.getByTestId('collapsible-fixture-root')).toBeVisible()
  })

  test('CO-DOM-01, CO-DOM-02 & CO-DOM-04: Toggles Collapsible open/closed and updates ARIA attributes', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-collapsible-trigger')
    const content = page.getByTestId('collapsible-content')

    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveCount(0)

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

    // Click to close — Presence keeps Content mounted through the GSAP exit
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveCount(0)
  })

  test('CO-SIZE-01: Open Content publishes border-box measurement CSS variables', async ({
    page,
  }) => {
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
})

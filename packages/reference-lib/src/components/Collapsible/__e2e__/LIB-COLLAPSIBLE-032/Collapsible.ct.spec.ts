/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Composition Gates & Browser Proofs', () => {
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
});

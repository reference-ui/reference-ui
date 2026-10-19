/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-SIZE-01 (exact): Collapsible should publish exact border-box measurements under GSAP-owned box-sizing', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/SizeExact')
    const content = page.getByTestId('size-content')
    await expect(content).toBeVisible()

    await expect.poll(async () => {
      return content.evaluate(el =>
        getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width').trim()
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
        boxSizing: styles.boxSizing,
      }
    })

    // The collapse engine forces border-box: authored 120px + padding + border
    // measure a 120px border box (content-box math does not apply).
    expect(measurements.boxSizing).toBe('border-box')
    expect(parseFloat(measurements.widthVar)).toBeCloseTo(120, 0)
    expect(Math.abs(parseFloat(measurements.widthVar) - measurements.width)).toBeLessThanOrEqual(1)
    expect(measurements.heightVar).toMatch(/^\d+(\.\d+)?px$/)
    expect(Math.abs(parseFloat(measurements.heightVar) - measurements.height)).toBeLessThanOrEqual(1)
  })
});

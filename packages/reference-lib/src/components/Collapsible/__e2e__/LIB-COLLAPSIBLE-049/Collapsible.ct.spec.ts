/**
 * Collapsible browser proofs: composition gates plus the GSAP-motion
 * ports across DOM, activation, presence, and size rows. Mounts the
 * story fixtures and asserts linkage, exits, evacuation, isolation, and
 * published measurements in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Collapsible Ports (GSAP-owned motion)', () => {
  test('CO-SIZE-03: Collapsible should refresh open measurements without taking ownership of application layout or motion styles', async ({
    mount,
    page,
  }) => {
    await mount('components/Collapsible/Collapsible/Resizable')
    const content = page.getByTestId('resize-content')

    await expect(content).toBeVisible()

    let vars = await content.evaluate(el => ({
      w: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width').trim(),
      h: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim(),
      density: getComputedStyle(el).getPropertyValue('--product-density').trim(),
    }))
    // ResizeObserver publishes asynchronously; poll until the initial size lands.
    if (!/^[1-9]/.test(vars.w)) {
      await expect.poll(async () => {
        return content.evaluate(el =>
          getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width').trim()
        )
      }).toMatch(/^[1-9]/)
      vars = await content.evaluate(el => ({
        w: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width').trim(),
        h: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim(),
        density: getComputedStyle(el).getPropertyValue('--product-density').trim(),
      }))
    }
    expect(parseFloat(vars.w)).toBeCloseTo(100, 0)
    expect(parseFloat(vars.h)).toBeCloseTo(40, 0)
    expect(vars.density).toBe('compact')

    await page.getByTestId('resize-btn').click()
    await expect.poll(async () => {
      return content.evaluate(el =>
        parseFloat(getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width'))
      )
    }).toBeCloseTo(180, 0)

    vars = await content.evaluate(el => ({
      w: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-width').trim(),
      h: getComputedStyle(el).getPropertyValue('--reference-collapsible-content-height').trim(),
      density: getComputedStyle(el).getPropertyValue('--product-density').trim(),
    }))
    expect(parseFloat(vars.h)).toBeCloseTo(70, 0)
    expect(vars.density).toBe('compact')
  })
});

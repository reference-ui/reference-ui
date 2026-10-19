/**
 * Slider browser proof: parts, sessions, and focus rings. Renders the
 * story fixtures to pin part anatomy and clamped ARIA, keyboard and
 * pointer value changes, track-press thumb choice, RTL and vertical
 * mapping, session lifecycles, StrictMode and ShadowRoot behavior, and
 * keyboard-only focus-ring parity.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Slider CT', () => {
  test('SD-POINTER-14: scopes keyboard focus ring to keyboard interaction and removes outline on pointer click/drag', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/SingleSliderFixture')

    const thumb = page.getByTestId('slider-thumb')
    const track = page.getByTestId('slider-track')

    // 1. Initially resting: no data-focus-visible and outline is none
    await expect(thumb).not.toHaveAttribute('data-focus-visible')
    let outlineStyle = await thumb.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outlineStyle).toBe('none')

    // 2. Tab into thumb via keyboard: receives data-focus-visible and solid outline
    await page.keyboard.press('Tab')
    await expect(thumb).toBeFocused()
    await expect(thumb).toHaveAttribute('data-focus-visible', '')
    outlineStyle = await thumb.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outlineStyle).toBe('solid')
    await page.waitForTimeout(200)
    await snap(page, 'slider-keyboard-focus-ring')

    // 3. Mouse click on the thumb: immediately clears data-focus-visible and outline
    await thumb.click()
    await expect(thumb).toBeFocused()
    await expect(thumb).not.toHaveAttribute('data-focus-visible')
    outlineStyle = await thumb.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outlineStyle).toBe('none')
    await page.waitForTimeout(200)
    await snap(page, 'slider-pointer-click-no-ring')

    // 4. Keyboard arrow key resumes keyboard modality and restores outline
    await page.keyboard.press('ArrowRight')
    await expect(thumb).toHaveAttribute('data-focus-visible', '')
    outlineStyle = await thumb.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outlineStyle).toBe('solid')

    // 5. Clicking track with mouse clears outline even though thumb is focused
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.click({ position: { x: box!.width * 0.7, y: box!.height / 2 } })
    await expect(thumb).toBeFocused()
    await expect(thumb).not.toHaveAttribute('data-focus-visible')
    outlineStyle = await thumb.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outlineStyle).toBe('none')
  })
});

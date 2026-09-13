import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Slider CT', () => {
  test('renders slider parts and updates value via keyboard arrows', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/SingleSliderFixture')

    const thumb = page.getByTestId('slider-thumb')
    const display = page.getByTestId('slider-value-display')

    await expect(thumb).toHaveAttribute('role', 'slider')
    await expect(thumb).toHaveAttribute('aria-valuemin', '0')
    await expect(thumb).toHaveAttribute('aria-valuemax', '100')
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')
    await expect(display).toHaveText('Current value: 30')
    await page.waitForTimeout(300)
    await snap(page, 'slider-resting')

    // Keyboard ArrowRight increases by step (5) -> 35
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await expect(thumb).toHaveAttribute('aria-valuenow', '35')
    await expect(display).toHaveText('Current value: 35')
    await page.waitForTimeout(200)
    await snap(page, 'slider-arrow-right')

    // Keyboard ArrowLeft decreases by step (5) -> 30
    await page.keyboard.press('ArrowLeft')
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')
    await expect(display).toHaveText('Current value: 30')
  })

  test('updates slider value via pointer dragging and track clicking', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/SingleSliderFixture')

    const track = page.getByTestId('slider-track')
    const thumb = page.getByTestId('slider-thumb')
    const display = page.getByTestId('slider-value-display')

    const box = await track.boundingBox()
    expect(box).not.toBeNull()

    // Click near 80% mark on the track (width is 300px)
    await track.click({ position: { x: box!.width * 0.8, y: box!.height / 2 } })

    await expect(thumb).toHaveAttribute('aria-valuenow', '80')
    await expect(display).toHaveText('Current value: 80')
    await page.waitForTimeout(200)
    await snap(page, 'slider-track-clicked-80')
  })

  test('scopes keyboard focus ring to keyboard interaction and removes outline on pointer click/drag', async ({
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

  test('multi-thumb range slider focus ring parity on keyboard and mouse drag', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/RangeSliderFixture')

    const thumb0 = page.getByTestId('range-thumb-0')
    const thumb1 = page.getByTestId('range-thumb-1')
    const track = page.getByTestId('range-track')

    // Initial state: neither thumb has outline
    let outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    let outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')
    expect(outline1).toBe('none')
    await page.waitForTimeout(300)
    await snap(page, 'range-slider-resting')

    // 1. Focus thumb0 via keyboard: Tab to thumb0
    await thumb0.focus()
    await page.keyboard.press('ArrowRight')
    await expect(thumb0).toHaveAttribute('data-focus-visible', '')
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('solid')
    expect(outline1).toBe('none')
    await page.waitForTimeout(200)
    await snap(page, 'range-thumb0-focused')

    // 2. Tab to thumb1: thumb0 loses ring, thumb1 gains ring
    await page.keyboard.press('Tab')
    await expect(thumb1).toBeFocused()
    await expect(thumb1).toHaveAttribute('data-focus-visible', '')
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')
    expect(outline1).toBe('solid')
    await page.waitForTimeout(200)
    await snap(page, 'range-thumb1-focused')

    // 3. Mouse click & drag on thumb1: outline MUST be none during and after drag
    const box1 = await thumb1.boundingBox()
    expect(box1).not.toBeNull()

    // Move to thumb1 and press mouse
    await page.mouse.move(box1!.x + box1!.width / 2, box1!.y + box1!.height / 2)
    await page.mouse.down()

    // Check during pointerdown
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline1).toBe('none')
    await expect(thumb1).not.toHaveAttribute('data-focus-visible')

    // Drag by 30px
    await page.mouse.move(box1!.x + box1!.width / 2 - 30, box1!.y + box1!.height / 2)
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline1).toBe('none')
    await expect(thumb1).not.toHaveAttribute('data-focus-visible')

    // Release mouse
    await page.mouse.up()
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline1).toBe('none')
    await expect(thumb1).not.toHaveAttribute('data-focus-visible')
    await page.waitForTimeout(200)
    await snap(page, 'range-thumb1-dragged')

    // 4. Mouse click & drag on thumb0
    const box0 = await thumb0.boundingBox()
    expect(box0).not.toBeNull()

    await page.mouse.move(box0!.x + box0!.width / 2, box0!.y + box0!.height / 2)
    await page.mouse.down()
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')

    await page.mouse.move(box0!.x + box0!.width / 2 + 30, box0!.y + box0!.height / 2)
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')

    await page.mouse.up()
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')
    await expect(thumb0).not.toHaveAttribute('data-focus-visible')

    // 5. Track click near thumb1
    const trackBox = await track.boundingBox()
    expect(trackBox).not.toBeNull()
    await track.click({ position: { x: trackBox!.width * 0.9, y: trackBox!.height / 2 } })
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')
    expect(outline1).toBe('none')

    // 6. Keyboard navigation restores focus visible ring
    await page.keyboard.press('ArrowLeft')
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline1).toBe('solid')
    await expect(thumb1).toHaveAttribute('data-focus-visible', '')
  })
})

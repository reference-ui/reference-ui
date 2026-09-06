import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

test.describe('Slider Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/slider')
    await expect(page.getByTestId('slider-fixture-root')).toBeVisible()
  })

  test('SD-DOM-01 & SD-DOM-02: Renders slider parts and updates value via keyboard arrows', async ({
    page,
  }) => {
    const thumb = page.getByTestId('slider-thumb')
    const display = page.getByTestId('slider-value-display')

    await expect(thumb).toHaveAttribute('role', 'slider')
    await expect(thumb).toHaveAttribute('aria-valuemin', '0')
    await expect(thumb).toHaveAttribute('aria-valuemax', '100')
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')
    await expect(display).toHaveText('Current value: 30')

    // Keyboard ArrowRight increases by step (5) -> 35
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await expect(thumb).toHaveAttribute('aria-valuenow', '35')
    await expect(display).toHaveText('Current value: 35')

    // Keyboard ArrowLeft decreases by step (5) -> 30
    await page.keyboard.press('ArrowLeft')
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')
    await expect(display).toHaveText('Current value: 30')
  })

  test('SD-DOM-03: Updates slider value via pointer dragging and track clicking', async ({
    page,
  }) => {
    const track = page.getByTestId('slider-track')
    const thumb = page.getByTestId('slider-thumb')
    const display = page.getByTestId('slider-value-display')

    const box = await track.boundingBox()
    expect(box).not.toBeNull()

    // Click near 80% mark on the track (width is 300px)
    const targetX = box!.x + box!.width * 0.8
    const targetY = box!.y + box!.height / 2
    await track.click({ position: { x: box!.width * 0.8, y: box!.height / 2 } })

    await expect(thumb).toHaveAttribute('aria-valuenow', '80')
    await expect(display).toHaveText('Current value: 80')
  })

  test('SD-FOCUS-01: Scopes keyboard focus ring to keyboard interaction and removes outline on pointer click/drag', async ({
    page,
  }) => {
    const root = page.getByTestId('test-slider')
    const thumb = page.getByTestId('slider-thumb')
    const track = page.getByTestId('slider-track')

    const outDir = '/Users/ryn/Developer/reference-ui/.reference-ui/captures'
    const brainDir = '/Users/ryn/.gemini/antigravity/brain/db250aa5-6b7f-40e4-82d3-a35e72ba9e7f'
    fs.mkdirSync(outDir, { recursive: true })

    const saveState = async (label: string) => {
      const box = await root.boundingBox()
      const pad = 20
      const clip = box
        ? {
            x: Math.max(0, box.x - pad),
            y: Math.max(0, box.y - pad),
            width: box.width + pad * 2,
            height: box.height + pad * 2,
          }
        : undefined
      const fileName = `Slider_${label}.png`
      const outPath = path.join(outDir, fileName)
      await page.screenshot({ path: outPath, clip })
      try {
        fs.copyFileSync(outPath, path.join(brainDir, fileName))
      } catch {}
    }

    // 1. Initially resting: no data-focus-visible and outline is none
    await expect(thumb).not.toHaveAttribute('data-focus-visible')
    let outlineStyle = await thumb.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outlineStyle).toBe('none')
    await saveState('1-resting')

    // 2. Tab into thumb via keyboard: receives data-focus-visible and solid outline
    await page.keyboard.press('Tab')
    await expect(thumb).toBeFocused()
    await expect(thumb).toHaveAttribute('data-focus-visible', '')
    outlineStyle = await thumb.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outlineStyle).toBe('solid')
    await saveState('2-tabbed-outline-visible')

    // 3. Mouse click on the thumb: immediately clears data-focus-visible and outline
    await thumb.click()
    await expect(thumb).toBeFocused()
    await expect(thumb).not.toHaveAttribute('data-focus-visible')
    outlineStyle = await thumb.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outlineStyle).toBe('none')
    await saveState('3-mouse-click-outline-removed')

    // 4. Keyboard arrow key resumes keyboard modality and restores outline
    await page.keyboard.press('ArrowRight')
    await expect(thumb).toHaveAttribute('data-focus-visible', '')
    outlineStyle = await thumb.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outlineStyle).toBe('solid')
    await saveState('4-keyboard-arrow-outline-restored')

    // 5. Clicking track with mouse clears outline even though thumb is focused
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.click({ position: { x: box!.width * 0.7, y: box!.height / 2 } })
    await expect(thumb).toBeFocused()
    await expect(thumb).not.toHaveAttribute('data-focus-visible')
    outlineStyle = await thumb.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outlineStyle).toBe('none')
    await saveState('5-track-click-outline-removed')
  })

  test('SD-FOCUS-02: Multi-thumb Range Slider focus ring parity on keyboard and mouse drag', async ({
    page,
  }) => {
    const thumb0 = page.getByTestId('range-thumb-0')
    const thumb1 = page.getByTestId('range-thumb-1')
    const track = page.getByTestId('range-track')

    // Initial state: neither thumb has outline
    let outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    let outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')
    expect(outline1).toBe('none')

    // 1. Focus thumb0 via keyboard: Tab to thumb0
    await thumb0.focus()
    await page.keyboard.press('ArrowRight')
    await expect(thumb0).toHaveAttribute('data-focus-visible', '')
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('solid')
    expect(outline1).toBe('none')

    // 2. Tab to thumb1: thumb0 loses ring, thumb1 gains ring
    await page.keyboard.press('Tab')
    await expect(thumb1).toBeFocused()
    await expect(thumb1).toHaveAttribute('data-focus-visible', '')
    outline0 = await thumb0.evaluate(el => window.getComputedStyle(el).outlineStyle)
    outline1 = await thumb1.evaluate(el => window.getComputedStyle(el).outlineStyle)
    expect(outline0).toBe('none')
    expect(outline1).toBe('solid')

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

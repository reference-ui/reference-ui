import { test, expect, snap } from '../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../playwright/axe'

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

  test('B-29: out-of-range controlled value clamps ARIA like the visual', async ({
    mount,
    page,
  }) => {
    // Playtest repro: value 999 with max 24 rendered the thumb at 100%
    // while aria-valuenow lied 999. Both now agree on 24.
    const overflow = await mount('components/Slider/Slider/LoggedFixture', { initial: 999, min: 0, max: 24 })

    const thumb = page.getByTestId('logged-thumb-0')
    await expect(thumb).toHaveAttribute('aria-valuemin', '0')
    await expect(thumb).toHaveAttribute('aria-valuemax', '24')
    await expect(thumb).toHaveAttribute('aria-valuenow', '24')

    const position = await thumb.evaluate(el =>
      el.style.getPropertyValue('--reference-slider-thumb-position')
    )
    expect(position).toBe('100%')
    await overflow.unmount()

    // Underflow mirrors: 0 exposed, thumb at the start.
    await mount('components/Slider/Slider/LoggedFixture', { initial: -40, min: 0, max: 24 })
    await expect(thumb).toHaveAttribute('aria-valuenow', '0')
    const underPosition = await thumb.evaluate(el =>
      el.style.getPropertyValue('--reference-slider-thumb-position')
    )
    expect(underPosition).toBe('0%')
  })

  test('W-35: out-of-range controlled value dev-warns naming component, prop, value, and range', async ({
    mount,
    page,
  }) => {
    // Clamp (B-29) plus the dev warning: the browser console names all four
    // parts while render and ARIA agree on the clamped 24.
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await mount('components/Slider/Slider/LoggedFixture', { initial: 999, min: 0, max: 24 })

    const thumb = page.getByTestId('logged-thumb-0')
    await expect(thumb).toHaveAttribute('aria-valuenow', '24')
    expect(
      errors.some(
        t =>
          t.includes('Slider') &&
          t.includes('value') &&
          t.includes('999') &&
          t.includes('[0, 24]')
      )
    ).toBe(true)
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

test.describe('Slider PATCHES pins', () => {
  test('SD-KEY-02: reverses only horizontal Left/Right arrows under inherited RTL', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, dir: 'rtl', width: 100 })
    const thumb = page.getByTestId('logged-thumb-0')
    const changes = page.getByTestId('logged-changes')
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowDown')
    await expect(changes).toHaveText('[19,20,21,20]')
    await expect(thumb).toBeFocused()
  })

  test('SD-KEY-03: keeps vertical arrow semantics independent of RTL', async ({
    mount,
    page,
  }) => {
    for (const dir of ['ltr', 'rtl']) {
      const component = await mount('components/Slider/Slider/LoggedFixture', {
        initial: 20,
        orientation: 'vertical',
        dir,
        height: 100,
      })
      const thumb = page.getByTestId('logged-thumb-0')
      const changes = page.getByTestId('logged-changes')
      await thumb.focus()
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowLeft')
      await expect(changes).toHaveText('[21,22,21,20]')
      await component.unmount()
    }
  })

  test('SD-POINTER-10: maps physical pointer positions when orientation and direction vary', async ({
    mount,
    page,
  }) => {
    // Real clicks use 1px insets (exact border pixels fail hit testing and
    // belong to the parent); exact 0/100 edges are pinned in unit.
    // Horizontal LTR: x=1 -> 1, x=99 -> 99.
    let component = await mount('components/Slider/Slider/LoggedFixture', { initial: 50, width: 100 })
    let track = page.getByTestId('logged-track')
    let box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.click({ position: { x: 1, y: box!.height / 2 } })
    await track.click({ position: { x: box!.width - 1, y: box!.height / 2 } })
    await expect(page.getByTestId('logged-changes')).toHaveText('[1,99]')
    await component.unmount()

    // Horizontal RTL: x=1 -> 99, x=99 -> 1.
    component = await mount('components/Slider/Slider/LoggedFixture', { initial: 50, width: 100, dir: 'rtl' })
    track = page.getByTestId('logged-track')
    box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.click({ position: { x: 1, y: box!.height / 2 } })
    await track.click({ position: { x: box!.width - 1, y: box!.height / 2 } })
    await expect(page.getByTestId('logged-changes')).toHaveText('[99,1]')
    await component.unmount()

    // Vertical: y=bottom-1 -> 1, y=1 -> 99.
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: 50,
      orientation: 'vertical',
      height: 100,
    })
    track = page.getByTestId('logged-track')
    box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.click({ position: { x: box!.width / 2, y: box!.height - 1 } })
    await track.click({ position: { x: box!.width / 2, y: 1 } })
    await expect(page.getByTestId('logged-changes')).toHaveText('[1,99]')
  })

  test('SD-DOM-06: right-anchors computed Range geometry in RTL', async ({ mount, page }) => {
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: [20, 70],
      width: 200,
      dir: 'rtl',
    })
    const track = page.getByTestId('logged-track')
    const range = page.getByTestId('logged-range')
    const trackBox = await track.boundingBox()
    const rangeBox = await range.boundingBox()
    expect(trackBox).not.toBeNull()
    expect(rangeBox).not.toBeNull()
    // Start 20% from the right edge, spanning 50% of the track.
    expect(rangeBox!.x + rangeBox!.width).toBeCloseTo(trackBox!.x + trackBox!.width - 0.2 * trackBox!.width, 0)
    expect(rangeBox!.width).toBeCloseTo(0.5 * trackBox!.width, 0)
    const style = await range.getAttribute('style')
    expect(style).toContain('--reference-slider-range-start: 20%')
    expect(style).toContain('--reference-slider-range-end: 70%')
  })

  test('SD-POINTER-01: chooses and focuses the nearest movable thumb on track press', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: [10, 80], width: 300 })
    const track = page.getByTestId('logged-track')
    const thumb0 = page.getByTestId('logged-thumb-0')
    const thumb1 = page.getByTestId('logged-thumb-1')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()

    await track.click({ position: { x: 60, y: box!.height / 2 } })
    await expect(thumb0).toBeFocused()
    await expect(page.getByTestId('logged-changes')).toHaveText('[[20,80]]')

    await track.click({ position: { x: 270, y: box!.height / 2 } })
    await expect(thumb1).toBeFocused()
    await expect(page.getByTestId('logged-changes')).toHaveText('[[20,80],[20,90]]')
  })

  test('SD-POINTER-02: resolves stacked track presses by the active/index rule', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/Slider/Slider/LoggedFixture', { initial: [40, 40], width: 100 })
    const track = page.getByTestId('logged-track')
    const thumb0 = page.getByTestId('logged-thumb-0')
    const thumb1 = page.getByTestId('logged-thumb-1')
    const changes = page.getByTestId('logged-changes')
    let box = await track.boundingBox()
    expect(box).not.toBeNull()

    // Real stack press before any thumb is active: the lower index paints on
    // top and takes the press; a thumb press emits nothing on its own.
    await page.mouse.click(box!.x + 40, box!.y + box!.height / 2)
    await expect(thumb0).toBeFocused()
    await expect(changes).toHaveText('[]')

    // Activate index 1, move focus outside, press the stack again: index 1 wins.
    await thumb1.focus()
    await expect(thumb1).toBeFocused()
    await page.mouse.click(5, 5)
    await expect(thumb1).not.toBeFocused()
    box = await track.boundingBox()
    await page.mouse.click(box!.x + 40, box!.y + box!.height / 2)
    await expect(thumb1).toBeFocused()

    // Below/above the stack select only a thumb that can move toward the press.
    await first.unmount()
    const second = await mount('components/Slider/Slider/LoggedFixture', { initial: [40, 40], width: 100 })
    const track2 = page.getByTestId('logged-track')
    const box2 = await track2.boundingBox()
    await track2.click({ position: { x: 10, y: box2!.height / 2 } })
    await expect(page.getByTestId('logged-thumb-0')).toBeFocused()
    await expect(page.getByTestId('logged-changes')).toHaveText('[[10,40]]')

    await second.unmount()
    await mount('components/Slider/Slider/LoggedFixture', { initial: [40, 40], width: 100 })
    const track3 = page.getByTestId('logged-track')
    const box3 = await track3.boundingBox()
    await track3.click({ position: { x: 90, y: box3!.height / 2 } })
    await expect(page.getByTestId('logged-thumb-1')).toBeFocused()
    await expect(page.getByTestId('logged-changes')).toHaveText('[[40,90]]')
  })

  test('SD-DOM-08: keeps every thumb reachable across focus and stacked presses', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: [20, 20, 70],
      width: 100,
      labels: ['First', 'Second', 'Third'],
    })
    const thumb0 = page.getByTestId('logged-thumb-0')
    const thumb1 = page.getByTestId('logged-thumb-1')
    const thumb2 = page.getByTestId('logged-thumb-2')

    await thumb0.focus()
    await expect(thumb0).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(thumb1).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(thumb2).toBeFocused()

    // Back to the second overlapping thumb, focus outside, press the stack.
    await thumb1.focus()
    await page.mouse.click(5, 5)
    await expect(thumb1).not.toBeFocused()
    const stackBox = await thumb1.boundingBox()
    expect(stackBox).not.toBeNull()
    await page.mouse.click(stackBox!.x + stackBox!.width / 2, stackBox!.y + stackBox!.height / 2)
    await expect(thumb1).toBeFocused()

    // The same logical thumb moves; DOM order, labels, and refs are untouched.
    const cx = stackBox!.x + stackBox!.width / 2
    const cy = stackBox!.y + stackBox!.height / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 10, cy)
    await page.mouse.up()
    await expect(page.getByTestId('logged-changes')).toHaveText('[[20,30,70]]')
    await expect(thumb0).toHaveAttribute('aria-label', 'First')
    await expect(thumb1).toHaveAttribute('aria-label', 'Second')
    await expect(thumb2).toHaveAttribute('aria-label', 'Third')
    const order = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid^="logged-thumb-"]')).map(el =>
        el.getAttribute('data-testid')
      )
    )
    expect(order).toEqual(['logged-thumb-0', 'logged-thumb-1', 'logged-thumb-2'])
  })

  test('SD-POINTER-03: preserves the grab offset on off-center thumb drags', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: 50,
      orientation: 'vertical',
      height: 100,
    })
    const track = page.getByTestId('logged-track')
    const changes = page.getByTestId('logged-changes')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const cx = box!.x + box!.width / 2
    const pressY = box!.y + box!.height * 0.6

    // Press 10% below center: no request on the press itself (no jump).
    await page.mouse.move(cx, pressY)
    await page.mouse.down()
    await expect(changes).toHaveText('[]')

    // Move to 80% down: offset-preserved 30, never center-mapped 20.
    await page.mouse.move(cx, box!.y + box!.height * 0.8, { steps: 5 })
    await page.mouse.up()
    const log = JSON.parse((await changes.textContent()) ?? '[]') as number[]
    expect(log.length).toBeGreaterThan(0)
    expect(log[log.length - 1]).toBe(30)
    expect(Math.min(...log)).toBeGreaterThanOrEqual(30)
  })

  test('SD-END-01: summarizes a changed pointer interaction once on release', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    const track = page.getByTestId('logged-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height / 2

    await page.mouse.move(box!.x + 90, y)
    await page.mouse.down()
    await page.mouse.move(box!.x + 135, y)
    await page.mouse.move(box!.x + 180, y)
    await page.mouse.up()
    await expect(page.getByTestId('logged-changes')).toHaveText('[30,45,60]')
    await expect(page.getByTestId('logged-ends')).toHaveText('[60]')

    // Release outside the track still ends exactly once, clamped to the bound.
    await first.unmount()
    const second = await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 100 })
    const track2 = page.getByTestId('logged-track')
    const box2 = await track2.boundingBox()
    await page.mouse.move(box2!.x + 60, box2!.y + box2!.height / 2)
    await page.mouse.down()
    await page.mouse.move(700, 400)
    await page.mouse.up()
    await expect(page.getByTestId('logged-ends')).toHaveText('[100]')

    // Range sessions deliver the complete ordered array.
    await second.unmount()
    await mount('components/Slider/Slider/LoggedFixture', { initial: [20, 80], width: 300 })
    const track3 = page.getByTestId('logged-track')
    const box3 = await track3.boundingBox()
    await track3.click({ position: { x: 270, y: box3!.height / 2 } })
    await expect(page.getByTestId('logged-changes')).toHaveText('[[20,90]]')
    await expect(page.getByTestId('logged-ends')).toHaveText('[[20,90]]')
  })

  test('SD-POINTER-04: retains pointer ownership beyond the track', async ({ mount, page }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    const track = page.getByTestId('logged-track')
    await page.evaluate(() => {
      ;(window as any).__cap = []
      const t = document.querySelector('[data-testid="logged-track"]')!
      t.addEventListener('gotpointercapture', (e: Event) =>
        (window as any).__cap.push(['got', (e as PointerEvent).pointerId])
      )
      t.addEventListener('lostpointercapture', (e: Event) =>
        (window as any).__cap.push(['lost', (e as PointerEvent).pointerId])
      )
    })
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height / 2

    await page.mouse.move(box!.x + 90, y)
    await page.mouse.down()
    // FINISH-02F-SL (F38): FF/WebKit deliver `gotpointercapture` lazily — the
    // event flushes on the NEXT input event, never on its own task (D1
    // telemetry: hasPointerCapture true at down, `got` absent after 1s idle,
    // flushed by the following move; proven r17 FF+WK). Capture is genuinely
    // owned at down-time; this 1px move (30 -> 30.33, snaps to 30, no log
    // entry) only flushes the engine's notification. Poll text unchanged.
    await page.mouse.move(box!.x + 91, y)
    // The track owns real pointer capture for the session.
    await expect.poll(() => page.evaluate(() => (window as any).__cap.length)).toBe(1)

    // Drags beyond both ends keep requesting, clamped to the bounds.
    // FINISH-02F-SL (F38): 10px beyond the edge (x~6) stays inside the 800px
    // viewport; FF reports out-of-window moves with buttons=0, which the
    // pinned buttons-zero path (SD-END-03) rightly cancels. Beyond-ness and
    // the 0/100 clamps are what's pinned, not the overshoot distance.
    await page.mouse.move(box!.x - 10, y)
    await page.mouse.move(700, 300)
    const log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(log[0]).toBe(30)
    expect(log).toContain(0)
    expect(log[log.length - 1]).toBe(100)

    // A second pointer cannot drive the owned session.
    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 99, buttons: 1, clientX: 10, clientY: 10 }))
    })
    const logAfter = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(logAfter).toEqual(log)

    await page.mouse.up()
    await expect(page.getByTestId('logged-ends')).toHaveText('[100]')
    const cap = await page.evaluate(() => (window as any).__cap)
    expect(cap[0][0]).toBe('got')
    expect(cap[cap.length - 1][0]).toBe('lost')
    expect(cap[cap.length - 1][1]).toBe(cap[0][1])
  })

  test('SD-POINTER-06: accepts only primary input', async ({ mount, page }) => {
    // Real right-button click is ignored.
    await mount('components/Slider/Slider/SingleSliderFixture')
    const thumb = page.getByTestId('slider-thumb')
    await thumb.click({ button: 'right' })
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')

    // Non-primary pointers are ignored in a real engine.
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 100 })
    const track = page.getByTestId('logged-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.dispatchEvent('pointerdown', {
      button: 0,
      isPrimary: false,
      pointerId: 2,
      clientX: box!.x + 60,
      clientY: box!.y + box!.height / 2,
    })
    await expect(page.getByTestId('logged-changes')).toHaveText('[]')
    await expect(page.getByTestId('logged-thumb-0')).not.toHaveAttribute('data-active')

    // A primary pen press is accepted.
    await track.dispatchEvent('pointerdown', {
      button: 0,
      isPrimary: true,
      pointerId: 5,
      pointerType: 'pen',
      clientX: box!.x + 70,
      clientY: box!.y + box!.height / 2,
    })
    await expect(page.getByTestId('logged-changes')).toHaveText('[70]')
    await expect(page.getByTestId('logged-thumb-0')).toBeFocused()
    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 5, clientX: 0, clientY: 0 }))
    })
    await expect(page.getByTestId('logged-ends')).toHaveText('[70]')
  })

  test('SD-POINTER-07: releases capture and ends dragging on pointerup', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    const track = page.getByTestId('logged-track')
    const thumb = page.getByTestId('logged-thumb-0')
    await page.evaluate(() => {
      ;(window as any).__cap = []
      const t = document.querySelector('[data-testid="logged-track"]')!
      t.addEventListener('gotpointercapture', () => (window as any).__cap.push('got'))
      t.addEventListener('lostpointercapture', () => (window as any).__cap.push('lost'))
    })
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height / 2

    await page.mouse.move(box!.x + 90, y)
    await page.mouse.down()
    await page.mouse.move(box!.x + 120, y)
    await expect(thumb).toHaveAttribute('data-active', '')

    // Release over the document body.
    await page.mouse.move(500, 400)
    await page.mouse.up()
    await expect(thumb).not.toHaveAttribute('data-active')
    await expect(thumb).toBeFocused()
    expect(await page.evaluate(() => (window as any).__cap)).toEqual(['got', 'lost'])
    await expect(page.getByTestId('logged-ends')).toHaveText('[100]')

    // Later moves from the released pointer emit nothing.
    await page.mouse.move(box!.x + 240, y)
    await expect(page.getByTestId('logged-changes')).toHaveText('[30,40,100]')
  })

  test('SD-POINTER-08: cleans the session when disabled or capture is lost mid-drag', async ({
    mount,
    page,
  }) => {
    // Real disable mid-drag cancels the session.
    await mount('components/Slider/Slider/ConstraintFixture')
    const track = page.getByTestId('constraint-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.move(box!.x + box!.width * 0.4, box!.y + box!.height / 2)
    await page.mouse.down()
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:40"]')
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="constraint-disable"]') as HTMLElement).click()
    })
    await page.mouse.move(box!.x + box!.width * 0.8, 10)
    await page.mouse.up()
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:40"]')
    await expect(page.getByTestId('constraint-ends')).toHaveText('[]')
    await expect(page.getByTestId('constraint-slider')).toHaveAttribute('data-disabled', '')

    // Real lostpointercapture mid-drag cancels without an end report.
    // FINISH-02F-SL (F39): FF/WebKit flush `gotpointercapture` only on the
    // next input event (D1 telemetry, r17 FF+WK proven), so a `got` listener
    // would idle forever here — yet capture IS owned at down-time
    // (hasPointerCapture true). Record the real session pointer id from
    // pointerdown instead. D3 telemetry adds a second FF rule: releasing
    // while `got` is still pending silently swallows it (no `got`, no `lost`,
    // session survives), so the same-coordinate move below first flushes a
    // real `got` (value-neutral 40 -> 40, no log entry — and a no-op on
    // Chromium where `got` already fired). The release then drives a real
    // lostpointercapture -> cancel path on every engine.
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 100 })
    const track2 = page.getByTestId('logged-track')
    await page.evaluate(() => {
      ;(window as any).__downId = null
      document
        .querySelector('[data-testid="logged-track"]')!
        .addEventListener('pointerdown', (e: Event) => {
          ;(window as any).__downId = (e as PointerEvent).pointerId
        })
    })
    const box2 = await track2.boundingBox()
    await page.mouse.move(box2!.x + 40, box2!.y + box2!.height / 2)
    await page.mouse.down()
    await expect(page.getByTestId('logged-changes')).toHaveText('[40]')
    await expect.poll(() => page.evaluate(() => (window as any).__downId)).not.toBeNull()
    await page.mouse.move(box2!.x + 40, box2!.y + box2!.height / 2)
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="logged-track"]') as HTMLElement).releasePointerCapture(
        (window as any).__downId
      )
    })
    await page.mouse.move(box2!.x + 80, box2!.y + box2!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('logged-changes')).toHaveText('[40]')
    await expect(page.getByTestId('logged-ends')).toHaveText('[]')
  })

  test('SD-POINTER-09: defers while hidden and resumes when measurable', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/ZeroTrackFixture')
    // Hidden track: a real-engine pointerdown issues nothing.
    await page.evaluate(() => {
      document
        .querySelector('[data-testid="zero-track"]')!
        .dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            button: 0,
            isPrimary: true,
            pointerId: 1,
            clientX: 100,
            clientY: 100,
          })
        )
    })
    await expect(page.getByTestId('zero-changes')).toHaveText('[]')
    await expect(page.getByTestId('zero-value')).toHaveText('20')

    await page.getByTestId('zero-reveal').click()
    const track = page.getByTestId('zero-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.click({ position: { x: 60, y: box!.height / 2 } })
    await expect(page.getByTestId('zero-changes')).toHaveText('[60]')
  })

  test('SD-POINTER-13: enforces value-space distance across RTL and vertical axes', async ({
    mount,
    page,
  }) => {
    // Horizontal RTL: the physically right lower thumb drags left to 50.
    const rtlDrag = await mount('components/Slider/Slider/LoggedFixture', {
      initial: [20, 80],
      width: 200,
      dir: 'rtl',
      step: 10,
      minStepsBetweenThumbs: 3,
    })
    const thumb0 = page.getByTestId('logged-thumb-0')
    let tbox = await thumb0.boundingBox()
    expect(tbox).not.toBeNull()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(tbox!.x - 100, tbox!.y + tbox!.height / 2, { steps: 10 })
    await page.mouse.up()
    let log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(log[log.length - 1]).toEqual([50, 80])

    // The corresponding RTL arrow climbs and clamps identically.
    await rtlDrag.unmount()
    const rtlKeys = await mount('components/Slider/Slider/LoggedFixture', {
      initial: [20, 80],
      width: 200,
      dir: 'rtl',
      step: 10,
      minStepsBetweenThumbs: 3,
    })
    await page.getByTestId('logged-thumb-0').focus()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowLeft')
    }
    log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(log).toEqual([
      [30, 80],
      [40, 80],
      [50, 80],
    ])

    // Vertical: the physically lower thumb drags up to 50.
    await rtlKeys.unmount()
    const vertDrag = await mount('components/Slider/Slider/LoggedFixture', {
      initial: [20, 80],
      orientation: 'vertical',
      height: 200,
      step: 10,
      minStepsBetweenThumbs: 3,
    })
    const vthumb0 = page.getByTestId('logged-thumb-0')
    tbox = await vthumb0.boundingBox()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y - 100, { steps: 10 })
    await page.mouse.up()
    log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(log[log.length - 1]).toEqual([50, 80])

    await vertDrag.unmount()
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: [20, 80],
      orientation: 'vertical',
      height: 200,
      step: 10,
      minStepsBetweenThumbs: 3,
    })
    await page.getByTestId('logged-thumb-0').focus()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowUp')
    }
    log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(log).toEqual([
      [30, 80],
      [40, 80],
      [50, 80],
    ])
  })

  test('SD-END-02: merges native key repeats into one interaction', async ({ mount, page }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 100 })
    const thumb = page.getByTestId('logged-thumb-0')
    await thumb.focus()

    // One native press: one request, one end on the matching keyup.
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('logged-changes')).toHaveText('[21]')
    await expect(page.getByTestId('logged-ends')).toHaveText('[21]')

    // An OS-style repeat stream (synthetic repeats, real handlers): four
    // requests, exactly one end carrying the last candidate. Frame gaps
    // between dispatches mirror real repeats (separate tasks, flushed).
    await page.evaluate(async () => {
      const t = document.querySelector('[data-testid="logged-thumb-0"]')!
      const tick = () => new Promise<void>(r => requestAnimationFrame(() => setTimeout(() => r(), 0)))
      t.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
      for (let i = 0; i < 3; i++) {
        await tick()
        t.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true, repeat: true })
        )
      }
    })
    await expect(page.getByTestId('logged-changes')).toHaveText('[21,22,23,24,25]')
    await page.evaluate(() => {
      document
        .querySelector('[data-testid="logged-thumb-0"]')!
        .dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }))
    })
    await expect(page.getByTestId('logged-ends')).toHaveText('[21,25]')
  })

  test('SD-END-03: stays silent when a changed session is canceled or invalidated', async ({
    mount,
    page,
  }) => {
    // Synthetic cancel events through real handlers (disable and
    // lostpointercapture are pinned with real triggers in SD-POINTER-08).
    for (const kind of ['pointercancel', 'buttons-zero', 'window-blur'] as const) {
      const component = await mount('components/Slider/Slider/LoggedFixture', {
        initial: 20,
        width: 300,
      })
      await page.evaluate(() => {
        ;(window as any).__capId = null
        document
          .querySelector('[data-testid="logged-track"]')!
          .addEventListener('gotpointercapture', (e: Event) => {
            ;(window as any).__capId = (e as PointerEvent).pointerId
          })
      })
      const track = page.getByTestId('logged-track')
      const box = await track.boundingBox()
      await page.mouse.move(box!.x + 120, box!.y + box!.height / 2)
      await page.mouse.down()
      // FINISH-02F-SL (F40): 1px flush move (40 -> 40.33, snaps to 40, no log
      // entry) — FF/WebKit deliver `gotpointercapture` only on the next input
      // event (D1 telemetry, r17 FF+WK proven; see SD-POINTER-04). Ownership
      // itself is real at down-time; the poll below is unchanged.
      await page.mouse.move(box!.x + 121, box!.y + box!.height / 2)
      await expect(page.getByTestId('logged-changes')).toHaveText('[40]')
      await expect.poll(() => page.evaluate(() => (window as any).__capId)).not.toBeNull()

      if (kind === 'pointercancel') {
        await page.evaluate(() => {
          window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: (window as any).__capId }))
        })
      } else if (kind === 'buttons-zero') {
        await page.evaluate(() => {
          window.dispatchEvent(
            new PointerEvent('pointermove', { pointerId: (window as any).__capId, buttons: 0 })
          )
        })
      } else {
        await page.evaluate(() => {
          window.dispatchEvent(new Event('blur'))
        })
      }
      await page.mouse.move(box!.x + 240, box!.y + box!.height / 2)
      await page.mouse.up()
      await expect(page.getByTestId('logged-changes')).toHaveText('[40]')
      await expect(page.getByTestId('logged-ends')).toHaveText('[]')
      await expect(page.getByTestId('logged-thumb-0')).not.toHaveAttribute('data-active')
      await component.unmount()
    }

    // Real thumb removal mid-drag cancels without an end report.
    const card = await mount('components/Slider/Slider/CardinalityFixture')
    let tbox = await page.getByTestId('cardinality-thumb-2').boundingBox()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="cardinality-shrink"]') as HTMLElement).click()
    })
    await page.mouse.up()
    await expect(page.getByTestId('cardinality-ends')).toHaveText('[]')
    await card.unmount()

    // Real unmount mid-drag: no error, no end; a remount works.
    const dying = await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    const dtrack = page.getByTestId('logged-track')
    const dbox = await dtrack.boundingBox()
    await page.mouse.move(dbox!.x + 120, dbox!.y + dbox!.height / 2)
    await page.mouse.down()
    await expect(page.getByTestId('logged-changes')).toHaveText('[40]')
    await dying.unmount()
    await page.mouse.move(dbox!.x + 200, dbox!.y + dbox!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('logged-track')).toHaveCount(0)
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    await expect(page.getByTestId('logged-thumb-0')).toBeVisible()

    // Keyboard sessions invalidated before keyup stay silent.
    for (const kind of ['blur', 'disable'] as const) {
      const component = await mount('components/Slider/Slider/LoggedFixture', {
        initial: 20,
        width: 300,
      })
      const thumb = page.getByTestId('logged-thumb-0')
      await thumb.focus()
      await page.keyboard.down('ArrowRight')
      await expect(page.getByTestId('logged-changes')).toHaveText('[21]')
      if (kind === 'blur') {
        await page.evaluate(() => {
          ;(document.querySelector('[data-testid="logged-thumb-0"]') as HTMLElement).blur()
        })
      } else {
        // Same-story remount preserves state but flips props: a true disable.
        await mount('components/Slider/Slider/LoggedFixture', {
          initial: 20,
          width: 300,
          disabled: true,
        })
        await expect(page.getByTestId('logged-thumb-0')).toHaveAttribute('tabindex', '-1')
      }
      await page.keyboard.up('ArrowRight')
      await expect(page.getByTestId('logged-ends')).toHaveText('[]')
      await component.unmount()
    }
  })

  test('SD-CTRL-05: uses current props when configuration changes during a drag', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/ConstraintFixture')
    const track = page.getByTestId('constraint-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height / 2

    await page.mouse.move(box!.x + box!.width * 0.4, y)
    await page.mouse.down()
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:40"]')

    // Swap value, bounds, step, and handler mid-drag without releasing.
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="constraint-swap"]') as HTMLElement).click()
    })
    await page.mouse.move(box!.x + box!.width * 0.8, y)
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:40","B:50"]')
    await page.mouse.up()
    await expect(page.getByTestId('constraint-ends')).toHaveText('["B:50"]')
  })

  test('SD-DYNAMIC-02: rerendered constraints apply to the next interaction', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/ConstraintFixture')
    const thumb = page.getByTestId('constraint-thumb')
    await page.getByTestId('constraint-update').click()
    await expect(thumb).toHaveAttribute('aria-orientation', 'vertical')
    await expect(thumb).toHaveAttribute('aria-valuemin', '10')
    await expect(thumb).toHaveAttribute('aria-valuemax', '60')
    await expect(page.getByTestId('constraint-changes')).toHaveText('[]')

    // Next key uses the new grid: (20-10)/5 = 2 -> 3 -> 25.
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:25"]')

    // Next pointer action uses the new vertical axis: near-top press -> 55.
    const track = page.getByTestId('constraint-track')
    const box = await track.boundingBox()
    await track.click({ position: { x: box!.width / 2, y: box!.height * 0.1 } })
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:25","A:55"]')
  })

  test('SD-DYNAMIC-03: discards stale drag state on mid-gesture cardinality change', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/CardinalityFixture')
    const track = page.getByTestId('cardinality-track')
    const trackBox = await track.boundingBox()
    expect(trackBox).not.toBeNull()

    // Shrink mid-drag: later moves and the release stay silent.
    let tbox = await page.getByTestId('cardinality-thumb-2').boundingBox()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="cardinality-shrink"]') as HTMLElement).click()
    })
    await page.mouse.move(trackBox!.x + trackBox!.width * 0.9, trackBox!.y + trackBox!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('cardinality-changes')).toHaveText('[]')
    await expect(page.getByTestId('cardinality-ends')).toHaveText('[]')

    // Grow mid-drag: the old release commits nothing.
    tbox = await page.getByTestId('cardinality-thumb-1').boundingBox()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(trackBox!.x + trackBox!.width * 0.4, trackBox!.y + trackBox!.height / 2)
    await expect(page.getByTestId('cardinality-changes')).toHaveText('[[10,40]]')
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="cardinality-grow"]') as HTMLElement).click()
    })
    await page.mouse.move(trackBox!.x + trackBox!.width * 0.5, trackBox!.y + trackBox!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('cardinality-changes')).toHaveText('[[10,40]]')
    await expect(page.getByTestId('cardinality-ends')).toHaveText('[]')

    // A new index-2 drag requests normally after the growth.
    tbox = await page.getByTestId('cardinality-thumb-2').boundingBox()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(trackBox!.x + trackBox!.width, trackBox!.y + trackBox!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('cardinality-changes')).toHaveText('[[10,40],[10,20,100]]')
    await expect(page.getByTestId('cardinality-ends')).toHaveText('[[10,20,100]]')
  })

  test('SD-COMP-01: preserves fractional precision across keyboard and drag', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: 0.2,
      min: 0,
      max: 1,
      step: 0.1,
      width: 300,
    })
    const thumb = page.getByTestId('logged-thumb-0')
    const track = page.getByTestId('logged-track')
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('logged-changes')).toHaveText('[0.3]')

    const tbox = await thumb.boundingBox()
    const trackBox = await track.boundingBox()
    await page.mouse.move(tbox!.x + 1, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(trackBox!.x + trackBox!.width * 0.8, tbox!.y + tbox!.height / 2)
    await page.mouse.up()
    const log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(log[log.length - 1]).toBe(0.8)
    for (const v of log as number[]) {
      expect(JSON.stringify(v)).toMatch(/^\d(\.\d)?$/)
    }
    const style = await thumb.getAttribute('style')
    expect(style).toContain('--reference-slider-thumb-position: 80%')
  })

  test('SD-POINTER-05: drives the drag from one owned touchpoint', async ({
    mount,
    page,
    browserName,
  }) => {
    // FINISH-02F-SL (F41): HARNESS class (H1 precedent — Combobox CB-COMP
    // touch leg): CDP touch injection (`page.context().newCDPSession`) exists
    // only in Chromium (`CDP session is only available in Chromium` on
    // FF/WebKit by construction). The whole test is CDP-driven, so it is
    // chromium-only; the owned-touchpoint contract stays pinned on Chromium.
    // No product change.
    test.skip(browserName !== 'chromium', 'CDP touch injection is Chromium-only (H-class)')
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    const track = page.getByTestId('logged-track')
    const thumb = page.getByTestId('logged-thumb-0')
    const box = await track.boundingBox()
    const tbox = await thumb.boundingBox()
    expect(box).not.toBeNull()
    expect(tbox).not.toBeNull()
    const y = tbox!.y + tbox!.height / 2

    const cdp = await page.context().newCDPSession(page)
    const touch = (type: string, touchPoints: Array<{ x: number; y: number; id?: number }>) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints } as any)

    // Owned touch drags along the track while an unrelated touch moves elsewhere.
    await touch('touchStart', [{ x: tbox!.x + tbox!.width / 2, y, id: 1 }])
    await touch('touchMove', [{ x: box!.x + 90, y, id: 1 }])
    await touch('touchMove', [
      { x: box!.x + 120, y, id: 1 },
      { x: box!.x + 250, y: y + 60, id: 2 },
    ])
    await touch('touchMove', [
      { x: box!.x + 150, y, id: 1 },
      { x: box!.x + 250, y: y + 80, id: 2 },
    ])
    await touch('touchEnd', [])
    const log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    // Only the owned touchpoint requests; id 2 (~83) never leaks in.
    expect(log).toEqual([30, 40, 50])
    expect(await page.getByTestId('logged-ends').textContent()).toBe('[50]')

    // No compatibility mouse sequence adds a callback after the gesture.
    await page.waitForTimeout(300)
    expect(JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')).toEqual([
      30, 40, 50,
    ])
    const touchAction = await page.evaluate(
      () => window.getComputedStyle(document.querySelector('[data-testid="logged-slider"]')!).touchAction
    )
    expect(touchAction).toBe('none')
  })

  test('SD-COMP-03: retains a vertical touch gesture beyond the track', async ({
    mount,
    page,
    browserName,
  }) => {
    // FINISH-02F-SL (F42): HARNESS class, same CDP wall as SD-POINTER-05
    // (F41; H1 precedent): `newCDPSession` is Chromium-only, and the whole
    // test is CDP-driven touch. Chromium-only; no product change.
    test.skip(browserName !== 'chromium', 'CDP touch injection is Chromium-only (H-class)')
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: 50,
      orientation: 'vertical',
      height: 200,
    })
    const track = page.getByTestId('logged-track')
    const thumb = page.getByTestId('logged-thumb-0')
    const box = await track.boundingBox()
    const tbox = await thumb.boundingBox()
    expect(box).not.toBeNull()
    expect(tbox).not.toBeNull()
    const cx = tbox!.x + tbox!.width / 2
    const cy = tbox!.y + tbox!.height / 2

    const cdp = await page.context().newCDPSession(page)
    const touch = (type: string, touchPoints: Array<{ x: number; y: number; id?: number }>) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints } as any)

    // Off-center press: no request on contact.
    await touch('touchStart', [{ x: cx, y: cy - 5, id: 1 }])
    await expect(page.getByTestId('logged-changes')).toHaveText('[]')

    // Small move maps 1:1 with the offset (5px above center ~ +2.5 units up).
    await touch('touchMove', [{ x: cx, y: cy - 15, id: 1 }])
    const first = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(first).toEqual([55])

    // Beyond both ends clamps to max/min.
    await touch('touchMove', [{ x: cx, y: box!.y - 20, id: 1 }])
    await touch('touchMove', [{ x: cx, y: box!.y + box!.height + 20, id: 1 }])
    await touch('touchEnd', [])
    const log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(log).toContain(100)
    expect(log).toContain(0)
    expect(log[log.length - 1]).toBe(0)
    await expect(page.getByTestId('logged-ends')).toHaveText('[0]')
    await expect(thumb).not.toHaveAttribute('data-active')
    await expect(thumb).toBeFocused()
  })

  test('SD-A11Y-01: publishes exact role, name, orientation, value, and neighbor bounds', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/A11yFixture')
    const scalar = page.getByTestId('a11y-scalar-thumb')
    await expect(scalar).toHaveAttribute('role', 'slider')
    await expect(scalar).toHaveAttribute('aria-label', 'Volume')
    await expect(scalar).toHaveAttribute('aria-orientation', 'horizontal')
    await expect(scalar).toHaveAttribute('aria-valuenow', '30')
    await expect(scalar).toHaveAttribute('aria-valuemin', '0')
    await expect(scalar).toHaveAttribute('aria-valuemax', '100')

    const range0 = page.getByTestId('a11y-range-0')
    const range1 = page.getByTestId('a11y-range-1')
    await expect(range0).toHaveAttribute('aria-label', 'Min price')
    await expect(range0).toHaveAttribute('aria-valuenow', '20')
    await expect(range0).toHaveAttribute('aria-valuemax', '70')
    await expect(range1).toHaveAttribute('aria-label', 'Max price')
    await expect(range1).toHaveAttribute('aria-valuenow', '70')
    await expect(range1).toHaveAttribute('aria-valuemin', '20')

    const disabled = page.getByTestId('a11y-disabled-thumb')
    await expect(disabled).toHaveAttribute('aria-disabled', 'true')
    await expect(disabled).toHaveAttribute('data-disabled', '')

    await expect(page.getByTestId('a11y-vert-thumb')).toHaveAttribute('aria-orientation', 'vertical')
    const rtl = page.getByTestId('a11y-rtl-thumb')
    await expect(rtl).toHaveAttribute('aria-valuenow', '60')
    const rtlStyle = await rtl.getAttribute('style')
    expect(rtlStyle).toContain('right: 60%')

    // Platform accessibility tree exposes every slider with its name.
    const aria = await page.getByTestId('a11y-root').ariaSnapshot()
    expect(aria).toContain('slider "Volume"')
    expect(aria).toContain('slider "Min price"')
    expect(aria).toContain('slider "Max price"')
    expect(aria).toContain('slider "Disabled" [disabled]')
    expect(aria).toContain('slider "Vertical"')
    expect(aria).toContain('slider "Rtl"')

    // Scanner half: the A11yFixture mount exercises scalar, range,
    // disabled, vertical, and RTL thumbs in one story; #root scoping
    // covers it whole (no portals in Slider).
    await expectNoAxeViolations(page, { include: '#root' })
  })

  test('SD-ENV-02: keeps pointer sessions singular under StrictMode', async ({ mount, page }) => {
    const component = await mount('components/Slider/Slider/StrictFixture')
    const track = page.getByTestId('strict-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height / 2

    // Double-mounted effects must not duplicate listeners: exact sequences.
    await page.mouse.move(box!.x + 90, y)
    await page.mouse.down()
    await page.mouse.move(box!.x + 180, y)
    await page.mouse.up()
    await expect(page.getByTestId('strict-changes')).toHaveText('[30,60]')
    await expect(page.getByTestId('strict-ends')).toHaveText('[60]')

    // Unmount mid-tree is clean; a remount works.
    await component.unmount()
    await expect(page.getByTestId('strict-track')).toHaveCount(0)
    await mount('components/Slider/Slider/StrictFixture')
    await expect(page.getByTestId('strict-thumb')).toBeVisible()
  })

  test('SD-ENV-03: preserves the contract inside a ShadowRoot', async ({ mount, page }) => {
    await mount('components/Slider/Slider/ShadowFixture')
    const host = page.getByTestId('shadow-host')
    const thumb0 = host.locator('[data-testid="shadow-thumb-0"]')
    const thumb1 = host.locator('[data-testid="shadow-thumb-1"]')
    await expect(thumb0).toBeVisible()

    // RTL keyboard step through the shadow boundary.
    await thumb0.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('shadow-changes')).toHaveText('[[21,80]]')
    const activeInShadow = await page.evaluate(() => {
      const h = document.querySelector('[data-testid="shadow-host"]')!
      return h.shadowRoot!.activeElement!.getAttribute('data-testid')
    })
    expect(activeInShadow).toBe('shadow-thumb-0')
    await expect(thumb0).toHaveAttribute('aria-valuemax', '80')
    await expect(thumb1).toHaveAttribute('aria-valuemin', '21')

    // Drag the second thumb beyond the track: clamped, captured, released.
    await page.evaluate(() => {
      ;(window as any).__cap = []
      const h = document.querySelector('[data-testid="shadow-host"]')!
      const t = h.shadowRoot!.querySelector('[data-testid="shadow-thumb-1"]')!
      t.addEventListener('gotpointercapture', () => (window as any).__cap.push('got'))
      t.addEventListener('lostpointercapture', () => (window as any).__cap.push('lost'))
    })
    const trackBox = await host.locator('[data-testid="shadow-track"]').boundingBox()
    const tbox = await thumb1.boundingBox()
    expect(trackBox).not.toBeNull()
    expect(tbox).not.toBeNull()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    // FINISH-02F-SL (F43): 10px beyond the edge (x~6) stays inside the 800px
    // viewport (D2 telemetry: trackBox.x=16, so -50 lands at x=-34). FF
    // reports out-of-window moves with buttons=0, which the pinned
    // buttons-zero path (SD-END-03) rightly cancels — the old -50 drag lost
    // the whole session on FF. Beyond-ness and the 100 clamp are what's
    // pinned, not the overshoot distance.
    await page.mouse.move(trackBox!.x - 10, tbox!.y + tbox!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('shadow-changes')).toHaveText('[[21,80],[21,100]]')
    await expect(page.getByTestId('shadow-ends')).toHaveText('[[21,80],[21,100]]')
    expect(await page.evaluate(() => (window as any).__cap)).toEqual(['got', 'lost'])
    await expect(thumb1).toBeFocused()
    const thumbStyle = await thumb1.getAttribute('style')
    expect(thumbStyle).toContain('--reference-slider-thumb-position: 100%')
  })

  test('SD-ENV-03: honors RTL inherited from outside the ShadowRoot', async ({ mount, page }) => {
    await mount('components/Slider/Slider/ShadowFixture', { dirOnHost: true })
    const host = page.getByTestId('shadow-host')
    const thumb0 = host.locator('[data-testid="shadow-thumb-0"]')
    await expect(thumb0).toBeVisible()
    // No dir attribute inside the shadow tree: detection falls back to the
    // computed direction, which crosses the boundary.
    const innerDir = await page.evaluate(() => {
      const h = document.querySelector('[data-testid="shadow-host"]')!
      return (h.shadowRoot!.querySelector('[data-testid="shadow-inner"]') as HTMLElement).getAttribute('dir')
    })
    expect(innerDir).toBeNull()
    await thumb0.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('shadow-changes')).toHaveText('[[21,80]]')
  })

  test('FEATURES #6: invisible hit-area reaches 24px without repainting the cap', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 50, width: 100 })
    const thumb = page.getByTestId('logged-thumb-0')
    const box = await thumb.boundingBox()
    expect(box).not.toBeNull()
    // Painted DSP fader cap is untouched: 24 wide, 16 tall.
    expect(box!.width).toBeCloseTo(24, 0)
    expect(box!.height).toBeCloseTo(16, 0)
    const before = await thumb.evaluate(el => {
      const cs = window.getComputedStyle(el, '::before')
      return { content: cs.content, width: cs.width, height: cs.height }
    })
    expect(before.content).toBe('""')
    expect(before.width).toBe('24px')
    expect(before.height).toBe('24px')

    await mount('components/Slider/Slider/LoggedFixture', {
      initial: 50,
      orientation: 'vertical',
      height: 100,
    })
    const vthumb = page.getByTestId('logged-thumb-0')
    const vbox = await vthumb.boundingBox()
    expect(vbox).not.toBeNull()
    expect(vbox!.width).toBeCloseTo(16, 0)
    expect(vbox!.height).toBeCloseTo(24, 0)
    const vbefore = await vthumb.evaluate(el => {
      const cs = window.getComputedStyle(el, '::before')
      return { content: cs.content, width: cs.width, height: cs.height }
    })
    expect(vbefore.content).toBe('""')
    expect(vbefore.width).toBe('24px')
    expect(vbefore.height).toBe('24px')
  })

  test('SD-KEY-07: Shift+Arrow passes through in a real engine', async ({ mount, page }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 100 })
    const thumb = page.getByTestId('logged-thumb-0')
    const changes = page.getByTestId('logged-changes')
    await thumb.focus()
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('Shift+ArrowLeft')
    await expect(changes).toHaveText('[]')
    await expect(thumb).toHaveAttribute('aria-valuenow', '20')
    await page.keyboard.press('ArrowRight')
    await expect(changes).toHaveText('[21]')
  })

  test('SD-DOM-12 and SD-CTRL-07: diagnose malformed anatomy and arrays in the browser', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/DiagFixture')
    await expect(page.getByTestId('diag-changes')).toHaveText('0')

    await page.getByTestId('diag-dup-track').click()
    await expect(page.getByTestId('diag-error')).toContainText('Exactly one Slider.Track')
    await expect(page.locator('[role="slider"]')).toHaveCount(0)

    await page.getByTestId('diag-dup-range').click()
    await expect(page.getByTestId('diag-error')).toContainText('At most one Slider.Range')

    await page.getByTestId('diag-bad-array').click()
    await expect(page.getByTestId('diag-error')).toContainText('violates minimum required distance')
    await expect(page.getByTestId('diag-changes')).toHaveText('0')
  })
})

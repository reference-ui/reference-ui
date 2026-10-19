/**
 * Slider browser proof: parts, sessions, and focus rings. Renders the
 * story fixtures to pin part anatomy and clamped ARIA, keyboard and
 * pointer value changes, track-press thumb choice, RTL and vertical
 * mapping, session lifecycles, StrictMode and ShadowRoot behavior, and
 * keyboard-only focus-ring parity.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Slider pins', () => {
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
});

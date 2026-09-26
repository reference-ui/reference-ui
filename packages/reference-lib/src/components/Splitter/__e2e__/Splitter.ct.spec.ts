import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Splitter Composition Gates & Browser Proofs', () => {
  test('SP-DOM-01: Renders splitter panels and handle and responds to keyboard resize', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Basic')
    const handle = page.getByTestId('splitter-handle-0')
    const display = page.getByTestId('splitter-value-display')

    await expect(handle).toBeVisible()
    await expect(handle).toHaveAttribute('role', 'separator')
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
    await expect(display).toHaveText('Layout: 40% / 60%')

    await page.waitForTimeout(300)
    await snap(page, 'resting')

    // Hover handle
    await handle.hover()
    await page.waitForTimeout(200)
    await snap(page, 'handle-hover')

    // Keyboard ArrowRight increases left panel by 1% -> 41% / 59%
    await handle.focus()
    await page.waitForTimeout(200)
    await snap(page, 'handle-focus')

    await page.keyboard.press('ArrowRight')
    await expect(handle).toHaveAttribute('aria-valuenow', '41')
    await expect(display).toHaveText('Layout: 41% / 59%')

    await page.waitForTimeout(200)
    await snap(page, 'resized-41')

    // Keyboard Shift+ArrowRight increases by 10% -> 51% / 49%
    await page.keyboard.press('Shift+ArrowRight')
    await expect(handle).toHaveAttribute('aria-valuenow', '51')
    await expect(display).toHaveText('Layout: 51% / 49%')

    await page.waitForTimeout(200)
    await snap(page, 'resized-51')
  })

  test('SP-DOM-03: Handles expose honest constrained ARIA values', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Basic')
    const handle = page.getByTestId('splitter-handle-0')

    // Default floor: panels clamp to [5, 95], and the separator says so.
    await expect(handle).toHaveAttribute('aria-valuemin', '5')
    await expect(handle).toHaveAttribute('aria-valuemax', '95')
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
  })

  test('SP-KEY-04: Home and End move to feasible min/max bounds', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    const display = page.getByTestId('constrained-value-display')

    // Author constraints surface as the separator's feasible range.
    await expect(handle).toHaveAttribute('aria-valuemin', '20')
    await expect(handle).toHaveAttribute('aria-valuemax', '60')

    await handle.focus()
    await page.keyboard.press('Home')
    await expect(display).toHaveText('Layout: 20% / 80%')
    await expect(handle).toHaveAttribute('aria-valuenow', '20')

    await page.keyboard.press('End')
    await expect(display).toHaveText('Layout: 60% / 40%')
    await expect(handle).toHaveAttribute('aria-valuenow', '60')

    // At the bound, further motion is an exact no-op: no onChange.
    const changeCount = page.getByTestId('change-count')
    const before = await changeCount.innerText()
    await page.keyboard.press('End')
    await expect(display).toHaveText('Layout: 60% / 40%')
    await expect(changeCount).toHaveText(before)
  })

  test('SP-CTRL-06: Cross-axis keys fire no onChange', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    const changeCount = page.getByTestId('change-count')
    const display = page.getByTestId('constrained-value-display')

    await expect(changeCount).toHaveText('0')
    await handle.focus()
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowDown')
    await expect(changeCount).toHaveText('0')
    await expect(display).toHaveText('Layout: 40% / 60%')
  })

  test('SP-END-01: Drag calls onChangeEnd exactly once', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    const box = await handle.boundingBox()
    expect(box).not.toBeNull()

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2, { steps: 4 })
    await page.mouse.up()

    await expect(page.getByTestId('change-end-count')).toHaveText('1')
    await expect(handle).toHaveAttribute('aria-valuenow', '50')
  })

  test('SP-END-03: Pointer press without movement fires no callbacks', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    const box = await handle.boundingBox()
    expect(box).not.toBeNull()

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.up()

    await expect(page.getByTestId('change-count')).toHaveText('0')
    await expect(page.getByTestId('change-end-count')).toHaveText('0')
  })

  test('SP-COLLAPSE-04: Keyboard resize past min snaps a collapsible panel to collapsed size', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/CollapsibleDemo')
    const handle = page.getByTestId('collapsible-handle-0')
    const display = page.getByTestId('collapsible-value-display')

    await handle.focus()
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowLeft')
    }
    await expect(display).toHaveText('Layout: 20% / 80%')

    // One more step past min collapses to the opted-in collapsed size.
    await page.keyboard.press('ArrowLeft')
    await expect(display).toHaveText('Layout: 5% / 95%')

    // And a step back out restores the minimum, not a fractional size.
    await page.keyboard.press('ArrowRight')
    await expect(display).toHaveText('Layout: 20% / 80%')
  })

  test('SP-DOM-02: Vertical orientation supports ArrowDown and ArrowUp resize', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Vertical')
    const handle = page.getByTestId('splitter-vertical-handle')

    await expect(handle).toBeVisible()
    await expect(handle).toHaveAttribute('role', 'separator')
    await expect(handle).toHaveAttribute('aria-valuenow', '50')

    await page.waitForTimeout(300)
    await snap(page, 'vertical-resting')

    await handle.focus()
    await page.keyboard.press('ArrowDown')
    await expect(handle).toHaveAttribute('aria-valuenow', '51')

    await page.waitForTimeout(200)
    await snap(page, 'vertical-resized-51')
  })
})

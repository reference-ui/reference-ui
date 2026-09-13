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

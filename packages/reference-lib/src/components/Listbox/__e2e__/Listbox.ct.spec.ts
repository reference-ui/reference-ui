import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-DOM-01: Renders listbox and options, selects option on click and updates state', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Basic')
    await expect(page.getByTestId('listbox-fixture-root')).toBeVisible()

    const listbox = page.getByTestId('test-listbox')
    const optApple = page.getByTestId('opt-apple')
    const optBanana = page.getByTestId('opt-banana')
    const optDisabled = page.getByTestId('opt-disabled')
    const display = page.getByTestId('listbox-value-display')

    await expect(listbox).toHaveAttribute('role', 'listbox')
    await expect(optApple).toHaveAttribute('role', 'option')
    await expect(optApple).toHaveAttribute('aria-selected', 'true')
    await expect(optApple).toHaveAttribute('data-state', 'selected')
    await expect(optBanana).toHaveAttribute('aria-selected', 'false')
    await expect(optBanana).toHaveAttribute('data-state', 'unselected')
    const optBox = await optApple.boundingBox()
    expect(optBox?.height).toBe(34)
    await expect(display).toHaveText('Selected: apple')

    await page.waitForTimeout(300)
    await snap(page, 'listbox-default')

    // Hover banana
    await optBanana.hover()
    await page.waitForTimeout(200)
    await snap(page, 'listbox-hover-banana')

    // Click Banana -> selects banana
    await optBanana.click()
    await expect(optBanana).toHaveAttribute('aria-selected', 'true')
    await expect(optBanana).toHaveAttribute('data-state', 'selected')
    await expect(optApple).toHaveAttribute('aria-selected', 'false')
    await expect(optApple).toHaveAttribute('data-state', 'unselected')
    await expect(display).toHaveText('Selected: banana')

    await page.waitForTimeout(200)
    await snap(page, 'listbox-selected-banana')

    // Hover disabled
    await optDisabled.hover({ force: true })
    await page.waitForTimeout(200)
    await snap(page, 'listbox-hover-disabled')
  })

  test('LB-KEY-01: Keyboard navigation and roving focus', async ({ mount, page }) => {
    await mount('components/Listbox/Listbox/Basic')
    await expect(page.getByTestId('listbox-fixture-root')).toBeVisible()

    const optApple = page.getByTestId('opt-apple')
    const optBanana = page.getByTestId('opt-banana')
    const display = page.getByTestId('listbox-value-display')

    await optApple.focus()
    await expect(optApple).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(optBanana).toBeFocused()

    await page.waitForTimeout(200)
    await snap(page, 'listbox-keyboard-focused')

    await page.keyboard.press('Enter')
    await expect(optBanana).toHaveAttribute('aria-selected', 'true')
    await expect(display).toHaveText('Selected: banana')
  })

  test('LB-DOM-02: Multiple selection toggles items', async ({ mount, page }) => {
    await mount('components/Listbox/Listbox/Multiple')
    await expect(page.getByTestId('listbox-multi-root')).toBeVisible()

    const optEmail = page.getByTestId('opt-m-email')
    const optSms = page.getByTestId('opt-m-sms')
    const display = page.getByTestId('listbox-multi-value-display')

    await expect(optEmail).toHaveAttribute('aria-selected', 'true')
    await expect(optSms).toHaveAttribute('aria-selected', 'false')
    await expect(display).toHaveText('Selected: email')

    await page.waitForTimeout(300)
    await snap(page, 'listbox-multi-default')

    // Click SMS to add to selection
    await optSms.click()
    await expect(optEmail).toHaveAttribute('aria-selected', 'true')
    await expect(optSms).toHaveAttribute('aria-selected', 'true')
    await expect(display).toHaveText('Selected: email, sms')

    await page.waitForTimeout(200)
    await snap(page, 'listbox-multi-selected')
  })

  test('LB-DOM-03: Section headers render grouped options', async ({ mount, page }) => {
    await mount('components/Listbox/Listbox/Sections')
    await expect(page.getByTestId('listbox-sections-root')).toBeVisible()

    const optReact = page.getByTestId('opt-s-react')
    await expect(optReact).toHaveAttribute('aria-selected', 'true')

    await page.waitForTimeout(300)
    await snap(page, 'listbox-sections')
  })
})

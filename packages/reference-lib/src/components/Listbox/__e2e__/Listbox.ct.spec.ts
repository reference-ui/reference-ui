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
    const optCherry = page.getByTestId('opt-cherry')
    const optDisabled = page.getByTestId('opt-disabled')
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

    // End / Home jump to enabled boundaries
    await page.keyboard.press('End')
    await expect(optCherry).toBeFocused()
    await page.keyboard.press('Home')
    await expect(optApple).toBeFocused()

    // Disabled option is out of the tab order and skipped by wrap navigation
    await expect(optDisabled).toHaveAttribute('tabindex', '-1')
    await page.keyboard.press('ArrowDown')
    await expect(optBanana).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(optCherry).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(optApple).toBeFocused()
  })

  test('LB-MULTI-01: Multiple selection appends the activated value', async ({ mount, page }) => {
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

  test('LB-COMP-04: Grouped listbox preserves regions and flattens navigation', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Sections')
    await expect(page.getByTestId('listbox-sections-root')).toBeVisible()

    const optReact = page.getByTestId('opt-s-react')
    const optVue = page.getByTestId('opt-s-vue')
    const optNode = page.getByTestId('opt-s-node')
    await expect(optReact).toHaveAttribute('aria-selected', 'true')

    await page.waitForTimeout(300)
    await snap(page, 'listbox-sections')

    // Authored group regions keep their roles and labels
    const groups = page.getByRole('group')
    await expect(groups).toHaveCount(2)
    await expect(groups.first()).toHaveAttribute('aria-labelledby')

    // Arrow navigation flattens across sections in DOM order
    await optReact.focus()
    await page.keyboard.press('ArrowDown')
    await expect(optVue).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(optNode).toBeFocused()
  })

  test('LB-DOM-02: Listbox should expose multiselectability only in multiple-selection mode', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Modes')
    await expect(page.getByTestId('modes-root')).toBeVisible()

    await expect(page.getByTestId('modes-single')).not.toHaveAttribute('aria-multiselectable')
    await expect(page.getByTestId('modes-multiple')).toHaveAttribute(
      'aria-multiselectable',
      'true'
    )
  })

  test('LB-DOM-03: Listbox options should mirror controlled selection in ARIA and data state', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ControlledMirror')
    await expect(page.getByTestId('mirror-root')).toBeVisible()

    const alpha = page.getByTestId('mirror-alpha')
    const bravo = page.getByTestId('mirror-bravo')
    const charlie = page.getByTestId('mirror-charlie')
    const calls = page.getByTestId('mirror-calls')

    await expect(alpha).toHaveAttribute('aria-selected', 'false')
    await expect(bravo).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('data-selected', '')
    await expect(charlie).toHaveAttribute('aria-selected', 'false')

    await page.getByTestId('mirror-set-charlie').click()
    await expect(bravo).toHaveAttribute('aria-selected', 'false')
    await expect(bravo).not.toHaveAttribute('data-selected')
    await expect(charlie).toHaveAttribute('aria-selected', 'true')
    await expect(charlie).toHaveAttribute('data-selected', '')
    await expect(calls).toHaveText('0')
  })

  test('LB-DOM-06: Listbox should preserve empty and zero-like string identities', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ZeroValues')
    await expect(page.getByTestId('zero-root')).toBeVisible()

    const optEmpty = page.getByTestId('zero-opt-empty')
    const optZero = page.getByTestId('zero-opt-zero')
    const valDisplay = page.getByTestId('zero-val')

    await page.getByTestId('zero-set-empty').click()
    await expect(optEmpty).toHaveAttribute('aria-selected', 'true')
    await expect(optZero).toHaveAttribute('aria-selected', 'false')
    await expect(valDisplay).toHaveText('')

    await page.getByTestId('zero-set-zero').click()
    await expect(optEmpty).toHaveAttribute('aria-selected', 'false')
    await expect(optZero).toHaveAttribute('aria-selected', 'true')
    await expect(valDisplay).toHaveText('0')
  })

  test('LB-DOM-08: Listbox should choose one deterministic mounted option for initial Tab entry', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RovingTab')
    await expect(page.getByTestId('roving-root')).toBeVisible()

    const alpha = page.getByTestId('roving-alpha')
    const charlie = page.getByTestId('roving-charlie')

    await expect(charlie).toHaveAttribute('tabindex', '0')
    await expect(alpha).toHaveAttribute('tabindex', '-1')

    await page.getByTestId('roving-set-null').click()
    await expect(alpha).toHaveAttribute('tabindex', '0')
    await expect(charlie).toHaveAttribute('tabindex', '-1')
  })

  test('LB-DOM-10: Listbox should apply controlled single-null-vertical defaults when behavior props are omitted', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Defaults')
    await expect(page.getByTestId('defaults-root')).toBeVisible()

    const listbox = page.getByTestId('defaults-listbox')
    const alpha = page.getByTestId('defaults-alpha')
    const calls = page.getByTestId('defaults-calls')

    await expect(listbox).toHaveAttribute('aria-orientation', 'vertical')
    await expect(listbox).not.toHaveAttribute('aria-multiselectable')

    await alpha.focus()
    await page.keyboard.press('Space')
    await expect(calls).toContainText('"alpha"')
    await expect(alpha).toHaveAttribute('aria-selected', 'false')
  })

  test('LB-SINGLE-01: Listbox should request one single selection when an enabled option is clicked', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const alpha = page.getByTestId('req-alpha')
    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await bravo.click()
    await expect(calls).toContainText('"bravo"')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-selected', 'false')
  })

  test('LB-SINGLE-04: Listbox should not select merely because arrows move focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const alpha = page.getByTestId('req-alpha')
    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await alpha.focus()
    await page.keyboard.press('ArrowDown')
    await expect(bravo).toBeFocused()
    await expect(calls).toHaveText('[]')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
  })

  test('LB-SINGLE-05: Listbox should treat activation of the already-selected option as a no-op', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const alpha = page.getByTestId('req-alpha')
    const calls = page.getByTestId('req-calls')

    await alpha.click()
    await expect(calls).toHaveText('[]')

    await alpha.focus()
    await page.keyboard.press('Space')
    await expect(calls).toHaveText('[]')

    await page.keyboard.press('Enter')
    await expect(calls).toHaveText('[]')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
  })

  test('LB-SINGLE-08: Listbox should let consumer handlers cancel option selection before its default runs', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Cancel')
    await expect(page.getByTestId('cancel-root')).toBeVisible()

    const bravo = page.getByTestId('cancel-bravo')
    const calls = page.getByTestId('cancel-calls')
    const log = page.getByTestId('cancel-log')

    await bravo.click()
    await expect(log).toContainText('consumer-click')
    await expect(calls).toHaveText('0')

    await bravo.focus()
    await page.keyboard.press('Enter')
    await expect(log).toContainText('consumer-keydown-Enter')
    await expect(calls).toHaveText('0')
  })

  test('LB-MULTI-03: Listbox should emit a deterministic deduplicated multiple-selection array', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiUnknown')
    await expect(page.getByTestId('multi-unknown-root')).toBeVisible()

    const bravo = page.getByTestId('mu-bravo')
    const calls = page.getByTestId('mu-calls')

    await bravo.click()
    await expect(calls).toContainText('["alpha","bravo","charlie","unknown-2","unknown-1"]')
  })

  test('LB-KEY-02: Horizontal LTR Listbox should move with Left and Right while preserving native vertical keys', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Horizontal')
    await expect(page.getByTestId('horiz-root')).toBeVisible()

    const alpha = page.getByTestId('horiz-alpha')
    const bravo = page.getByTestId('horiz-bravo')
    const charlie = page.getByTestId('horiz-charlie')

    await bravo.focus()
    await page.keyboard.press('ArrowRight')
    await expect(charlie).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(bravo).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(alpha).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(alpha).toBeFocused()
  })

  test('LB-KEY-03: Horizontal RTL Listbox should reverse its Left and Right movement', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/HorizontalRTL')
    await expect(page.getByTestId('rtl-root')).toBeVisible()

    const alpha = page.getByTestId('rtl-alpha')
    const bravo = page.getByTestId('rtl-bravo')
    const charlie = page.getByTestId('rtl-charlie')

    await bravo.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(charlie).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(bravo).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(alpha).toBeFocused()
  })

  test('LB-KEY-04: Listbox typeahead should wrap to the next enabled matching option without selecting it', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Typeahead')
    await expect(page.getByTestId('type-root')).toBeVisible()

    const apple = page.getByTestId('type-apple')
    const avocado = page.getByTestId('type-avocado')
    const calls = page.getByTestId('type-calls')

    await apple.focus()
    await page.keyboard.type('a')
    await expect(avocado).toBeFocused()

    await page.keyboard.type('a')
    await expect(apple).toBeFocused()
    await expect(calls).toHaveText('[]')
  })

  test('LB-KEY-05: Listbox should treat Space as typeahead text only while a search buffer is active', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Typeahead')
    await expect(page.getByTestId('type-root')).toBeVisible()

    const ny = page.getByTestId('type-ny')
    const calls = page.getByTestId('type-calls')

    await ny.focus()
    await page.keyboard.type('New Y ')
    await expect(calls).toHaveText('[]')

    await page.waitForTimeout(1100)

    await page.keyboard.press('Space')
    await expect(calls).toContainText('"new-york"')
  })

  test('LB-POINTER-01: Listbox should issue one request for a primary mouse press without duplicating it on release', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await bravo.scrollIntoViewIfNeeded()
    const box = await bravo.boundingBox()
    if (!box) throw new Error('Missing bounding box')

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await expect(calls).toContainText('"bravo"')

    await page.mouse.move(box.x + box.width + 100, box.y + box.height + 100)
    await page.mouse.up()

    const callCount = (await calls.textContent()) || ''
    expect((callCount.match(/bravo/g) || []).length).toBe(1)
  })

  test('LB-DYNAMIC-01: Listbox should follow option identity through insertion and reorder while navigating current order', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DynamicOrder')
    await expect(page.getByTestId('dyn-order-root')).toBeVisible()

    const bravo = page.getByTestId('dyn-bravo')
    await bravo.focus()

    await page.getByTestId('dyn-insert-delta').click()
    await expect(bravo).toBeFocused()

    await page.getByTestId('dyn-reorder-charlie').click()
    await expect(bravo).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('dyn-charlie')).toBeFocused()
  })

  test('LB-DYNAMIC-02: Listbox should recover deterministically when its focused option is removed', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DynamicRemove')
    await expect(page.getByTestId('dyn-remove-root')).toBeVisible()

    const bravo = page.getByTestId('dynr-bravo')
    await bravo.focus()

    await page.getByTestId('dyn-remove-bravo').click()
    await expect(page.getByTestId('dynr-delta')).toBeFocused()
  })

  test('LB-VIRT-02: Virtual Listbox options should expose position metadata for the complete logical set', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    await page.getByTestId('virt-mount-0-4').click()
    await expect(page.getByTestId('virt-opt-0')).toHaveAttribute('aria-setsize', '50')
    await expect(page.getByTestId('virt-opt-0')).toHaveAttribute('aria-posinset', '1')
    await expect(page.getByTestId('virt-opt-4')).toHaveAttribute('aria-posinset', '5')
  })

  test('LB-VIRT-03: Virtual Listbox should scroll before focusing the next unmounted logical option', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    await page.getByTestId('virt-mount-0-4').click()
    const opt4 = page.getByTestId('virt-opt-4')
    const scrollLog = page.getByTestId('virt-scroll-log')

    await opt4.focus()
    await page.keyboard.press('ArrowDown')
    await expect(scrollLog).toContainText('5')

    await page.getByTestId('virt-mount-5-10').click()
    await expect(page.getByTestId('virt-opt-5')).toBeFocused()
  })

  test('LB-VIRT-05: Virtual Listbox typeahead should resolve and mount an offscreen logical match before focusing it', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    await page.getByTestId('virt-mount-0-4').click()
    const opt1 = page.getByTestId('virt-opt-1')
    const scrollLog = page.getByTestId('virt-scroll-log')

    await opt1.focus()
    await page.keyboard.type('z')
    await expect(scrollLog).toContainText('37')

    await page.getByTestId('virt-mount-35-40').click()
    await expect(page.getByTestId('virt-opt-37')).toBeFocused()
  })

  test('LB-VIRT-07: Virtual Listbox should preserve an offscreen controlled selection until its option mounts', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    await page.getByTestId('virt-mount-0-4').click()
    await page.getByTestId('virt-set-37').click()

    await expect(page.getByTestId('virt-opt-37')).toHaveCount(0)

    await page.getByTestId('virt-mount-35-40').click()
    const opt37 = page.getByTestId('virt-opt-37')
    await expect(opt37).toHaveAttribute('aria-selected', 'true')
    await expect(opt37).toHaveAttribute('data-selected', '')
  })

  test('B-02: interactive and portaled row content never (de)selects', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RowActions')
    const display = page.getByTestId('rowactions-value-display')
    await expect(display).toHaveText('Selected: events')

    // (a) In-row trigger press: the popover opens, selection untouched.
    await page.getByTestId('row-trigger-events').click()
    await expect(page.getByTestId('row-popover-events')).toBeVisible()
    await expect(display).toHaveText('Selected: events')

    // (b) Portaled action click bubbles through the React tree but is outside
    // the row's DOM subtree: the action fires, selection untouched.
    await page.getByTestId('row-action-pin').click()
    await expect(display).toHaveText('Selected: events')
    const log = JSON.parse(
      (await page.getByTestId('rowactions-log').textContent()) ?? '[]'
    )
    expect(log).toEqual(['action:pin'])

    // Plain row press still toggles.
    await page.getByTestId('row-opt-alerts').click()
    await expect(display).toHaveText('Selected: events, alerts')
  })

  test('B-38: selected option uses the muted wash, not the button token', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Basic')
    const selected = page.getByTestId('opt-apple')
    await expect(selected).toHaveAttribute('aria-selected', 'true')
    const bg = await selected.evaluate(el => getComputedStyle(el).backgroundColor)
    // Muted wash (gray.800 in dark mode, L≈28%) is nowhere near the
    // near-white button token (gray.50, L≈98%): lightness must stay < 50%.
    let lightness: number
    if (bg.startsWith('oklch')) {
      // Chrome serializes L as 0..1 ("oklch(0.278 …)"); percent form divides.
      const raw = Number(bg.match(/[\d.]+/)?.[0] ?? '1')
      lightness = raw > 1 ? raw / 100 : raw
    } else {
      const rgb = bg.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255]
      const [r, g, b] = [...rgb, 255, 255, 255].slice(0, 3)
      lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255
    }
    expect(lightness).toBeLessThan(0.5)
  })
})

test.describe('Listbox finish-line P2A gaps', () => {
  test('LB-DOM-04: Listbox should keep disabled options out of every interactive path', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DisabledPaths')
    await expect(page.getByTestId('dis-root')).toBeVisible()

    const alpha = page.getByTestId('dis-alpha')
    const bravo = page.getByTestId('dis-bravo')
    const charlie = page.getByTestId('dis-charlie')
    const calls = page.getByTestId('dis-calls')

    await expect(bravo).toHaveAttribute('aria-disabled', 'true')
    await expect(bravo).toHaveAttribute('data-disabled', '')
    await expect(bravo).toHaveAttribute('tabindex', '-1')

    // Tab entry skips the disabled option
    await page.getByTestId('dis-before').focus()
    await page.keyboard.press('Tab')
    await expect(alpha).toBeFocused()

    // Pointer activation: no focus steal, no request (forced: Playwright
    // gates aria-disabled clicks, so force simulates the OS-level press)
    await bravo.click({ force: true })
    await expect(alpha).toBeFocused()
    await expect(calls).toHaveText('[]')

    // Arrow navigation skips the disabled option
    await page.keyboard.press('ArrowDown')
    await expect(charlie).toBeFocused()

    // Typeahead never matches the disabled option
    await page.keyboard.type('b')
    await expect(charlie).toBeFocused()
    await expect(calls).toHaveText('[]')

    // Programmatic focus + Space/Enter: still no request
    await bravo.evaluate(el => (el as HTMLElement).focus())
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')
    await expect(calls).toHaveText('[]')
    await bravo.evaluate(el => (el as HTMLElement).blur())

    // Exactly one roving tab stop, never on the disabled option
    await expect(page.getByTestId('dis-listbox').locator('[tabindex="0"]')).toHaveCount(1)
    await expect(charlie).toHaveAttribute('tabindex', '0')
    await expect(bravo).toHaveAttribute('tabindex', '-1')
  })

  test('LB-DOM-05: Listbox should preserve native root and option contracts for each orientation', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/NativeProps')
    await expect(page.getByTestId('nat-root')).toBeVisible()

    const vertical = page.getByTestId('nat-vertical')
    const horizontal = page.getByTestId('nat-horizontal')
    const vAlpha = page.getByTestId('nat-v-alpha')

    await expect(vertical).toHaveAttribute('aria-orientation', 'vertical')
    await expect(horizontal).toHaveAttribute('aria-orientation', 'horizontal')

    // Consumer props survive on both hosts
    await expect(vertical).toHaveAttribute('data-consumer', 'v-root')
    await expect(vertical).toHaveClass(/consumer-vertical/)
    await expect(horizontal).toHaveAttribute('data-consumer', 'h-root')
    await expect(vAlpha).toHaveAttribute('data-consumer', 'v-opt')
    await expect(vAlpha).toHaveClass(/consumer-opt/)
    expect(
      await vertical.evaluate(el => (el as HTMLElement).style.borderWidth)
    ).toBe('3px')
    expect(await vAlpha.evaluate(el => (el as HTMLElement).style.borderWidth)).toBe('5px')

    // Exact native refs
    await page.getByTestId('nat-report').click()
    const report = JSON.parse((await page.getByTestId('nat-ref-report').textContent()) ?? '{}')
    expect(report).toEqual({
      vRoot: 'HTMLDivElement',
      vRootTag: 'DIV',
      hRoot: 'HTMLDivElement',
      vOpt: 'HTMLDivElement',
      vOptTag: 'DIV',
    })

    // Keyboard interaction leaves consumer props untouched; root events fire
    await vAlpha.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('nat-v-bravo')).toBeFocused()
    await expect(vertical).toHaveAttribute('data-consumer', 'v-root')
    await expect(vAlpha).toHaveAttribute('data-consumer', 'v-opt')
    await vAlpha.click()
    await expect(page.getByTestId('nat-events')).toHaveText('["root-click"]')
  })

  test('LB-DOM-07: Listbox should remain semantically empty without inventing a focus target', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Listbox/Listbox/EmptyTab')
    await expect(page.getByTestId('empty-root')).toBeVisible()

    const listbox = page.getByTestId('empty-listbox')
    await expect(listbox).toHaveAttribute('role', 'listbox')
    await expect(listbox.getByRole('option')).toHaveCount(0)
    await expect(listbox).not.toHaveAttribute('tabindex')

    // DIAG D1 (landing-sequence/DIAG.md): WebKit skips buttons in
    // sequential Tab, so the button-to-button walk below cannot run
    // there; the contract (empty listbox never captures the walk) is
    // pinned with not-focused assertions instead. SCOPE-1 P2-F28 probe.
    const isWebKit = browserName === 'webkit'

    // Skipped in tab order initially
    await page.getByTestId('empty-before').focus()
    await page.keyboard.press('Tab')
    if (isWebKit) {
      await expect(listbox).not.toBeFocused()
    } else {
      await expect(page.getByTestId('empty-toggle-tab')).toBeFocused()
    }
    await page.keyboard.press('Tab')
    if (isWebKit) {
      await expect(listbox).not.toBeFocused()
    } else {
      await expect(page.getByTestId('empty-after')).toBeFocused()
    }

    // Focusable only with the explicit consumer tab index
    await page.getByTestId('empty-toggle-tab').click()
    await expect(listbox).toHaveAttribute('tabindex', '0')
    if (isWebKit) {
      // Click never focused the toggle and Tab never lands on buttons;
      // seed focus behind the listbox so Shift+Tab proves the explicit
      // tabindex stop (probe: lands on empty-listbox).
      await page.getByTestId('empty-after').focus()
    }
    await page.keyboard.press('Shift+Tab')
    await expect(listbox).toBeFocused()
  })

  test('LB-DOM-09: Listbox typeahead should use explicit text before current meaningful rendered text', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/TextNames')
    await expect(page.getByTestId('text-root')).toBeVisible()

    const zulu = page.getByTestId('text-zulu')
    const bravo = page.getByTestId('text-bravo')
    const calls = page.getByTestId('text-calls')

    await zulu.focus()
    await page.keyboard.type('b')
    await expect(bravo).toBeFocused()

    await page.waitForTimeout(1100)
    await page.keyboard.type('z')
    await expect(zulu).toBeFocused()

    // Decorative markup never matches
    await page.waitForTimeout(1100)
    await page.keyboard.type('q')
    await expect(zulu).toBeFocused()

    await expect(calls).toHaveText('[]')
  })

  test('LB-DOM-11: Listbox should represent a controlled selected-disabled option without making it interactive', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/SelectedDisabled')
    await expect(page.getByTestId('sd-root')).toBeVisible()

    const alpha = page.getByTestId('sd-alpha')
    const bravo = page.getByTestId('sd-bravo')
    const calls = page.getByTestId('sd-calls')

    await expect(bravo).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('data-selected', '')
    await expect(bravo).toHaveAttribute('aria-disabled', 'true')
    await expect(bravo).toHaveAttribute('data-disabled', '')
    await expect(bravo).toHaveAttribute('tabindex', '-1')

    await page.getByTestId('sd-before').focus()
    await page.keyboard.press('Tab')
    await expect(alpha).toBeFocused()

    await page.keyboard.type('b')
    await expect(alpha).toBeFocused()

    await bravo.click({ force: true })
    await expect(alpha).toBeFocused()
    await expect(calls).toHaveText('[]')

    await bravo.evaluate(el => (el as HTMLElement).focus())
    await page.keyboard.press('Enter')
    await expect(calls).toHaveText('[]')
    await expect(bravo).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-disabled', 'true')
  })

  test('LB-DOM-12: Listbox should deliver native scroll events from its fixed root without interpreting them', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ScrollNative')
    await expect(page.getByTestId('scroll-root')).toBeVisible()

    const listbox = page.getByTestId('scroll-listbox')
    const alpha = page.getByTestId('scroll-alpha')
    const events = page.getByTestId('scroll-events')
    const calls = page.getByTestId('scroll-calls')

    await alpha.focus()
    await expect(alpha).toHaveAttribute('tabindex', '0')

    // Programmatic scroll
    await listbox.evaluate(el => {
      ;(el as HTMLElement).scrollTop = 40
    })
    await expect(events).toHaveText('["DIV"]')

    // User scroll input
    await listbox.hover()
    await page.mouse.wheel(0, 60)
    await expect(events).toHaveText('["DIV","DIV"]')

    // Collection state untouched
    await expect(alpha).toBeFocused()
    await expect(alpha).toHaveAttribute('tabindex', '0')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(calls).toHaveText('[]')
  })

  test('LB-GROUP-01: Listbox should preserve native group roles and accessible labels around nested Options', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/NativeGroups')
    await expect(page.getByTestId('ng-root')).toBeVisible()

    const listbox = page.getByTestId('ng-listbox')
    await expect(page.getByTestId('ng-group-warm')).toHaveAttribute('role', 'group')
    await expect(page.getByTestId('ng-group-warm')).toHaveAttribute('aria-label', 'Warm colors')
    await expect(page.getByTestId('ng-group-cool')).toHaveAttribute(
      'aria-labelledby',
      'ng-cool-label'
    )
    await expect(page.getByTestId('ng-heading-warm')).toBeVisible()
    await expect(page.getByTestId('ng-decor-bravo')).toBeVisible()
    await expect(page.getByTestId('ng-inner-button')).toBeVisible()

    // Every nested Option keeps its role; no wrapper or extra host appears
    await expect(listbox.getByRole('option')).toHaveCount(4)
    await expect(page.getByTestId('ng-apple')).toHaveAttribute('role', 'option')
    await expect(page.getByTestId('ng-kiwi')).toHaveAttribute('role', 'option')
    await expect(listbox.locator('select, input, [role="dialog"]')).toHaveCount(0)
  })

  test('LB-GROUP-02: Listbox should flatten grouped and ungrouped Options in current composed DOM order', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/GroupedOrder')
    await expect(page.getByTestId('go-root')).toBeVisible()

    const alpha = page.getByTestId('go-alpha')
    const bravo = page.getByTestId('go-bravo')
    const delta = page.getByTestId('go-delta')
    const echo = page.getByTestId('go-echo')
    const calls = page.getByTestId('go-calls')

    await page.getByTestId('go-before').focus()
    await page.keyboard.press('Tab')
    await expect(alpha).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(delta).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(echo).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(alpha).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(echo).toBeFocused()
    await page.keyboard.press('Home')
    await expect(alpha).toBeFocused()
    await page.keyboard.press('End')
    await expect(echo).toBeFocused()

    await expect(page.getByTestId('go-listbox').locator('[tabindex="0"]')).toHaveCount(1)
    await expect(calls).toHaveText('[]')
  })

  test('LB-GROUP-03: Listbox typeahead should cross native group boundaries while excluding group labels', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/NativeGroups')
    await expect(page.getByTestId('ng-root')).toBeVisible()

    const apple = page.getByTestId('ng-apple')
    const zulu = page.getByTestId('ng-zulu')
    const calls = page.getByTestId('ng-calls')

    // 'z' crosses groups to the Zulu option (not the "Zulu region" label)
    await apple.focus()
    await page.keyboard.type('z')
    await expect(zulu).toBeFocused()

    // Decorative "Bravo" text and group labels never match
    await page.waitForTimeout(1100)
    await page.keyboard.type('b')
    await expect(zulu).toBeFocused()

    // Repeated "a" wraps back to the only enabled A option across groups
    await page.waitForTimeout(1100)
    await page.keyboard.type('a')
    await expect(apple).toBeFocused()
    await page.keyboard.type('a')
    await expect(apple).toBeFocused()

    await expect(calls).toHaveText('[]')
  })

  test('LB-GROUP-04: Listbox should recompute flattened order when Options move between native groups', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/GroupedDynamic')
    await expect(page.getByTestId('gd-root')).toBeVisible()

    const calls = page.getByTestId('gd-calls')

    await page.getByTestId('gd-bravo').focus()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('gd-alpha')).toBeFocused()

    // Insert a group and move bravo into it: focus + selection follow identity
    await page.getByTestId('gd-bravo').focus()
    await page.getByTestId('gd-layout-1').click()
    await expect(page.getByTestId('gd-bravo')).toBeFocused()
    await expect(page.getByTestId('gd-bravo')).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('gd-alpha')).toBeFocused()

    // Reorder groups and drop alpha: navigation follows the latest DOM order
    await page.getByTestId('gd-bravo').focus()
    await page.getByTestId('gd-layout-2').click()
    await expect(page.getByTestId('gd-bravo')).toBeFocused()
    await expect(page.getByTestId('gd-alpha')).toHaveCount(0)
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('gd-charlie')).toBeFocused()
    await expect(page.getByTestId('gd-bravo')).toHaveAttribute('aria-selected', 'true')

    await expect(calls).toHaveText('[]')
  })

  test('LB-GROUP-05: Listbox should ignore group markup when deriving option state', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/NativeGroups')
    await expect(page.getByTestId('ng-root')).toBeVisible()

    const kiwi = page.getByTestId('ng-kiwi')

    // Group attributes preserved but not inherited
    await expect(page.getByTestId('ng-group-nested')).toHaveAttribute('aria-disabled', 'true')
    await expect(kiwi).not.toHaveAttribute('aria-disabled')
    await expect(kiwi).not.toHaveAttribute('data-disabled')
    await expect(page.getByTestId('ng-group-zulu').getByRole('option')).toHaveCount(0)

    // The deeply nested option navigates and typeaheads normally
    await page.getByTestId('ng-apple').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('ng-zulu')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(kiwi).toBeFocused()

    await page.getByTestId('ng-apple').focus()
    await page.keyboard.type('k')
    await expect(kiwi).toBeFocused()
  })

  test('LB-GROUP-06: Virtual Listbox should keep logical position metadata independent of group depth', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/VirtualGroups')
    await expect(page.getByTestId('vg-root')).toBeVisible()

    const scrollLog = page.getByTestId('vg-scroll-log')
    for (const index of [20, 21, 22, 23]) {
      await expect(page.getByTestId(`vg-opt-${index}`)).toHaveAttribute('aria-setsize', '50')
      await expect(page.getByTestId(`vg-opt-${index}`)).toHaveAttribute(
        'aria-posinset',
        String(index + 1)
      )
    }

    // Logical navigation ignores DOM order: 21 -> mounted 22 directly
    await page.getByTestId('vg-opt-21').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vg-opt-22')).toBeFocused()
    await expect(scrollLog).toHaveText('[]')

    // Reorder only the group DOM: labels and metadata survive
    await page.getByTestId('vg-swap').click()
    await expect(page.getByTestId('vg-group-a')).toHaveAttribute('aria-label', 'Group A')
    await expect(page.getByTestId('vg-group-inner')).toHaveAttribute('aria-label', 'Inner B')
    for (const index of [20, 21, 22, 23]) {
      await expect(page.getByTestId(`vg-opt-${index}`)).toHaveAttribute('aria-setsize', '50')
      await expect(page.getByTestId(`vg-opt-${index}`)).toHaveAttribute(
        'aria-posinset',
        String(index + 1)
      )
    }

    // Navigation still follows the logical adapter, not group position
    await page.getByTestId('vg-opt-23').focus()
    await page.keyboard.press('ArrowDown')
    await expect(scrollLog).toHaveText('[24]')
  })

  test('LB-SINGLE-02: Listbox should request one single selection when Space activates the focused option', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const alpha = page.getByTestId('req-alpha')
    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await bravo.focus()
    await page.keyboard.press('Space')
    await expect(calls).toHaveText('["bravo"]')
    await expect(bravo).toBeFocused()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-selected', 'false')
  })

  test('LB-SINGLE-03: Listbox should request the same single selection when Enter activates an option', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await bravo.focus()
    await page.keyboard.press('Enter')
    await expect(calls).toHaveText('["bravo"]')
    await expect(bravo).toBeFocused()
    expect(((await calls.textContent()) ?? '').match(/bravo/g)).toHaveLength(1)
  })

  test('LB-SINGLE-06: Listbox should preserve controlled selection when its parent rejects a request', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const alpha = page.getByTestId('req-alpha')
    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await bravo.click()
    await expect(calls).toHaveText('["bravo"]')
    await expect(bravo).toBeFocused()
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-selected', 'false')
    await expect(bravo).not.toHaveAttribute('data-selected')
  })

  test('LB-SINGLE-07: Listbox should adopt a programmatically selected mounted option without emitting a request', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ProgSelect')
    await expect(page.getByTestId('ps-root')).toBeVisible()

    const charlie = page.getByTestId('ps-charlie')
    const calls = page.getByTestId('ps-calls')

    await page.getByTestId('ps-outside').click()
    await page.getByTestId('ps-set-charlie').click()
    await expect(charlie).toHaveAttribute('aria-selected', 'true')
    await expect(charlie).toHaveAttribute('data-selected', '')
    await expect(calls).toHaveText('[]')
    await expect(charlie).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('ps-alpha')).toHaveAttribute('tabindex', '-1')

    await page.keyboard.press('Tab')
    await expect(charlie).toBeFocused()
  })

  test('LB-MULTI-02: Listbox should remove only the activated selected value in multiple mode', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiToggle')
    await expect(page.getByTestId('mt-root')).toBeVisible()

    const alpha = page.getByTestId('mt-alpha')
    const calls = page.getByTestId('mt-calls')

    await alpha.click()
    await expect(calls).toHaveText('[["charlie"]]')
    await expect(alpha).toBeFocused()
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('mt-charlie')).toHaveAttribute('aria-selected', 'true')
  })

  test('LB-MULTI-04: Listbox should keep multiple selection unchanged during every focus-only movement', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiToggle')
    await expect(page.getByTestId('mt-root')).toBeVisible()

    const alpha = page.getByTestId('mt-alpha')
    const bravo = page.getByTestId('mt-bravo')
    const charlie = page.getByTestId('mt-charlie')
    const calls = page.getByTestId('mt-calls')

    await alpha.focus()
    await page.keyboard.press('ArrowDown')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(charlie).toBeFocused()
    await page.keyboard.press('Home')
    await expect(alpha).toBeFocused()
    await page.keyboard.press('End')
    await expect(charlie).toBeFocused()
    await page.keyboard.type('b')
    await expect(bravo).toBeFocused()

    await expect(calls).toHaveText('[]')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-selected', 'false')
    await expect(charlie).toHaveAttribute('aria-selected', 'true')
  })

  test('LB-MULTI-05: Listbox should not invent range or select-all behavior for modifier keys', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiFive')
    await expect(page.getByTestId('m5-root')).toBeVisible()

    const calls = page.getByTestId('m5-calls')
    await page.getByTestId('m5-charlie').focus()

    for (const key of [
      'Shift+ArrowDown',
      'Control+ArrowDown',
      'Meta+ArrowDown',
      'Shift+Home',
      'Shift+End',
    ]) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('ControlOrMeta+a')

    await expect(calls).toHaveText('[]')
    await expect(page.getByTestId('m5-bravo')).toHaveAttribute('aria-selected', 'true')
    for (const item of ['alpha', 'charlie', 'delta', 'echo']) {
      await expect(page.getByTestId(`m5-${item}`)).toHaveAttribute('aria-selected', 'false')
    }
  })

  test('LB-MULTI-06: Listbox should keep multiple selection fully controlled across rejection and programmatic updates', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiFive')
    await expect(page.getByTestId('m5-root')).toBeVisible()

    const alpha = page.getByTestId('m5-alpha')
    const calls = page.getByTestId('m5-calls')

    // Rejected request never changes ARIA
    await alpha.click()
    await expect(calls).toHaveText('[["alpha","bravo"]]')
    await expect(page.getByTestId('m5-bravo')).toHaveAttribute('aria-selected', 'true')
    await expect(alpha).toHaveAttribute('aria-selected', 'false')

    // Programmatic rerender updates ARIA without firing onChange
    await page.getByTestId('m5-set-charlie').click()
    await expect(calls).toHaveText('[["alpha","bravo"]]')
    await expect(page.getByTestId('m5-charlie')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('m5-bravo')).toHaveAttribute('aria-selected', 'false')
    await expect(alpha).toBeFocused()
  })

  test('LB-MULTI-07: Listbox should retain controlled disabled and unmounted values without activating them', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiRetained')
    await expect(page.getByTestId('mr-root')).toBeVisible()

    const disabled = page.getByTestId('mr-disabled')
    const calls = page.getByTestId('mr-calls')

    await expect(disabled).toHaveAttribute('aria-selected', 'true')
    await expect(disabled).toHaveAttribute('aria-disabled', 'true')
    await expect(disabled).toHaveAttribute('data-selected', '')
    await expect(disabled).toHaveAttribute('data-disabled', '')

    // Every activation modality fails against the disabled option
    await disabled.click({ force: true })
    await page.getByTestId('mr-alpha').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('mr-bravo')).toBeFocused()
    await page.keyboard.type('d')
    await expect(page.getByTestId('mr-bravo')).toBeFocused()
    await disabled.evaluate(el => (el as HTMLElement).focus())
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')
    await expect(calls).toHaveText('[]')

    // No hidden option is invented for the offscreen value
    await expect(page.locator('[data-value="offscreen"]')).toHaveCount(0)

    // A request still carries the retained values through
    await page.getByTestId('mr-alpha').click()
    await expect(calls).toHaveText('[["alpha","disabled","offscreen"]]')
  })

  test('LB-MULTI-08: Listbox should default omitted multiple value to a controlled empty array', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiOmitted')
    await expect(page.getByTestId('mo-root')).toBeVisible()

    const alpha = page.getByTestId('mo-alpha')
    const calls = page.getByTestId('mo-calls')

    await alpha.click()
    await expect(calls).toHaveText('[["alpha"]]')
    await expect(alpha).toHaveAttribute('aria-selected', 'false')
    await expect(alpha).not.toHaveAttribute('data-selected')
    await expect(page.getByTestId('mo-bravo')).toHaveAttribute('aria-selected', 'false')
  })

  test('LB-KEY-06: Listbox should leave unsupported navigation keys and modifiers to the browser or application', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await bravo.focus()
    await page.keyboard.press('Escape')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('PageUp')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('PageDown')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('Alt+ArrowDown')
    await page.keyboard.press('Control+ArrowDown')
    await page.keyboard.press('Meta+ArrowDown')
    await expect(calls).toHaveText('[]')

    // Modified activation never selects
    await bravo.focus()
    for (const key of [
      'Control+Enter',
      'Meta+Enter',
      'Alt+Enter',
      'Shift+Enter',
      'Control+Space',
      'Shift+Space',
    ]) {
      await page.keyboard.press(key)
    }
    await expect(calls).toHaveText('[]')

    // Native Tab movement is untouched
    await bravo.focus()
    await page.keyboard.press('Tab')
    if (browserName === 'firefox') {
      // SCOPE-1 P-F27 probe: Firefox keeps focus on the lone sequential
      // stop (two Tabs stay on req-bravo) while Chromium leaves it.
      // Platform wrap, not product hijack: no request was made (calls []
      // above) and focus never enters unmanaged territory.
      await expect(bravo).toBeFocused()
    } else {
      expect(await page.evaluate(() => document.activeElement?.getAttribute('role'))).not.toBe(
        'option'
      )
    }
  })

  test('LB-KEY-07: Listbox should ignore composite keyboard commands originating in interactive descendants', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Descendants')
    await expect(page.getByTestId('desc-root')).toBeVisible()

    const input = page.getByTestId('desc-input')
    const button = page.getByTestId('desc-button')
    const calls = page.getByTestId('desc-calls')

    await page.getByTestId('desc-alpha').focus()
    await input.click()
    await input.pressSequentially('hi')
    await expect(page.getByTestId('desc-text')).toHaveText('hi')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Home')
    await expect(input).toBeFocused()
    await expect(page.getByTestId('desc-alpha')).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('desc-bravo')).toHaveAttribute('tabindex', '-1')
    await expect(calls).toHaveText('[]')

    await button.focus()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('desc-clicks')).toHaveText('1')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('desc-clicks')).toHaveText('2')
    await expect(calls).toHaveText('[]')
    await expect(page.getByTestId('desc-alpha')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('desc-bravo')).toHaveAttribute('aria-selected', 'false')
  })

  test('LB-POINTER-02: Listbox should select once from direct touch activation without a hover prerequisite', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    // No hover, no keyboard: a bare touch press + compat mouse sequence
    await bravo.evaluate(el => {
      const target = el as HTMLElement
      target.dispatchEvent(
        new PointerEvent('pointerdown', { pointerType: 'touch', button: 0, bubbles: true })
      )
      target.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }))
      target.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true }))
      target.dispatchEvent(new MouseEvent('click', { button: 0, bubbles: true }))
    })
    await expect(calls).toHaveText('["bravo"]')
  })

  test('LB-POINTER-03: Listbox should leave focus and selection unchanged when an option is only hovered', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const alpha = page.getByTestId('req-alpha')
    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await alpha.focus()
    await bravo.hover()
    await expect(alpha).toBeFocused()
    await expect(alpha).toHaveAttribute('tabindex', '0')
    await expect(bravo).toHaveAttribute('tabindex', '-1')

    // Pen hover likewise carries no collection state
    await bravo.evaluate(el =>
      (el as HTMLElement).dispatchEvent(
        new PointerEvent('pointerenter', { pointerType: 'pen', bubbles: true })
      )
    )
    await page.mouse.move(0, 0)
    await expect(alpha).toBeFocused()
    await expect(alpha).toHaveAttribute('tabindex', '0')
    await expect(calls).toHaveText('[]')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
  })

  test('LB-POINTER-04: Disabled Listbox options should remain inert across all input modalities while preserving authored props', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DisabledAuthored')
    await expect(page.getByTestId('da-root')).toBeVisible()

    const alpha = page.getByTestId('da-alpha')
    const bravo = page.getByTestId('da-bravo')
    const charlie = page.getByTestId('da-charlie')
    const calls = page.getByTestId('da-calls')
    const consumer = page.getByTestId('da-consumer')

    await expect(bravo).toHaveAttribute('data-consumer', 'kept')
    await expect(bravo).toHaveClass(/consumer-kept/)
    expect(await bravo.evaluate(el => (el as HTMLElement).style.borderWidth)).toBe('7px')

    await alpha.focus()
    await bravo.click({ force: true })
    await expect(alpha).toBeFocused()

    // Touch press sequence against the disabled option
    await bravo.evaluate(el => {
      const target = el as HTMLElement
      target.dispatchEvent(
        new PointerEvent('pointerdown', { pointerType: 'touch', button: 0, bubbles: true })
      )
      target.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }))
      target.dispatchEvent(new MouseEvent('click', { button: 0, bubbles: true }))
    })

    // Keyboard + typeahead attempts
    await page.keyboard.press('ArrowDown')
    await expect(charlie).toBeFocused()
    await page.keyboard.type('b')
    await expect(charlie).toBeFocused()
    await bravo.evaluate(el => (el as HTMLElement).focus())
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')

    await expect(consumer).toHaveText('[]')
    await expect(calls).toHaveText('[]')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-selected', 'false')

    // Authored props survive every attempt
    await expect(bravo).toHaveAttribute('data-consumer', 'kept')
    await expect(bravo).toHaveClass(/consumer-kept/)
    expect(await bravo.evaluate(el => (el as HTMLElement).style.borderWidth)).toBe('7px')
  })

  test('LB-DYNAMIC-03: Listbox should not correct a controlled value when its selected option is removed', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/SelectedRemove')
    await expect(page.getByTestId('sr-root')).toBeVisible()

    const calls = page.getByTestId('sr-calls')

    await page.getByTestId('sr-outside').click()
    await page.getByTestId('sr-remove-bravo').click()
    await expect(page.getByTestId('sr-bravo')).toHaveCount(0)
    await expect(calls).toHaveText('[]')
    await expect(page.getByTestId('sr-alpha')).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByTestId('sr-charlie')).toHaveAttribute('aria-selected', 'false')

    await page.getByTestId('sr-remount-bravo').click()
    await expect(page.getByTestId('sr-bravo')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('sr-bravo')).toHaveAttribute('data-selected', '')
    await expect(calls).toHaveText('[]')
  })

  test('LB-DYNAMIC-04: Listbox should remove a newly disabled option from navigation without clearing controlled selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DynamicDisable')
    await expect(page.getByTestId('dd-root')).toBeVisible()

    const bravo = page.getByTestId('dd-bravo')
    const charlie = page.getByTestId('dd-charlie')
    const calls = page.getByTestId('dd-calls')

    await bravo.focus()
    await page.getByTestId('dd-disable-bravo').click()
    await expect(bravo).toHaveAttribute('aria-disabled', 'true')
    await expect(bravo).toHaveAttribute('data-disabled', '')
    await expect(bravo).toHaveAttribute('tabindex', '-1')
    await expect(charlie).toBeFocused()
    await expect(bravo).toHaveAttribute('aria-selected', 'true')
    await expect(calls).toHaveText('[]')

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('dd-alpha')).toBeFocused()

    await bravo.click({ force: true })
    await expect(page.getByTestId('dd-alpha')).toBeFocused()
    await expect(calls).toHaveText('[]')
  })

  test('LB-DYNAMIC-05: Listbox should replace an option registration when its value changes', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DynamicValue')
    await expect(page.getByTestId('dv-root')).toBeVisible()

    const calls = page.getByTestId('dv-calls')

    await page.getByTestId('dv-to-delta').click()
    await expect(page.getByTestId('dv-middle')).toHaveAttribute('data-value', 'delta')
    await expect(page.locator('[data-value="bravo"]')).toHaveCount(0)

    await page.getByTestId('dv-alpha').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('dv-middle')).toBeFocused()

    await page.getByTestId('dv-middle').click()
    await expect(calls).toHaveText('["delta"]')

    await page.getByTestId('dv-collide').click()
    await expect(page.getByTestId('dv-error')).toContainText('Duplicate option value "delta"')
  })

  test('LB-DYNAMIC-06: Listbox should use current option labels and text values after descendants rerender', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DynamicLabel')
    await expect(page.getByTestId('dl-root')).toBeVisible()

    const alpha = page.getByTestId('dl-alpha')
    const mango = page.getByTestId('dl-mango')
    const calls = page.getByTestId('dl-calls')

    // Current rendered label drives typeahead after the rerender
    await page.getByTestId('dl-to-zulu').click()
    await expect(alpha).toContainText('Zulu')
    await mango.focus()
    await page.keyboard.type('z')
    await expect(alpha).toBeFocused()

    await page.waitForTimeout(1100)
    await mango.focus()
    await page.keyboard.type('a')
    await expect(mango).toBeFocused()

    // Explicit textValue then shadows the rendered label
    await page.waitForTimeout(1100)
    await page.getByTestId('dl-explicit-bravo').click()
    await mango.focus()
    await page.keyboard.type('b')
    await expect(alpha).toBeFocused()

    await page.waitForTimeout(1100)
    await mango.focus()
    await page.keyboard.type('z')
    await expect(mango).toBeFocused()

    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(calls).toHaveText('[]')
  })

  test('LB-VIRT-04: Virtual Listbox should make Home and End target logical boundaries outside the window', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    // Home targets first enabled logical index 1 (0 is disabled)
    await page.getByTestId('virt-opt-22').focus()
    await page.keyboard.press('Home')
    await expect(page.getByTestId('virt-scroll-log')).toHaveText('[1]')
    await page.getByTestId('virt-mount-0-4').click()
    await expect(page.getByTestId('virt-opt-1')).toBeFocused()
    await expect(page.getByTestId('virt-value')).toHaveText('null')

    // End targets last enabled logical index 48 (49 is disabled) in a fresh run
    await first.unmount()
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()
    await page.getByTestId('virt-opt-22').focus()
    await page.keyboard.press('End')
    await expect(page.getByTestId('virt-scroll-log')).toHaveText('[48]')
    await page.getByTestId('virt-mount-45-49').click()
    await expect(page.getByTestId('virt-opt-48')).toBeFocused()
    await expect(page.getByTestId('virt-value')).toHaveText('null')
  })

  test('LB-VIRT-06: Virtual Listbox should coalesce rapid navigation while a requested window is rendering', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    await page.getByTestId('virt-mount-0-4').click()
    await page.getByTestId('virt-opt-4').focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Deterministic latest target, no duplicate callback, no stale focus
    await expect(page.getByTestId('virt-scroll-log')).toHaveText('[5,6,7]')
    await expect(page.getByTestId('virt-opt-4')).toBeFocused()

    await page.getByTestId('virt-mount-5-10').click()
    await expect(page.getByTestId('virt-opt-7')).toBeFocused()
    await expect(page.getByTestId('virt-listbox').locator('[tabindex="0"]')).toHaveCount(1)
  })

  test('LB-VIRT-08: Virtual Listbox should preserve logical metadata and active visibility through resize', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/VirtualResize')
    await expect(page.getByTestId('vrz-root')).toBeVisible()

    const opt2 = page.getByTestId('vrz-opt-2')
    await opt2.focus()
    await expect(opt2).toHaveAttribute('aria-setsize', '50')
    await expect(opt2).toHaveAttribute('aria-posinset', '3')

    // Viewport resize + application window recalculation
    await page.getByTestId('vrz-recalc').click()
    await expect(opt2).toBeFocused()
    expect(await opt2.evaluate(el => el.getAttribute('data-value'))).toBe('item-2')
    await expect(opt2).toHaveAttribute('aria-setsize', '50')
    await expect(opt2).toHaveAttribute('aria-posinset', '3')
    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    // Navigation past the recalculated window still requests + mounts
    await page.getByTestId('vrz-opt-5').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vrz-scroll-log')).toHaveText('[6]')
    await page.getByTestId('vrz-mount-5-10').click()
    await expect(page.getByTestId('vrz-opt-6')).toBeFocused()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('LB-VIRT-09: Virtual Listbox should atomically replace logical metadata and its scroll callback', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/VirtualReplace')
    await expect(page.getByTestId('vr-root')).toBeVisible()

    // Generation A: unmounted target routes to the A callback
    await page.getByTestId('vr-opt-2').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vr-log-a')).toHaveText('[3]')
    await expect(page.getByTestId('vr-log-b')).toHaveText('[]')

    // Atomic replacement: next command consults only the newest order + callback
    await page.getByTestId('vr-replace').click()
    await expect(page.getByTestId('vr-opt-2')).toHaveAttribute('data-value', 'b-2')
    await page.getByTestId('vr-opt-2').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vr-log-a')).toHaveText('[3]')
    await expect(page.getByTestId('vr-log-b')).toHaveText('[3]')

    // Invalid replacement mapping diagnoses descriptively, then recovers
    await page.getByTestId('vr-break').click()
    await expect(page.getByTestId('vr-error')).toContainText(
      'Duplicate value in virtual items: "dup"'
    )
    await page.getByTestId('vr-fix').click()
    await expect(page.getByTestId('vr-opt-0')).toBeVisible()
    await page.getByTestId('vr-opt-2').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vr-log-b')).toHaveText('[3,3]')
  })

  test('LB-VIRT-10: Virtual Listbox should cancel an unresolved focus target when it unmounts during scroll work', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/VirtualUnmount')
    await expect(page.getByTestId('vu-root')).toBeVisible()

    // Navigate toward an unmounted target, then unmount before the window lands
    await page.getByTestId('vu-opt-4').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vu-scroll-log')).toHaveText('[5]')

    // Observe exactly the unmount window: mount-time render noise (css()
    // static misses, React 18's primitive `ref`-as-prop warning) predates it.
    const problems: string[] = []
    page.on('pageerror', err => problems.push(`pageerror: ${err.message}`))
    page.on('console', msg => {
      if (msg.type() === 'error') {
        problems.push(`error: ${msg.text()}`)
      } else if (msg.type() === 'warning' && !msg.text().includes('[reference-ui] css()')) {
        problems.push(`warning: ${msg.text()}`)
      }
    })
    await page.getByTestId('vu-unmount').click()
    await expect(page.getByTestId('vu-listbox')).toHaveCount(0)

    // The late window update lands on nothing: no callbacks, no focus, no noise
    await page.getByTestId('vu-mount-5-10').click()
    await page.waitForTimeout(300)
    await expect(page.getByTestId('vu-listbox')).toHaveCount(0)
    await expect(page.getByTestId('vu-scroll-log')).toHaveText('[5]')
    expect(problems).toEqual([])

    // A separately mounted Listbox remains fully interactive
    await page.getByTestId('vu-s-alpha').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('vu-s-bravo')).toBeFocused()
    expect(problems).toEqual([])
  })

  test('LB-CB-01: Listbox should switch to Combobox virtual focus without changing option selection semantics', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ComboBasic')
    await expect(page.getByTestId('cb-root')).toBeVisible()

    const input = page.getByTestId('cb-input')
    const alpha = page.getByTestId('cb-alpha')
    const bravo = page.getByTestId('cb-bravo')

    await input.click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()

    // No DOM tab stop or DOM focus on any option; focus stays in the input
    await expect(alpha).toHaveAttribute('tabindex', '-1')
    await expect(bravo).toHaveAttribute('tabindex', '-1')
    await expect(input).toBeFocused()

    // Virtual focus moves alpha -> bravo; activedescendant tracks the real ID
    await page.keyboard.press('ArrowDown')
    await expect(alpha).toHaveAttribute('data-active', '')
    const alphaId = await alpha.getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', alphaId ?? '')
    await page.keyboard.press('ArrowDown')
    await expect(bravo).toHaveAttribute('data-active', '')
    const bravoId = await bravo.getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', bravoId ?? '')
    await expect(input).toBeFocused()

    // Commit produces the same scalar value once
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cb-log')).toHaveText('["change:bravo"]')
    await expect(page.getByTestId('cb-value')).toHaveText('Selected: bravo')
  })

  test('LB-CB-02: windowed Combobox Listbox withholds the active descendant until the virtual target mounts', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ComboWindowed')
    await expect(page.getByTestId('cbw-root')).toBeVisible()

    const input = page.getByTestId('cbw-input')
    await input.click()
    await expect(page.getByTestId('cbw-popover')).toBeVisible()

    // Window metadata is logical, not DOM-relative
    await expect(page.getByTestId('cbw-opt-0')).toHaveAttribute('aria-setsize', '10')
    await expect(page.getByTestId('cbw-opt-4')).toHaveAttribute('aria-posinset', '5')

    // Mounted navigation tracks real IDs and never invents scroll requests
    await page.keyboard.press('ArrowDown')
    const id0 = await page.getByTestId('cbw-opt-0').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', id0 ?? '')
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowDown')
    }
    const id4 = await page.getByTestId('cbw-opt-4').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', id4 ?? '')
    await expect(page.getByTestId('cbw-scroll-log')).toHaveText('[]')

    // Past the window edge the Combobox virtual driver consults the Listbox
    // adapter: exactly one scrollToIndex(5), focus stays, and no ID
    // publishes while the target is absent.
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('cbw-scroll-log')).toHaveText('[5]')
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await expect(input).toBeFocused()

    // Mounting the window publishes the stable ID with logical metadata.
    await page.getByTestId('cbw-mount-5-9').click()
    const opt5 = page.getByTestId('cbw-opt-5')
    await expect(opt5).toBeVisible()
    const id5 = await opt5.getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', id5 ?? '')
    await expect(opt5).toHaveAttribute('aria-posinset', '6')
    await expect(opt5).toHaveAttribute('aria-setsize', '10')
    await expect(input).toBeFocused()

    // Commit keeps stable value identity; reopening re-resolves the
    // committed selection onto its mounted ID.
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cbw-log')).toHaveText('["change:item-5"]')
    await expect(page.getByTestId('cbw-popover')).toHaveCount(0)
    await input.click()
    await expect(page.getByTestId('cbw-popover')).toBeVisible()
    const opt5b = page.getByTestId('cbw-opt-5')
    await expect(opt5b).toBeVisible()
    await expect(opt5b).toHaveAttribute('aria-posinset', '6')
    const id5b = await opt5b.getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', id5b ?? '')
  })

  test('LB-CB-03: Listbox should yield commit callback authority to its containing Combobox', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ComboBasic')
    await expect(page.getByTestId('cb-root')).toBeVisible()

    // Valid shape: the Listbox carries no onChange; only Combobox commits, once
    await page.getByTestId('cb-input').click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cb-log')).toHaveText('["change:bravo"]')

    // Invalid shape (nested Listbox onChange) is pinned by the LB-CB-03 unit
    // test with the two-authority diagnostic; the live tree never dual-fires.
  })

  test('LB-CB-04: Listbox should publish local active styling state when Combobox virtually focuses one mounted Option', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ComboBasic')
    await expect(page.getByTestId('cb-root')).toBeVisible()

    const input = page.getByTestId('cb-input')
    const alpha = page.getByTestId('cb-alpha')
    const bravo = page.getByTestId('cb-bravo')

    // Commit alpha so selection and activity diverge
    await input.click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cb-value')).toHaveText('Selected: alpha')

    // Move virtual activity to bravo. The reopen resolver pre-selects the
    // committed alpha on React 19 but can lag a frame on 17/18, so step
    // until bravo is active instead of assuming the starting point.
    await input.click()
    const bravoId = await bravo.getAttribute('id')
    for (let i = 0; i < 3; i++) {
      if ((await input.getAttribute('aria-activedescendant')) === bravoId) break
      await page.keyboard.press('ArrowDown')
    }
    await expect(input).toHaveAttribute('aria-activedescendant', bravoId ?? '')
    await expect(bravo).toHaveAttribute('data-active', '')
    await expect(alpha).not.toHaveAttribute('data-active')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-selected', 'false')
    await expect(alpha).toHaveAttribute('tabindex', '-1')
    await expect(bravo).toHaveAttribute('tabindex', '-1')

    // Pointer activity moves the same single active marker in one commit
    // (hovering the committed alpha is leave-restore-ignored by Combobox
    // policy, so this phase hovers non-committed charlie instead)
    const charlie = page.getByTestId('cb-charlie')
    await charlie.hover()
    const charlieId = await charlie.getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', charlieId ?? '')
    await expect(charlie).toHaveAttribute('data-active', '')
    await expect(bravo).not.toHaveAttribute('data-active')

    // Dismissal unmounts the window and clears the source reference together
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('cb-popover')).toBeHidden()
    await expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  test('LB-ENV-03: Listbox should preserve roving, typeahead, and virtual scrolling inside a ShadowRoot', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Listbox/Listbox/Shadow')
    await expect(page.getByTestId('sh-root')).toBeVisible()
    await expect(page.getByTestId('sh-alpha')).toBeVisible()

    const shadowActive = () =>
      page.evaluate(() => {
        const host = document.querySelector('[data-testid="sh-host"]')
        const active = host?.shadowRoot?.activeElement
        return active?.getAttribute?.('data-testid') ?? null
      })

    // Tab crosses into the shadow tree; arrows rove in composed order.
    // DIAG D1: WebKit skips the sh-mount button between sh-before and
    // the shadow host, so ONE Tab reaches sh-alpha there (SCOPE-1
    // P2-F29 probe pins tab1=sh-alpha, tab2=sh-opt-0).
    await page.getByTestId('sh-before').focus()
    await page.keyboard.press('Tab')
    if (browserName !== 'webkit') {
      await page.keyboard.press('Tab')
    }
    expect(await shadowActive()).toBe('sh-alpha')
    await page.keyboard.press('ArrowDown')
    expect(await shadowActive()).toBe('sh-bravo')

    // Typeahead resolves inside the shadow tree without selecting
    await page.keyboard.type('c')
    expect(await shadowActive()).toBe('sh-charlie')
    await page.waitForTimeout(1100)
    await page.keyboard.press('Space')
    await expect(page.getByTestId('sh-calls')).toHaveText('["charlie"]')

    // Virtual scrolling consults the owning root, not the light DOM
    await page.getByTestId('sh-opt-1').evaluate(el => (el as HTMLElement).focus())
    expect(await shadowActive()).toBe('sh-opt-1')
    await page.keyboard.type('z')
    await expect(page.getByTestId('sh-scroll-log')).toHaveText('[15]')
    await page.getByTestId('sh-mount-13-17').click()
    expect(await shadowActive()).toBe('sh-opt-15')
    await expect(page.getByTestId('sh-opt-15')).toHaveAttribute('aria-posinset', '16')
  })

  test('LB-A11Y-01: Listbox should pass accessibility checks across every frozen semantic shape', async ({
    mount,
    page,
  }) => {
    // NOTE: the repo has no configured a11y scanner dependency (no axe in any
    // package.json or node_modules), so the scanner half of this case is
    // blocked on infra outside Listbox scope. This test pins the runnable
    // half: roles, accessible names, states, and relationships per shape.
    await mount('components/Listbox/Listbox/A11yShapes')
    await expect(page.getByTestId('a11y-root')).toBeVisible()

    // Named single with disabled option
    const single = page.getByRole('listbox', { name: 'Single fruits' })
    await expect(single).toBeVisible()
    await expect(single).not.toHaveAttribute('aria-multiselectable')
    await expect(page.getByTestId('a11y-s-apple')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('a11y-s-banana')).toHaveAttribute('aria-disabled', 'true')

    // Named multiple
    const multi = page.getByRole('listbox', { name: 'Multi fruits' })
    await expect(multi).toHaveAttribute('aria-multiselectable', 'true')
    await expect(page.getByTestId('a11y-m-apple')).toHaveAttribute('aria-selected', 'true')

    // Whole-listbox disabled: every option reports disabled, none tabbable
    await expect(page.getByRole('listbox', { name: 'Disabled list' })).toBeVisible()
    await expect(page.getByTestId('a11y-d-apple')).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByTestId('a11y-d-apple')).toHaveAttribute('tabindex', '-1')

    // Empty: role without options
    const empty = page.getByRole('listbox', { name: 'Empty list' })
    await expect(empty).toBeVisible()
    await expect(empty.getByRole('option')).toHaveCount(0)

    // Horizontal orientation
    await expect(page.getByRole('listbox', { name: 'Horizontal list' })).toHaveAttribute(
      'aria-orientation',
      'horizontal'
    )

    // Virtualized set metadata
    await expect(page.getByRole('listbox', { name: 'Virtual list' })).toBeVisible()
    await expect(page.getByTestId('a11y-v-0')).toHaveAttribute('aria-setsize', '10')
    await expect(page.getByTestId('a11y-v-2')).toHaveAttribute('aria-posinset', '3')
  })

  test('LB-COMP-01: Standalone Listbox should support a complete controlled single-select composition', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/CompSingle')
    await expect(page.getByTestId('cs-root')).toBeVisible()

    const listbox = page.getByTestId('cs-listbox')
    const calls = page.getByTestId('cs-calls')

    await page.getByTestId('cs-before').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('cs-alpha')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('cs-bravo')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('cs-delta')).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('cs-bravo')).toBeFocused()

    await page.keyboard.type('d')
    await expect(page.getByTestId('cs-delta')).toBeFocused()

    await page.getByTestId('cs-bravo').click()
    await expect(calls).toHaveText('["bravo"]')
    await expect(page.getByTestId('cs-bravo')).toHaveAttribute('aria-selected', 'true')

    // Let the typeahead buffer from the 'd' phase expire so Space selects
    await page.waitForTimeout(1100)
    await page.getByTestId('cs-delta').focus()
    await page.keyboard.press('Space')
    await expect(calls).toHaveText('["bravo","delta"]')

    // Deterministic focus recovery after removal; one tab stop throughout
    await page.getByTestId('cs-bravo').focus()
    await page.getByTestId('cs-remove-bravo').click()
    await expect(page.getByTestId('cs-delta')).toBeFocused()
    await expect(listbox.locator('[tabindex="0"]')).toHaveCount(1)

    // No popup or form markup in the standalone composition
    await expect(listbox.locator('[role="dialog"],[role="menu"],form,input,select')).toHaveCount(
      0
    )
  })

  test('LB-COMP-02: Standalone Listbox should support controlled multiple selection in horizontal RTL', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/CompMultiRTL')
    await expect(page.getByTestId('cm-root')).toBeVisible()

    const calls = page.getByTestId('cm-calls')

    // Mirrored arrows skip the disabled middle option
    await page.getByTestId('cm-bravo').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('cm-delta')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('cm-bravo')).toBeFocused()

    // Current-order toggle arrays through pointer and keyboard
    await page.getByTestId('cm-delta').click()
    await expect(calls).toHaveText('[["alpha","delta","echo"]]')
    await page.getByTestId('cm-bravo').focus()
    await page.keyboard.press('Space')
    await expect(calls).toHaveText('[["alpha","delta","echo"],["alpha","bravo","delta","echo"]]')
    await expect(page.getByTestId('cm-bravo')).toHaveAttribute('aria-selected', 'true')

    // Unsupported range modifiers request nothing and change no ARIA
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('ControlOrMeta+a')
    await expect(calls).toHaveText('[["alpha","delta","echo"],["alpha","bravo","delta","echo"]]')
    await expect(page.getByTestId('cm-charlie')).toHaveAttribute('aria-selected', 'false')
  })

  test('LB-COMP-03: Windowed Listbox should coordinate logical navigation with an application virtualizer', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual100')
    await expect(page.getByTestId('v100-root')).toBeVisible()

    const scrollLog = page.getByTestId('v100-scroll-log')
    const calls = page.getByTestId('v100-calls')

    // Accurate set metadata across a variable-height middle window
    await expect(page.getByTestId('v100-opt-40')).toHaveAttribute('aria-setsize', '100')
    await expect(page.getByTestId('v100-opt-40')).toHaveAttribute('aria-posinset', '41')
    await expect(page.getByTestId('v100-opt-46')).toHaveAttribute('aria-posinset', '47')

    // In-window arrows never consult the adapter
    await page.getByTestId('v100-opt-42').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('v100-opt-43')).toBeFocused()
    await expect(scrollLog).toHaveText('[]')

    // Past-window arrows pend latest-first; End resolves at the boundary
    await page.getByTestId('v100-opt-46').focus()
    await page.keyboard.press('ArrowDown')
    await expect(scrollLog).toHaveText('[47]')
    await page.keyboard.press('End')
    await expect(scrollLog).toHaveText('[47,99]')
    await page.getByTestId('v100-mount-93-99').click()
    await expect(page.getByTestId('v100-opt-99')).toBeFocused()

    // Home skips the disabled index 3 to logical 0
    await page.keyboard.press('Home')
    await expect(scrollLog).toHaveText('[47,99,0]')
    await page.getByTestId('v100-mount-0-6').click()
    await expect(page.getByTestId('v100-opt-0')).toBeFocused()

    // Typeahead mounts the offscreen match before focusing it
    await page.getByTestId('v100-opt-1').focus()
    await page.keyboard.type('z')
    await expect(scrollLog).toHaveText('[47,99,0,77]')
    await page.getByTestId('v100-mount-75-80').click()
    await expect(page.getByTestId('v100-opt-77')).toBeFocused()

    // Programmatic selection applies without a request and survives windowing
    await page.getByTestId('v100-set-77').click()
    await expect(page.getByTestId('v100-opt-77')).toHaveAttribute('aria-selected', 'true')
    await expect(calls).toHaveText('[]')
    await page.getByTestId('v100-mount-40-46').click()
    await expect(page.getByTestId('v100-listbox').locator('[data-selected]')).toHaveCount(0)
    await page.getByTestId('v100-mount-75-80').click()
    await expect(page.getByTestId('v100-opt-77')).toHaveAttribute('aria-selected', 'true')

    // Viewport resize keeps identity, metadata, and the single tab stop
    await page.setViewportSize({ width: 700, height: 500 })
    await expect(page.getByTestId('v100-opt-77')).toHaveAttribute('aria-posinset', '78')
    await expect(page.getByTestId('v100-listbox').locator('[tabindex="0"]')).toHaveCount(1)
    await expect(page.getByTestId('v100-listbox').locator('[role="dialog"],form,input')).toHaveCount(
      0
    )
  })
})

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

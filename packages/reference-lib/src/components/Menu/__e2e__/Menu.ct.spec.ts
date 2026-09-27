import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Menu Composition Gates & Browser Proofs', () => {
  test('MN-DOM-01: Renders menu trigger, opens content, selects item and closes', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Basic')
    const trigger = page.getByTestId('btn-menu-trigger')
    const content = page.getByTestId('menu-content')
    const display = page.getByTestId('menu-action-display')

    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await expect(content).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'resting-closed')

    // Hover trigger
    await trigger.hover()
    await page.waitForTimeout(200)
    await snap(page, 'hover-trigger')

    // Click trigger -> opens menu
    await trigger.click()
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('role', 'menu')

    const itemEdit = page.getByTestId('menu-item-edit')
    await expect(itemEdit).toBeVisible()
    await expect(itemEdit).toHaveAttribute('role', 'menuitem')
    const itemBox = await itemEdit.boundingBox()
    expect(itemBox?.height).toBe(34)

    await page.waitForTimeout(300)
    await snap(page, 'menu-opened')

    // Hover edit item
    await itemEdit.hover()
    await page.waitForTimeout(200)
    await snap(page, 'hover-item')

    // Click edit -> selects Edit and closes menu
    await itemEdit.click()
    await expect(content).toHaveCount(0)
    await expect(display).toHaveText('Last Action: Edit')

    await page.waitForTimeout(300)
    await snap(page, 'item-selected-closed')
  })

  test('MN-DOM-02: Keyboard roving focus highlights MenuItem with solid background and no outline ring', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Basic')
    const trigger = page.getByTestId('btn-menu-trigger')
    const content = page.getByTestId('menu-content')

    await trigger.click()
    await expect(content).toBeVisible()

    const itemEdit = page.getByTestId('menu-item-edit')
    const itemDuplicate = page.getByTestId('menu-item-duplicate')
    await expect(itemEdit).toBeVisible()

    // Focus first item
    await itemEdit.focus()
    await expect(itemEdit).toBeFocused()

    await page.waitForTimeout(200)
    await snap(page, 'item-focused')

    const itemStyles = await itemEdit.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        backgroundColor: s.backgroundColor,
        color: s.color,
      }
    })

    // No outline ring
    const isOutlineAbsent =
      itemStyles.outlineStyle === 'none' ||
      itemStyles.outlineWidth === '0px' ||
      itemStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      itemStyles.outlineColor === 'transparent' ||
      itemStyles.outlineColor.includes('/ 0)')

    expect(isOutlineAbsent).toBe(true)

    // Solid background (not transparent)
    expect(itemStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(itemStyles.backgroundColor).not.toBe('transparent')
    expect(itemStyles.backgroundColor.includes('/ 0)')).toBe(false)

    // Arrow navigation down to duplicate item
    await page.keyboard.press('ArrowDown')
    await expect(itemDuplicate).toBeFocused()

    await page.waitForTimeout(200)
    await snap(page, 'item-duplicate-focused')

    // Escape closes menu and returns focus
    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await page.waitForTimeout(300)
    await snap(page, 'escape-closed')
  })
})

test.describe('Menu Quarantine Parity (root-level re-targets)', () => {
  test('MN-DOM-01: Menu renders trigger, content, items, and separator with documented native roles', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(await trigger.evaluate(el => el.tagName.toLowerCase())).toBe('button')

    await trigger.click()
    const content = page.getByTestId('menu-content')
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('role', 'menu')
    expect(await content.evaluate(el => el.tagName.toLowerCase())).toBe('div')

    const itemEdit = page.getByTestId('menu-item-edit')
    await expect(itemEdit).toHaveAttribute('role', 'menuitem')
    expect(await itemEdit.evaluate(el => el.tagName.toLowerCase())).toBe('div')

    const sep = page.getByTestId('menu-separator-1')
    await expect(sep).toHaveAttribute('role', 'separator')
    expect(await sep.evaluate(el => el.tagName.toLowerCase())).toBe('div')

    await expect(page.getByTestId('menu-content')).toHaveCount(1)
  })

  test('MN-DOM-02: Menu marks disabled entries and keeps them inert', async ({ mount, page }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    const delItem = page.getByTestId('menu-item-delete')
    await expect(delItem).toHaveAttribute('aria-disabled', 'true')
    await expect(delItem).toHaveAttribute('data-disabled', '')
    await expect(delItem).not.toHaveAttribute('tabindex', '0')

    await delItem.click({ force: true })
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await expect(page.getByTestId('menu-action-display')).not.toContainText('Delete')

    await delItem.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await expect(page.getByTestId('menu-action-display')).not.toContainText('Delete')
  })

  test('MN-DOM-03: Menu trigger exposes expansion and a stable relationship to content', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).not.toHaveAttribute('aria-controls')

    await trigger.click()
    const content = page.getByTestId('menu-content')
    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const contentId = await content.getAttribute('id')
    expect(contentId).toBeTruthy()
    // The trigger controls the Popover layer, which owns the Menu.
    const controls = await trigger.getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    const controlled = page.locator(`[id="${controls}"]`)
    await expect(controlled).toHaveCount(1)
    await expect(controlled.getByTestId('menu-content')).toHaveCount(1)

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.click()
    await expect(page.getByTestId('menu-content')).toBeVisible()
    expect(await page.getByTestId('menu-content').getAttribute('id')).toBe(contentId)
  })

  test('MN-DOM-04: Menu parts preserve native attributes and refs through interaction', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    await trigger.click()
    const content = page.getByTestId('menu-content')
    await expect(content).toBeVisible()

    const itemEdit = page.getByTestId('menu-item-edit')
    await expect(itemEdit).toHaveAttribute('data-probe', 'item')
    expect(await itemEdit.evaluate(el => el.className)).toContain('menu-probe-class')
    await expect(content).toHaveAttribute('data-probe', 'content')

    const refs = page.getByTestId('menu-ref-display')
    // Separator renders a host element directly, so its ref resolves on every
    // runtime. Item/trigger/content refs cross RovingFocus.Item cloneElement or
    // Overlay ref-as-prop plumbing that only preserves props.ref on React 19.
    await expect(refs).toContainText('separator:DIV')

    const reactVersion = await page.locator('html').getAttribute('data-react-version')
    if (reactVersion?.startsWith('19')) {
      await expect(refs).toContainText('item:DIV')
      await expect(refs).toContainText('trigger:BUTTON')
      await expect(refs).toContainText('content:DIV')
      await expect(page.getByTestId('menu-trigger-probe-display')).toContainText('BUTTON')
    }
  })

  test('MN-DOM-05: Menu typeahead prefers explicit textValue over rendered text', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    const itemEdit = page.getByTestId('menu-item-edit')
    await itemEdit.focus()

    await page.keyboard.press('z')
    await expect(page.getByTestId('menu-item-duplicate')).toBeFocused()

    await page.waitForTimeout(1500)
    await page.getByTestId('menu-item-duplicate').focus()
    await page.keyboard.press('e')
    await expect(itemEdit).toBeFocused()
  })

  test('MN-DOM-06: Menu represents empty content and separators without roving items', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-empty-trigger').click()
    const empty = page.getByTestId('menu-content-empty')
    await expect(empty).toBeVisible()
    await expect(empty).toHaveAttribute('role', 'menu')
    await expect(empty.getByRole('menuitem')).toHaveCount(0)
    await expect(empty.locator('[tabindex="0"]')).toHaveCount(0)
    await page.keyboard.press('Escape')

    await page.getByTestId('btn-menu-trigger').click()
    const sep = page.getByTestId('menu-separator-1')
    await expect(sep).toHaveAttribute('role', 'separator')
    await expect(sep).not.toHaveAttribute('tabindex', '0')
  })

  test('MN-DOM-07: Menu generates collision-free stable IDs across roots', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    const firstId = await page.getByTestId('menu-content').getAttribute('id')
    expect(firstId).toBeTruthy()
    // Each trigger controls its own Popover layer, which owns its Menu.
    const firstControls = await page.getByTestId('btn-menu-trigger').getAttribute('aria-controls')
    expect(firstControls).toBeTruthy()
    await expect(page.locator(`[id="${firstControls}"]`).getByTestId('menu-content')).toHaveCount(1)

    await page.getByTestId('btn-second-trigger').click()
    const secondId = await page.getByTestId('menu-content-second').getAttribute('id')
    expect(secondId).toBeTruthy()
    expect(secondId).not.toBe(firstId)
    const secondControls = await page.getByTestId('btn-second-trigger').getAttribute('aria-controls')
    expect(secondControls).toBeTruthy()
    expect(secondControls).not.toBe(firstControls)
    await expect(page.locator(`[id="${secondControls}"]`).getByTestId('menu-content-second')).toHaveCount(1)

    await page.getByTestId('btn-menu-trigger').click()
    expect(await page.getByTestId('menu-content').getAttribute('id')).toBe(firstId)
    expect(await page.locator(`[id="${firstId}"]`).count()).toBe(1)
  })

  test('MN-DOM-09: Menu defaults to vertical roving semantics', async ({ mount, page }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    const itemEdit = page.getByTestId('menu-item-edit')
    await itemEdit.focus()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-item-duplicate')).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(itemEdit).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(itemEdit).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(itemEdit).toBeFocused()
  })

  test('MN-FOCUS-01: Menu chooses its entry item from the keyboard command that opened it', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    const itemEdit = page.getByTestId('menu-item-edit')
    const itemDup = page.getByTestId('menu-item-duplicate')
    const content = page.getByTestId('menu-content')

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(itemEdit).toBeFocused()
    await expect(page.getByTestId('menu-open-logs')).toHaveText('Open Logs: true')
    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)

    await trigger.focus()
    await page.keyboard.press('Space')
    await expect(itemEdit).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)

    await trigger.focus()
    await page.keyboard.press('ArrowDown')
    await expect(itemEdit).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)

    await trigger.focus()
    await page.keyboard.press('ArrowUp')
    await expect(itemDup).toBeFocused()
  })

  test('MN-FOCUS-02: Menu does not move focus into items after pointer opening', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await expect(page.getByTestId('menu-item-edit')).not.toBeFocused()
    await expect(page.getByTestId('menu-item-duplicate')).not.toBeFocused()
  })

  test('MN-FOCUS-03: Vertical Menu provides complete wrapped roving focus over enabled commands', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    const content = page.getByTestId('menu-content')
    const itemEdit = page.getByTestId('menu-item-edit')
    const itemDup = page.getByTestId('menu-item-duplicate')
    await itemEdit.focus()

    await page.keyboard.press('ArrowDown')
    await expect(itemDup).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(itemEdit).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(itemDup).toBeFocused()

    await page.keyboard.press('Home')
    await expect(itemEdit).toBeFocused()
    await page.keyboard.press('End')
    await expect(itemDup).toBeFocused()

    await expect(content.locator('[tabindex="0"]')).toHaveCount(1)
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: None')
    await expect(page.getByTestId('menu-open-logs')).toHaveText('Open Logs: true')
  })

  test('MN-FOCUS-05: Menu leaves focus at its source when no enabled entry item exists', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const disabledTrigger = page.getByTestId('btn-disabled-trigger')
    await disabledTrigger.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-content-disabled')).toBeVisible()
    await expect(disabledTrigger).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(disabledTrigger).toBeFocused()
    await page.getByTestId('disabled-item-1').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-content-disabled')).toHaveCount(0)
    await expect(disabledTrigger).toBeFocused()

    const emptyTrigger = page.getByTestId('btn-empty-trigger')
    await emptyTrigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-content-empty')).toBeVisible()
    await expect(emptyTrigger).toBeFocused()
    await emptyTrigger.click()
    await expect(page.getByTestId('menu-content-empty')).toHaveCount(0)
  })

  test('MN-TYPE-01: Menu typeahead searches and wraps within the open level', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-type-trigger').click()
    const apple = page.getByTestId('menu-item-apple')
    const anchor = page.getByTestId('menu-item-anchor')
    const apricot = page.getByTestId('menu-item-apricot')
    const banana = page.getByTestId('menu-item-banana')
    await banana.focus()

    await page.keyboard.press('a')
    await expect(apple).toBeFocused()
    await page.keyboard.press('a')
    await expect(anchor).toBeFocused()
    await page.keyboard.press('a')
    await expect(apricot).toBeFocused()
    await page.keyboard.press('a')
    await expect(apple).toBeFocused()
    await expect(page.getByTestId('menu-item-aubergine')).not.toBeFocused()
  })

  test('MN-TYPE-04: Menu integrates timed, Unicode, disabled, no-match, and descendant typeahead edges', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-type-trigger').click()
    const apple = page.getByTestId('menu-item-apple')
    const anchor = page.getByTestId('menu-item-anchor')
    const banana = page.getByTestId('menu-item-banana')
    const eclair = page.getByTestId('menu-item-eclair')
    await apple.focus()

    await page.keyboard.press('a')
    await page.keyboard.press('n')
    await expect(anchor).toBeFocused()

    await page.waitForTimeout(1500)
    await page.keyboard.press('b')
    await expect(banana).toBeFocused()

    await page.waitForTimeout(1500)
    // keyboard.type emits no keydown for non-layout chars in Chromium (text
    // insertion path), so drive the real handler with a synthetic keydown.
    await banana.dispatchEvent('keydown', { key: 'é' })
    await expect(eclair).toBeFocused()

    await page.keyboard.type('zzz')
    await expect(eclair).toBeFocused()
    await expect(page.getByTestId('menu-content-type')).toBeVisible()

    const input = page.getByTestId('menu-type-input')
    await input.focus()
    await page.keyboard.type('hi')
    await expect(input).toHaveValue('hi')
    await expect(input).toBeFocused()
    await expect(page.getByTestId('menu-content-type')).toBeVisible()
  })

  test('MN-ACT-01: Menu invokes one cancelable item selection for a primary pointer click', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    await trigger.click()
    await page.getByTestId('menu-item-edit').click()

    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: Edit')
    await expect(page.getByTestId('menu-select-event')).toHaveText('Select Event: click:1:false')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(page.getByTestId('menu-open-logs')).toHaveText('Open Logs: true,false')
  })

  test('MN-ACT-02: Menu invokes one item selection for either Enter or Space with keyboard metadata', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    await trigger.click()
    const itemEdit = page.getByTestId('menu-item-edit')
    await itemEdit.focus()
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: Edit')
    await expect(page.getByTestId('menu-select-event')).toHaveText('Select Event: keydown:Enter:false')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)

    await trigger.click()
    const itemDup = page.getByTestId('menu-item-duplicate')
    await itemDup.focus()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: Duplicate')
    await expect(page.getByTestId('menu-select-event')).toHaveText('Select Event: keydown: :false')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
  })

  test('MN-ACT-03: Menu lets consumer handlers cancel selection and dismissal', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-cancel-trigger').click()

    await page.getByTestId('menu-item-native-cancel').click()
    await expect(page.getByTestId('menu-cancel-display')).toHaveText('Cancel Action: None')
    await expect(page.getByTestId('menu-content-cancel')).toBeVisible()

    await page.getByTestId('menu-item-select-cancel').click()
    await expect(page.getByTestId('menu-cancel-display')).toHaveText('Cancel Action: SelectCancel')
    await expect(page.getByTestId('menu-content-cancel')).toBeVisible()

    const nativeItem = page.getByTestId('menu-item-native-cancel')
    await nativeItem.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-content-cancel')).toBeVisible()

    const selectItem = page.getByTestId('menu-item-select-cancel')
    await selectItem.focus()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-content-cancel')).toBeVisible()
  })

  test('MN-ACT-06: Menu keeps disabled items outside action and dismissal paths', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    const delItem = page.getByTestId('menu-item-delete')

    await delItem.click({ force: true })
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: None')

    await delItem.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: None')
    await expect(page.getByTestId('menu-open-logs')).toHaveText('Open Logs: true')
  })

  test('MN-ACT-08: Menu uses current item callbacks and disabled membership after rerender', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-dynamic-trigger').click()
    const alphaHandle = await page.getByTestId('dynamic-item-alpha').elementHandle()

    await page.getByTestId('btn-mutate-items').click()
    await expect(page.getByTestId('dynamic-item-alpha')).toHaveCount(0)
    expect(await alphaHandle!.evaluate(el => el.isConnected)).toBe(false)
    await expect(page.getByTestId('dynamic-item-bravo')).toHaveAttribute('aria-disabled', 'true')

    await page.getByTestId('dynamic-item-delta').click()
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: dyn:delta')
    await expect(page.getByTestId('menu-content-dynamic')).toHaveCount(0)

    await page.getByTestId('btn-dynamic-trigger').click()
    await page.getByTestId('dynamic-item-bravo').click({ force: true })
    await expect(page.getByTestId('menu-content-dynamic')).toBeVisible()
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: dyn:delta')
  })

  test('MN-CHOICE-08: Menu applies closeOnSelect defaults and honors explicit overrides', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-close-trigger')
    await trigger.click()
    await page.getByTestId('menu-item-default-close').click()
    await expect(page.getByTestId('menu-close-display')).toHaveText('Close Action: DefaultClose')
    await expect(page.getByTestId('menu-content-close')).toHaveCount(0)

    await trigger.click()
    await page.getByTestId('menu-item-stay-open').click()
    await expect(page.getByTestId('menu-close-display')).toHaveText('Close Action: StayOpen')
    await expect(page.getByTestId('menu-content-close')).toBeVisible()
  })

  test('MN-INTENT-10: Menu does not open an activation-owned root on hover', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').hover()
    await page.waitForTimeout(350)
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
  })

  test('MN-CLOSE-01: Menu unwinds on a press outside the root subtree', async ({ mount, page }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    await expect(page.getByTestId('menu-content')).toBeVisible()

    await page.getByTestId('tab-before').click()
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(page.getByTestId('menu-open-logs')).toHaveText('Open Logs: true,false')
    await expect(page.getByTestId('tab-before')).toBeFocused()
  })

  test('MN-CLOSE-04: Menu cascades a programmatic root close and restores only the root trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-controlled-trigger')
    await trigger.click()
    await expect(page.getByTestId('menu-controlled-display')).toHaveText('Controlled: Open')
    await page.getByTestId('controlled-item-1').focus()

    await page.getByTestId('btn-controlled-close').click()
    await expect(page.getByTestId('menu-controlled-display')).toHaveText('Controlled: Closed')
    await expect(page.getByTestId('menu-content-controlled')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('MN-CLOSE-05: Menu closes on Tab and continues relative to the root trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-tab-trigger').click()
    await page.getByTestId('tab-item-1').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('menu-content-tab')).toHaveCount(0)
    await expect(page.getByTestId('tab-after')).toBeFocused()

    await page.getByTestId('btn-tab-trigger').click()
    await page.getByTestId('tab-item-2').focus()
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByTestId('menu-content-tab')).toHaveCount(0)
    await expect(page.getByTestId('tab-before')).toBeFocused()
  })

  test('MN-CLOSE-08: Menu retains open DOM when its parent rejects a Tab-close request', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-controlled-trigger').click()
    await expect(page.getByTestId('menu-controlled-display')).toHaveText('Controlled: Open')

    await page.getByTestId('btn-controlled-reject').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-content-controlled')).toBeVisible()
    await page.getByTestId('controlled-item-1').focus()
    await page.keyboard.press('Tab')

    await expect(page.getByTestId('menu-controlled-logs')).toHaveText(
      'Controlled Logs: request:true,request:false'
    )
    await expect(page.getByTestId('menu-controlled-display')).toHaveText('Controlled: Open')
    await expect(page.getByTestId('menu-content-controlled')).toBeVisible()
  })

  test('MN-DYNAMIC-01: Menu updates roving order and typeahead when items change while open', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-dynamic-trigger').click()
    await page.getByTestId('dynamic-item-bravo').focus()

    await page.getByTestId('btn-mutate-items').click()
    await expect(page.getByTestId('dynamic-item-alpha')).toHaveCount(0)
    const content = page.getByTestId('menu-content-dynamic')
    await expect(content).toBeVisible()

    await page.getByTestId('dynamic-item-charlie').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('dynamic-item-delta')).toBeFocused()
    await page.keyboard.press('d')
    await expect(page.getByTestId('dynamic-item-delta')).toBeFocused()
    await expect(content.locator('[tabindex="0"]')).toHaveCount(1)
  })

  test('MN-DYNAMIC-03: Menu uses current labels and disabled state on the next interaction', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-dynamic-trigger').click()
    await page.getByTestId('btn-mutate-items').click()
    await page.getByTestId('btn-rename-items').click()

    const bravo = page.getByTestId('dynamic-item-bravo')
    await expect(bravo).toHaveText('bravo!')
    await expect(bravo).toHaveAttribute('aria-disabled', 'true')

    await page.getByTestId('dynamic-item-charlie').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('dynamic-item-delta')).toBeFocused()

    await page.getByTestId('dynamic-item-charlie').focus()
    await page.keyboard.press('d')
    await expect(page.getByTestId('dynamic-item-delta')).toBeFocused()

    await page.waitForTimeout(1500)
    await page.getByTestId('dynamic-item-charlie').focus()
    await page.keyboard.type('bravo')
    await expect(page.getByTestId('dynamic-item-charlie')).toBeFocused()
  })

  test('MN-A11Y-01: Menu exposes exact roles, names, states, and one tab stop', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    await expect(trigger).toHaveAccessibleName('Open Actions')
    await trigger.click()

    const content = page.getByTestId('menu-content')
    await expect(content).toHaveAttribute('role', 'menu')
    await expect(page.getByTestId('menu-item-edit')).toHaveAttribute('role', 'menuitem')
    await expect(page.getByTestId('menu-item-edit')).toHaveAccessibleName('Edit Document')
    await expect(page.getByTestId('menu-item-delete')).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByTestId('menu-separator-1')).toHaveAttribute('role', 'separator')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content.locator('[tabindex="0"]')).toHaveCount(1)

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })
})

test.describe('Menu Nested Submenus (FEATURES #1)', () => {
  test('MN-DOM-03: Submenu trigger exposes expansion and a stable relationship to content', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    await expect(trigger).toHaveAttribute('role', 'menuitem')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).not.toHaveAttribute('aria-controls')

    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    const content = page.getByTestId('menu-sub-content')
    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const contentId = await content.getAttribute('id')
    expect(contentId).toBeTruthy()
    if (!contentId) throw new Error('expected stable submenu content id')
    await expect(trigger).toHaveAttribute('aria-controls', contentId)

    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    expect(await page.getByTestId('menu-sub-content').getAttribute('id')).toBe(contentId)
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)
  })

  test('MN-DOM-01: Nested Menu contributes no node between trigger and parent items', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    const itemNew = page.getByTestId('menu-sub-item-new')
    const itemHandle = await itemNew.elementHandle()
    if (!itemHandle) throw new Error('expected submenu sibling item handle')
    const sameParent = await trigger.evaluate(
      (el, other) => el.parentElement === (other as HTMLElement).parentElement,
      itemHandle
    )
    expect(sameParent).toBe(true)
  })

  test('MN-SUBKEY-01: Right opens a submenu and focuses its first enabled item', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    await trigger.focus()

    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-logs')).toHaveText('Sub Logs: share:onOpen')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
  })

  test('MN-SUBKEY-02: Enter and Space open a submenu without selecting', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    await trigger.focus()

    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: None')

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)
    await expect(trigger).toBeFocused()

    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: None')
  })

  test('MN-SUBKEY-03: Left closes one submenu level and restores its trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await page.getByTestId('menu-sub-trigger-l2').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-deep')).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('menu-sub-content-l2')).toHaveCount(0)
    await expect(page.getByTestId('menu-sub-trigger-l2')).toBeFocused()
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-root')).toBeVisible()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss'
    )
  })

  test('MN-SUBKEY-05: Escape closes one level at a time up the tree', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    const rootTrigger = page.getByTestId('btn-sub-trigger')
    await rootTrigger.click()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await page.getByTestId('menu-sub-trigger-l2').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-deep')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-sub-content-l2')).toHaveCount(0)
    await expect(page.getByTestId('menu-sub-trigger-l2')).toBeFocused()
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)
    await expect(page.getByTestId('menu-sub-trigger')).toBeFocused()
    await expect(page.getByTestId('menu-sub-root')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-sub-root')).toHaveCount(0)
    await expect(rootTrigger).toBeFocused()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss,share:onDismiss'
    )
  })

  test('MN-SUBKEY-09: Omitted nested open requests once and stays closed', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger-omitted')
    await trigger.focus()

    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-sub-logs')).toHaveText('Sub Logs: omitted:onOpen')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('menu-sub-content-omitted')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('MN-SUBKEY-10: Directional key after hover-open moves focus without a second request', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    await trigger.focus()

    await trigger.hover()
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText('Sub Logs: share:onOpen')
    await expect(trigger).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText('Sub Logs: share:onOpen')
  })

  test('MN-INTENT-01: Hover requests opening after 100ms without moving focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    await page.getByTestId('menu-sub-item-new').focus()

    await trigger.hover()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText('Sub Logs: ')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)

    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText('Sub Logs: share:onOpen')
    await expect(page.getByTestId('menu-sub-item-new')).toBeFocused()
  })

  test('MN-FOCUS-06: Roving onto a closed trigger does not open it', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await page.getByTestId('menu-sub-item-new').focus()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-sub-trigger')).toBeFocused()
    await expect(page.getByTestId('menu-sub-trigger')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)
    await expect(page.getByTestId('menu-sub-logs')).toHaveText('Sub Logs: ')
  })

  test('MN-ACT-04: Deep selection unwinds deepest-first with one root close', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await page.getByTestId('menu-sub-trigger-l2').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-deep')).toBeFocused()

    await page.getByTestId('menu-sub-item-deep').click()
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: Deep')
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss,share:onDismiss'
    )
    await expect(page.getByTestId('menu-sub-root-logs')).toHaveText('Sub Root Logs: true,false')
    await expect(page.getByTestId('menu-sub-root')).toHaveCount(0)
  })

  test('MN-ACT-05: Submenu selection restores only the root trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    const rootTrigger = page.getByTestId('btn-sub-trigger')
    await rootTrigger.click()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()

    await page.getByTestId('menu-sub-item-email').click()
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: Email')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)
    await expect(page.getByTestId('menu-sub-root')).toHaveCount(0)
    await expect(rootTrigger).toBeFocused()
  })

  test('MN-CLOSE-01: Outside press unwinds every open level deepest-first', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await page.getByTestId('menu-sub-trigger-l2').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-content-l2')).toBeVisible()

    await page.getByTestId('sub-outside').click()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss,share:onDismiss'
    )
    await expect(page.getByTestId('menu-sub-root-logs')).toHaveText('Sub Root Logs: true,false')
    await expect(page.getByTestId('menu-sub-root')).toHaveCount(0)
    await expect(page.getByTestId('sub-outside')).toBeFocused()
  })
})

test.describe('Menu LinkItem (FEATURES #3)', () => {
  test('MN-LINK-01: LinkItem is a native anchor with menuitem semantics in roving order', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-trigger').click()
    const help = page.getByTestId('menu-link-help')
    await expect(help).toHaveAttribute('role', 'menuitem')
    expect(await help.evaluate(el => el.tagName.toLowerCase())).toBe('a')
    expect(await help.evaluate(el => el instanceof HTMLAnchorElement)).toBe(true)
    await expect(help).toHaveAttribute('href', '#help-section')
    await expect(page.getByTestId('menu-link-download')).toHaveAttribute('download', 'report.csv')
    await expect(page.getByTestId('menu-link-blank')).toHaveAttribute('target', '_blank')

    await help.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-link-download')).toBeFocused()
    await page.keyboard.press('End')
    await expect(page.getByTestId('menu-link-plain')).toBeFocused()
  })

  test('MN-LINK-02: Primary click navigates natively and dismisses by default', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    const trigger = page.getByTestId('btn-link-trigger')
    await trigger.click()

    await page.getByTestId('menu-link-help').click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Help')
    await expect(page.getByTestId('menu-link-select-event')).toHaveText(
      'Link Select Event: click:1:false'
    )
    expect(await page.evaluate(() => window.location.hash)).toBe('#help-section')
    await expect(page.getByTestId('menu-link-root')).toHaveCount(0)
    await expect(page.getByTestId('menu-link-open-logs')).toHaveText('Link Open Logs: true,false')
    await expect(trigger).toBeFocused()
  })

  test('MN-LINK-03: Enter and Space activate a link once with native navigation', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    const trigger = page.getByTestId('btn-link-trigger')
    await trigger.click()
    await page.getByTestId('menu-link-help').focus()

    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Help')
    expect(await page.evaluate(() => window.location.hash)).toBe('#help-section')
    await expect(page.getByTestId('menu-link-root')).toHaveCount(0)

    await page.evaluate(() => {
      window.location.hash = ''
    })
    await trigger.click()
    await page.getByTestId('menu-link-help').focus()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Help')
    expect(await page.evaluate(() => window.location.hash)).toBe('#help-section')
    await expect(page.getByTestId('menu-link-root')).toHaveCount(0)
    await expect(page.getByTestId('menu-link-select-event')).toHaveText(
      'Link Select Event: click:0:false'
    )
  })

  test('MN-LINK-05: Modified click stays native without selecting or dismissing', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-trigger').click()

    await page.keyboard.down('Meta')
    await page.getByTestId('menu-link-help').click()
    await page.keyboard.up('Meta')

    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: None')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
    await expect(page.getByTestId('menu-link-open-logs')).toHaveText('Link Open Logs: true')
  })

  test('MN-LINK-07: Disabled link is skipped and inert on every route', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-trigger').click()
    const disabled = page.getByTestId('menu-link-disabled')
    await expect(disabled).toHaveAttribute('aria-disabled', 'true')
    await expect(disabled).not.toHaveAttribute('tabindex', '0')

    await page.getByTestId('menu-link-stay').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-link-plain')).toBeFocused()

    await disabled.click({ force: true })
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: None')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
    expect(await page.evaluate(() => window.location.hash)).toBe('')

    await disabled.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: None')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
  })

  test('MN-LINK-08: closeOnSelect=false navigates without dismissing', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-trigger').click()

    await page.getByTestId('menu-link-stay').click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Stay')
    expect(await page.evaluate(() => window.location.hash)).toBe('#stay-section')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
    await expect(page.getByTestId('menu-link-open-logs')).toHaveText('Link Open Logs: true')
  })
})

test.describe('Menu ShadowRoot ownership (PATCHES #3)', () => {
  test('MN-ENV-03: Menu preserves composed-path ownership and submenu behavior from a ShadowRoot', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Shadow')
    const host = page.getByTestId('menu-shadow-host')
    const trigger = page.getByTestId('btn-shadow-trigger')
    const content = page.getByTestId('menu-shadow-content')
    const shadowActiveTestId = () =>
      host.evaluate(
        el => (el.shadowRoot?.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null
      )

    // Root opens with menu semantics from the shadow trigger.
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await trigger.click()
    await expect(content).toBeVisible()

    // Documented destination: the trigger's shadow root, not document.body.
    expect(
      await host.evaluate(el => !!el.shadowRoot?.querySelector('[data-testid="menu-shadow-content"]'))
    ).toBe(true)
    expect(await page.evaluate(() => !!document.querySelector('[data-testid="menu-shadow-content"]'))).toBe(
      false
    )

    // Focus uses the owning root: pointer opening focuses the menu itself.
    await expect.poll(shadowActiveTestId).toBe('menu-shadow-content')

    // Typeahead search resolves in the owning root.
    const itemEdit = page.getByTestId('menu-shadow-item-edit')
    await itemEdit.focus()
    await page.keyboard.press('z')
    await expect(page.getByTestId('menu-shadow-item-duplicate')).toBeFocused()

    // The nested submenu inherits the shadow destination as its child layer.
    const subTrigger = page.getByTestId('menu-shadow-sub-trigger')
    await subTrigger.focus()
    await page.keyboard.press('Enter')
    const subContent = page.getByTestId('menu-shadow-sub-content')
    await expect(subContent).toBeVisible()
    await expect(page.getByTestId('menu-shadow-sub-item-email')).toBeFocused()
    expect(
      await host.evaluate(el => !!el.shadowRoot?.querySelector('[data-testid="menu-shadow-sub-content"]'))
    ).toBe(true)
    expect(
      await page.evaluate(() => !!document.querySelector('[data-testid="menu-shadow-sub-content"]'))
    ).toBe(false)
    await expect(page.getByTestId('menu-shadow-sub-logs')).toHaveText('Sub Logs: share:onOpen')

    // Composed inside press on the open submenu trigger dismisses nothing.
    await subTrigger.click()
    await expect(subContent).toBeVisible()
    await expect(content).toBeVisible()
    await expect(page.getByTestId('menu-shadow-sub-logs')).toHaveText('Sub Logs: share:onOpen')

    // Composed inside press on the inert pad closes only the submenu level.
    await page.getByTestId('menu-shadow-pad').click()
    await expect(subContent).toHaveCount(0)
    await expect(content).toBeVisible()
    await expect(page.getByTestId('menu-shadow-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,share:onDismiss'
    )

    // Level-local close restores the submenu trigger in the owning root.
    await subTrigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-shadow-sub-item-email')).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(subContent).toHaveCount(0)
    await expect(subTrigger).toBeFocused()

    // A true outside path unwinds every open level deepest-first, exactly once.
    await page.keyboard.press('Enter')
    await expect(subContent).toBeVisible()
    await page.getByTestId('btn-shadow-outside').click()
    await expect(subContent).toHaveCount(0)
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('menu-shadow-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,share:onDismiss,share:onOpen,share:onDismiss,share:onOpen,share:onDismiss'
    )
    await expect(page.getByTestId('menu-shadow-root-logs')).toHaveText('Sub Root Logs: true,false')
    await expect(page.getByTestId('btn-shadow-outside')).toBeFocused()

    // Branches/layers cleaned up: no menu nodes linger in either root.
    expect(
      await host.evaluate(el => el.shadowRoot?.querySelectorAll('[data-reference-menu-content]').length ?? -1)
    ).toBe(0)
    expect(await page.evaluate(() => document.querySelectorAll('[data-reference-menu-content]').length)).toBe(0)

    // Reopen is clean: one selection, one action, one dismiss.
    await trigger.click()
    await expect(content).toBeVisible()
    await itemEdit.click()
    await expect(page.getByTestId('menu-shadow-action')).toHaveText('Shadow Action: Edit')
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('menu-shadow-root-logs')).toHaveText(
      'Sub Root Logs: true,false,true,false'
    )
  })
})

test.describe('Menu Playtest (B-33 keys, W-28 choice, adjacent dismiss)', () => {
  test('MN-FOCUS-07: Menu moves content-focused arrows/Home/End to edge items (B-33)', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const content = page.getByTestId('menu-sub-root')
    const first = page.getByTestId('menu-sub-item-new')
    const last = page.getByTestId('menu-sub-trigger-omitted')
    await expect(content).toBeVisible()
    await expect(content).toBeFocused()

    // ArrowDown lands on the FIRST item, never skipping to the second.
    await page.keyboard.press('ArrowDown')
    await expect(first).toBeFocused()

    await content.focus()
    await page.keyboard.press('End')
    await expect(last).toBeFocused()

    await content.focus()
    await page.keyboard.press('Home')
    await expect(first).toBeFocused()

    await content.focus()
    await page.keyboard.press('ArrowUp')
    await expect(last).toBeFocused()

    // Nothing selected, nothing dismissed by navigation alone.
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: None')
    await expect(content).toBeVisible()
  })

  test('MN-FOCUS-07-sub: Submenu content moves container keys to its own edge items', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    const subContent = page.getByTestId('menu-sub-content')
    const first = page.getByTestId('menu-sub-item-email')
    const last = page.getByTestId('menu-sub-item-copy')
    await expect(subContent).toBeVisible()

    await subContent.focus()
    await page.keyboard.press('ArrowDown')
    await expect(first).toBeFocused()

    await subContent.focus()
    await page.keyboard.press('End')
    await expect(last).toBeFocused()

    await subContent.focus()
    await page.keyboard.press('Home')
    await expect(first).toBeFocused()

    await subContent.focus()
    await page.keyboard.press('ArrowUp')
    await expect(last).toBeFocused()

    await expect(subContent).toBeVisible()
    await expect(page.getByTestId('menu-sub-root')).toBeVisible()
  })

  test('MN-CLOSE-11: Adjacent trigger press closes the open menu before opening its own', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Adjacent')
    const fileTrigger = page.getByTestId('btn-file-trigger')
    const editTrigger = page.getByTestId('btn-edit-trigger')
    const fileRoot = page.getByTestId('menu-file-root')
    const editRoot = page.getByTestId('menu-edit-root')

    await fileTrigger.click()
    await expect(fileRoot).toBeVisible()
    await expect(editRoot).toHaveCount(0)

    // Baseline dismiss, no Menubar: File closes, Edit opens, never both.
    await editTrigger.click()
    await expect(fileRoot).toHaveCount(0)
    await expect(editRoot).toBeVisible()
    await expect(page.getByTestId('menu-adjacent-file-logs')).toHaveText('File Logs: true,false')
    await expect(page.getByTestId('menu-adjacent-edit-logs')).toHaveText('Edit Logs: true')

    // Symmetric the other way.
    await fileTrigger.click()
    await expect(editRoot).toHaveCount(0)
    await expect(fileRoot).toBeVisible()

    // Selection still dismisses exactly its own tree.
    await page.getByTestId('menu-file-new').click()
    await expect(fileRoot).toHaveCount(0)
    await expect(editRoot).toHaveCount(0)
    await expect(page.getByTestId('menu-adjacent-action')).toHaveText('Adjacent Action: New')
    await expect(fileTrigger).toBeFocused()
  })

  test('MN-CHOICE-01: Choice items expose exact roles, checked states, and group naming', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-trigger').click()
    const root = page.getByTestId('menu-choice-root')
    await expect(root).toBeVisible()

    const grid = page.getByTestId('choice-grid')
    await expect(grid).toHaveAttribute('role', 'menuitemcheckbox')
    await expect(grid).toHaveAttribute('aria-checked', 'false')
    await expect(grid).toHaveAttribute('data-state', 'unchecked')
    expect(await grid.evaluate(el => el.tagName.toLowerCase())).toBe('div')

    const guides = page.getByTestId('choice-guides')
    await expect(guides).toHaveAttribute('aria-checked', 'true')
    await expect(guides).toHaveAttribute('data-state', 'checked')

    const mixed = page.getByTestId('choice-mixed')
    await expect(mixed).toHaveAttribute('aria-checked', 'mixed')
    await expect(mixed).toHaveAttribute('data-state', 'mixed')

    const group = page.getByTestId('choice-sort-group')
    await expect(group).toHaveAttribute('role', 'group')
    await expect(group).toHaveAttribute('aria-label', 'Sort by')

    await expect(page.getByTestId('choice-sort-name')).toHaveAttribute('role', 'menuitemradio')
    await expect(page.getByTestId('choice-sort-name')).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('choice-sort-date')).toHaveAttribute('aria-checked', 'false')
    const size = page.getByTestId('choice-sort-size')
    await expect(size).toHaveAttribute('aria-checked', 'false')
    await expect(size).toHaveAttribute('aria-disabled', 'true')

    // Built-in indicators: checked glyphs render, unchecked slots stay blank.
    await expect(grid.locator('[data-menu-indicator]')).toHaveText('')
    await expect(guides.locator('[data-menu-indicator]')).toHaveText('✓')
    await expect(mixed.locator('[data-menu-indicator]')).toHaveText('–')
    await expect(page.getByTestId('choice-sort-name').locator('[data-menu-indicator]')).toHaveText('●')
  })

  test('MN-CHOICE-02: CheckboxItem requests the opposite boolean once per modality and stays open', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-trigger').click()
    const root = page.getByTestId('menu-choice-root')
    const changes = page.getByTestId('menu-choice-change-logs')
    const selects = page.getByTestId('menu-choice-select-logs')
    await expect(root).toBeVisible()

    await page.getByTestId('choice-grid').click()
    await expect(changes).toHaveText('Choice Changes: grid:true')
    await expect(selects).toHaveText('Choice Selects: grid:click:1')
    await expect(root).toBeVisible()
    await expect(page.getByTestId('choice-grid')).toHaveAttribute('aria-checked', 'true')

    await page.getByTestId('choice-guides').click()
    await expect(changes).toHaveText('Choice Changes: grid:true,guides:false')
    await expect(root).toBeVisible()
    await expect(page.getByTestId('choice-guides')).toHaveAttribute('aria-checked', 'false')

    // Mixed requests true; the log-only parent rejects, so ARIA never moves.
    await page.getByTestId('choice-mixed').focus()
    await page.keyboard.press('Enter')
    await expect(changes).toHaveText('Choice Changes: grid:true,guides:false,mixed:true')
    await expect(selects).toContainText('mixed:keydown:Enter')
    await expect(page.getByTestId('choice-mixed')).toHaveAttribute('aria-checked', 'mixed')
    await expect(root).toBeVisible()

    // Space toggles too, exactly once.
    await page.getByTestId('choice-grid').focus()
    await page.keyboard.press('Space')
    await expect(changes).toHaveText('Choice Changes: grid:true,guides:false,mixed:true,grid:false')
    await expect(root).toBeVisible()

    await expect(page.getByTestId('menu-choice-open-logs')).toHaveText('Choice Open Logs: true')
    await expect(page.getByTestId('menu-choice-state')).toHaveText(
      'Choice State: grid=false,guides=false,sort=name'
    )
  })

  test('MN-CHOICE-04: RadioItem requests its value once while the group stays controlled', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-trigger').click()
    const root = page.getByTestId('menu-choice-root')
    const changes = page.getByTestId('menu-choice-change-logs')
    const selects = page.getByTestId('menu-choice-select-logs')
    const name = page.getByTestId('choice-sort-name')
    const date = page.getByTestId('choice-sort-date')
    await expect(root).toBeVisible()

    await date.click()
    await expect(changes).toHaveText('Choice Changes: sort:date')
    await expect(selects).toHaveText('Choice Selects: sort-date:click:1')
    await expect(root).toBeVisible()
    await expect(date).toHaveAttribute('aria-checked', 'true')
    await expect(name).toHaveAttribute('aria-checked', 'false')

    // Activating the already-selected value still requests it once.
    await date.click()
    await expect(changes).toHaveText('Choice Changes: sort:date,sort:date')

    await name.focus()
    await page.keyboard.press('Enter')
    await expect(changes).toHaveText('Choice Changes: sort:date,sort:date,sort:name')
    await expect(selects).toContainText('sort-name:keydown:Enter')
    await expect(name).toHaveAttribute('aria-checked', 'true')

    // Disabled radio is inert on every route.
    await page.getByTestId('choice-sort-size').click({ force: true })
    await expect(changes).toHaveText('Choice Changes: sort:date,sort:date,sort:name')
    await expect(root).toBeVisible()
    await expect(page.getByTestId('menu-choice-open-logs')).toHaveText('Choice Open Logs: true')
  })

  test('MN-CHOICE-08: Choices default to staying open and honor explicit closeOnSelect', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    // Default: activation without dismissal (also asserted in 02/04).
    await page.getByTestId('btn-choice-trigger').click()
    await page.getByTestId('choice-grid').click()
    await expect(page.getByTestId('menu-choice-root')).toBeVisible()
    await expect(page.getByTestId('menu-choice-open-logs')).toHaveText('Choice Open Logs: true')
    await page.keyboard.press('Escape')

    // Explicit true: state request first, then one complete dismissal.
    await page.getByTestId('btn-choice-close-trigger').click()
    const closeRoot = page.getByTestId('menu-choice-close-root')
    await expect(closeRoot).toBeVisible()
    await page.getByTestId('choice-close-check').click()
    await expect(closeRoot).toHaveCount(0)
    await expect(page.getByTestId('menu-choice-close-logs')).toHaveText('Choice Close Logs: true,false')
    await expect(page.getByTestId('menu-choice-change-logs')).toHaveText(
      'Choice Changes: grid:true,close-check:true'
    )
    await expect(page.getByTestId('btn-choice-close-trigger')).toBeFocused()

    await page.getByTestId('btn-choice-close-trigger').click()
    await page.getByTestId('choice-close-radio').click()
    await expect(page.getByTestId('menu-choice-close-root')).toHaveCount(0)
  })

  test('MN-CHOICE-07: Choice cancellation stops both the state request and dismissal', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-cancel-trigger').click()
    const root = page.getByTestId('menu-choice-cancel-root')
    const display = page.getByTestId('menu-choice-cancel-display')
    await expect(root).toBeVisible()

    await page.getByTestId('choice-cancel-native').click()
    await expect(display).toHaveText('Choice Cancel: None')
    await expect(root).toBeVisible()

    await page.getByTestId('choice-cancel-select').click()
    // onSelect ran (and prevented); onChange never fired.
    await expect(display).toHaveText('Choice Cancel: SelectCancel')
    await expect(root).toBeVisible()

    await page.getByTestId('choice-cancel-select').focus()
    await page.keyboard.press('Enter')
    await expect(display).toHaveText('Choice Cancel: SelectCancel')
    await expect(root).toBeVisible()
  })

  test('MN-CHOICE-09: Roving and typeahead treat choices as commands, skipping group structure', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-trigger').click()
    const root = page.getByTestId('menu-choice-root')
    const grid = page.getByTestId('choice-grid')
    const guides = page.getByTestId('choice-guides')
    const mixed = page.getByTestId('choice-mixed')
    const name = page.getByTestId('choice-sort-name')
    const date = page.getByTestId('choice-sort-date')
    const plain = page.getByTestId('choice-plain')
    await expect(root).toBeVisible()

    await grid.focus()
    await page.keyboard.press('ArrowDown')
    await expect(guides).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(mixed).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(name).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(date).toBeFocused()
    // Disabled radio skipped, group never a stop.
    await page.keyboard.press('ArrowDown')
    await expect(plain).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(grid).toBeFocused()

    await expect(root.locator('[tabindex="0"]')).toHaveCount(1)
    await expect(page.getByTestId('choice-sort-group')).not.toHaveAttribute('tabindex', '0')

    // Typeahead crosses item kinds by current text.
    await grid.focus()
    await page.keyboard.press('p')
    await expect(plain).toBeFocused()
    await page.waitForTimeout(1500)
    await page.keyboard.press('n')
    await expect(name).toBeFocused()

    // Movement never requests state.
    await expect(page.getByTestId('menu-choice-change-logs')).toHaveText('Choice Changes: ')
    await expect(root).toBeVisible()
  })

  test('MN-CHOICE-02-alias: W-28 alias props request through onCheckedChange/onValueChange', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-alias-trigger').click()
    const logs = page.getByTestId('menu-choice-alias-logs')
    await expect(page.getByTestId('menu-choice-alias-root')).toBeVisible()

    await page.getByTestId('choice-alias-check').click()
    await expect(logs).toHaveText('Choice Alias Logs: alias-check:true')

    await page.getByTestId('choice-alias-radio').click()
    await expect(logs).toHaveText('Choice Alias Logs: alias-check:true,alias-radio:b')
  })
})

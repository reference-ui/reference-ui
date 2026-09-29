import { test, expect, snap } from '../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../playwright/axe'

// Landing-sequence engine scope: `engineOf` sniffs the Playwright project
// (`react19` on agentct Chromium, `react19-firefox`/`react19-webkit` on the
// sweep vehicle) for per-engine delivery/expectations (DIAG D1 + F40 stretch).
function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

async function centerOf(locator: {
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>
}) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('expected a bounding box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

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
    // Settle the pointer-open entry focus before programmatic focus: the
    // frame-late container focus would otherwise steal it back under load.
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await expect(page.getByTestId('menu-content')).toBeFocused()
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
    // P1 (F41, DIAG D1): WebKit click-focus never lands on buttons, so
    // re-deliver the Chromium focus state; the dismiss + no-steal assertions
    // below then test the outside press on every engine.
    if (engineOf() === 'webkit') await page.getByTestId('tab-before').focus()
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

    // Scanner half: open state first (menu items, separator, disabled
    // item all mounted), then the closed state. Whole-page scope: the
    // menu content portals to document.body, so #root-scoping would miss
    // component-owned content; the gallery holds one story per mount.
    await expectNoAxeViolations(page)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
    await expectNoAxeViolations(page)
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
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
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
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
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
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
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
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await page.getByTestId('menu-sub-trigger-l2').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-content-l2')).toBeVisible()

    await page.getByTestId('sub-outside').click()
    // P1 (F42, DIAG D1): WebKit click-focus never lands on buttons, so
    // re-deliver the Chromium focus state; the unwind + no-steal assertions
    // below then test the outside press on every engine.
    if (engineOf() === 'webkit') await page.getByTestId('sub-outside').focus()
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
    // P2 (F39, SCOPE2 probe P-F39): Firefox resets focus to body on fragment
    // navigation, after the product's trigger restore — Chromium keeps the
    // restored trigger. Dismiss + navigation assertions above hold on both.
    if (engineOf() === 'firefox') {
      await expect(page.locator('body')).toBeFocused()
    } else {
      await expect(trigger).toBeFocused()
    }
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
    // P1 (F43, DIAG D1): WebKit click-focus never lands on buttons, so
    // re-deliver the Chromium focus state; the unwind + no-steal assertions
    // below then test the outside path on every engine.
    if (engineOf() === 'webkit') await page.getByTestId('btn-shadow-outside').focus()
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
})

test.describe('Menu controlled submenu keyboard completions (P2E)', () => {
  test('MN-SUBKEY-04: RTL mirrors submenu open and close arrows without changing activation', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuRtl')
    await page.getByTestId('btn-rtl-trigger').click()
    await expect(page.getByTestId('menu-rtl-root')).toBeFocused()
    const trigger = page.getByTestId('menu-rtl-trigger')
    const logs = page.getByTestId('menu-rtl-logs')
    await trigger.focus()

    // Mirrored open: Left opens in RTL.
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('menu-rtl-content')).toBeVisible()
    await expect(logs).toHaveText('RTL Logs: share:onOpen')
    await expect(page.getByTestId('menu-rtl-item-email')).toBeFocused()

    // Vertical roving matches LTR.
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-rtl-item-copy')).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('menu-rtl-item-email')).toBeFocused()

    // Mirrored close: Right closes in RTL and restores the trigger.
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-rtl-content')).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(logs).toHaveText('RTL Logs: share:onOpen,share:onDismiss')

    // Activation matches LTR.
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-rtl-content')).toBeVisible()
    await expect(page.getByTestId('menu-rtl-item-email')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-rtl-content')).toHaveCount(0)

    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-rtl-content')).toBeVisible()
    await expect(page.getByTestId('menu-rtl-item-email')).toBeFocused()
  })

  test('MN-SUBKEY-06: Rejected submenu open and close requests stay visibly controlled', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-reject-trigger').click()
    await expect(page.getByTestId('menu-probe-reject-root')).toBeFocused()
    const logs = page.getByTestId('menu-probe-reject-logs')

    // Rejected open: one request, closed ARIA/DOM/focus persist.
    const openTrigger = page.getByTestId('probe-reject-open-trigger')
    await openTrigger.focus()
    await page.keyboard.press('ArrowRight')
    await expect(logs).toHaveText('Reject Logs: reject-open:onOpen')
    await expect(openTrigger).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('probe-reject-open-content')).toHaveCount(0)
    await expect(openTrigger).toBeFocused()

    // Rejected close: one request, open ARIA/DOM/focus persist.
    const closeItem = page.getByTestId('probe-reject-close-item')
    await expect(page.getByTestId('probe-reject-close-content')).toBeVisible()
    await closeItem.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(logs).toHaveText('Reject Logs: reject-open:onOpen,reject-close:onDismiss')
    await expect(page.getByTestId('probe-reject-close-content')).toBeVisible()
    await expect(closeItem).toBeFocused()
    await expect(page.getByTestId('probe-reject-close-trigger')).toHaveAttribute(
      'aria-expanded',
      'true'
    )

    await page.keyboard.press('Escape')
    await expect(logs).toHaveText(
      'Reject Logs: reject-open:onOpen,reject-close:onDismiss,reject-close:onDismiss'
    )
    await expect(page.getByTestId('probe-reject-close-content')).toBeVisible()
  })

  test('MN-SUBKEY-07: Consumer key cancellation wins before submenu and roving defaults', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-cancel-trigger').click()
    await expect(page.getByTestId('menu-probe-cancel-root')).toBeFocused()
    const logs = page.getByTestId('menu-probe-cancel-logs')
    const trigger = page.getByTestId('probe-cancel-trigger')

    // Open keys cancelled at the trigger: consumer log first, no request.
    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    await expect(logs).toHaveText('Cancel Logs: trigger:cancelled')
    await expect(page.getByTestId('probe-cancel-content')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(logs).toHaveText('Cancel Logs: trigger:cancelled,trigger:cancelled')
    await expect(page.getByTestId('probe-cancel-content')).toHaveCount(0)

    // Pointer open is not a key path: content mounts for the close/roving legs.
    await trigger.click()
    await expect(page.getByTestId('probe-cancel-content')).toBeVisible()

    // Close + roving keys cancelled at the item: no close, no focus movement.
    const item = page.getByTestId('probe-cancel-item')
    await item.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(logs).toContainText('item:cancelled')
    await expect(page.getByTestId('probe-cancel-content')).toBeVisible()
    await expect(item).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('probe-cancel-content')).toBeVisible()
    await expect(item).toBeFocused()
    await expect(logs).not.toContainText('cancel:onDismiss')
  })

  test('MN-SUBKEY-08: Disabled triggers stay inert even when externally open', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-disabled-trigger').click()
    await expect(page.getByTestId('menu-probe-disabled-root')).toBeFocused()
    const logs = page.getByTestId('menu-probe-disabled-logs')
    const trigger = page.getByTestId('probe-disabled-trigger')

    await expect(trigger).toHaveAttribute('aria-disabled', 'true')

    // Roving skips both disabled triggers.
    await page.getByTestId('probe-disabled-sibling').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('probe-disabled-sibling')).toBeFocused()

    // Keyboard open on the closed disabled trigger: no request.
    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await expect(logs).toHaveText('Disabled Logs: ')
    await expect(page.getByTestId('probe-disabled-content')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    // Hovering the disabled entry closes the open level exactly once
    // (INTENT-05); the disabled submenu itself still requests nothing.
    await trigger.hover()
    await expect(logs).toHaveText('Disabled Logs: ext:onDismiss', { timeout: 3000 })
    await page.waitForTimeout(450)
    await expect(logs).toHaveText('Disabled Logs: ext:onDismiss')
    await expect(page.getByTestId('probe-disabled-content')).toHaveCount(0)

    // A press on the sibling is a second deliberate gesture: the submenu
    // layer reads it as outside and requests once more (each gesture
    // requests, as with rejected key presses in SUBKEY-06).
    await trigger.click({ force: true })
    await expect(logs).toHaveText('Disabled Logs: ext:onDismiss,ext:onDismiss')

    // Externally open content stays represented but noninteractive.
    const extTrigger = page.getByTestId('probe-disabled-ext-trigger')
    await expect(page.getByTestId('probe-disabled-ext-content')).toBeVisible()
    await expect(extTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('probe-disabled-ext-item')).not.toBeFocused()
    await expect(extTrigger).not.toBeFocused()

    await extTrigger.focus()
    await page.keyboard.press('ArrowLeft')
    await extTrigger.click({ force: true })
    await expect(logs).toHaveText('Disabled Logs: ext:onDismiss,ext:onDismiss')
    await expect(page.getByTestId('probe-disabled-ext-content')).toBeVisible()
  })

  test('MN-TYPE-03: Typeahead buffers reset and scope as submenu ownership changes', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()

    // Root prefix uses the root buffer.
    await page.getByTestId('menu-sub-item-new').focus()
    await page.keyboard.press('n')
    await expect(page.getByTestId('menu-sub-item-new')).toBeFocused()

    // Submenu typing uses only the submenu buffer (each level owns a root).
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await page.keyboard.press('c')
    await expect(page.getByTestId('menu-sub-item-copy')).toBeFocused()

    // Close and continue at the restored trigger with a fresh root buffer.
    await page.keyboard.press('Escape')
    const trigger = page.getByTestId('menu-sub-trigger')
    await expect(trigger).toBeFocused()
    await page.waitForTimeout(1200)
    await page.keyboard.press('o')
    await expect(page.getByTestId('menu-sub-trigger-omitted')).toBeFocused()
  })
})

test.describe('Menu tree dismissal completions (P2E)', () => {
  test('MN-CLOSE-02: Interaction in portalled descendants stays inside the root subtree', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()
    const trigger = page.getByTestId('menu-sub-trigger')
    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    const logs = page.getByTestId('menu-sub-logs')

    // Background chrome: primary + right press select and dismiss nothing.
    await page.getByTestId('menu-sub-pad').click()
    await expect(logs).toHaveText('Sub Logs: share:onOpen')
    await page.getByTestId('menu-sub-pad').click({ button: 'right' })
    await expect(logs).toHaveText('Sub Logs: share:onOpen')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()

    // Trigger chrome: right press dismisses nothing.
    await trigger.click({ button: 'right' })
    await expect(logs).toHaveText('Sub Logs: share:onOpen')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-root')).toBeVisible()

    // Only genuine item activation unwinds the tree.
    await page.getByTestId('menu-sub-item-email').click()
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: Email')
    await expect(page.getByTestId('menu-sub-root')).toHaveCount(0)
  })

  test('MN-CLOSE-06: Removing a submenu trigger before close falls back to a live item', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-remove-trigger').click()
    await expect(page.getByTestId('menu-probe-remove-root')).toBeFocused()
    await page.getByTestId('probe-remove-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-remove-item')).toBeFocused()

    // Synthetic removal click: a real press would outside-dismiss first.
    await page
      .getByTestId('btn-probe-remove-hide')
      .evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('probe-remove-trigger')).toHaveCount(0)

    await page.getByTestId('probe-remove-item').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-probe-remove-logs')).toHaveText(
      'Remove Logs: remove:onOpen,remove:onDismiss'
    )
    await expect(page.getByTestId('probe-remove-content')).toHaveCount(0)
    await expect(page.getByTestId('probe-remove-first')).toBeFocused()
    await expect(page.getByTestId('menu-probe-remove-root')).toBeVisible()
  })

  test('MN-CLOSE-06: Disabling a submenu trigger before close falls back to a live item', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-remove-trigger').click()
    await expect(page.getByTestId('menu-probe-remove-root')).toBeFocused()
    await page.getByTestId('probe-remove-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-remove-item')).toBeFocused()

    await page
      .getByTestId('btn-probe-remove-disable')
      .evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('probe-remove-trigger')).toHaveAttribute(
      'aria-disabled',
      'true'
    )

    await page.getByTestId('probe-remove-item').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-probe-remove-logs')).toHaveText(
      'Remove Logs: remove:onOpen,remove:onDismiss'
    )
    await expect(page.getByTestId('probe-remove-first')).toBeFocused()
  })

  test('MN-CLOSE-07: One layer per root popup and open submenu, one request per event', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await page.getByTestId('menu-sub-trigger-l2').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-deep')).toBeFocused()

    // One Escape reaches only the top affected level, exactly once.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss'
    )
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-root')).toBeVisible()
    await expect(page.getByTestId('menu-sub-root-logs')).toHaveText('Sub Root Logs: true')

    // One outside press unwinds deepest-first with a single root request.
    await page.getByTestId('sub-outside').click()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss,share:onDismiss'
    )
    await expect(page.getByTestId('menu-sub-root-logs')).toHaveText('Sub Root Logs: true,false')
    await expect(page.getByTestId('menu-sub-root')).toHaveCount(0)
  })

  test('MN-CLOSE-09: Extension overlay interaction dismisses once despite stopped mouse events', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-ext-trigger').click()
    await expect(page.getByTestId('menu-probe-ext-root')).toBeFocused()
    await expect(page.getByTestId('menu-probe-ext-root')).toBeVisible()
    await page.getByTestId('probe-ext-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-ext-content')).toBeVisible()

    await page.getByTestId('probe-extension').click()
    // P1 (F44, DIAG D1): WebKit click-focus never lands on buttons, so
    // re-deliver the Chromium focus state; the dismiss-once + no-steal
    // assertions below then test the extension press on every engine.
    if (engineOf() === 'webkit') await page.getByTestId('probe-extension').focus()
    await expect(page.getByTestId('menu-probe-ext-logs')).toHaveText(
      'Ext Logs: share:onOpen,share:onDismiss'
    )
    await expect(page.getByTestId('menu-probe-ext-root')).toHaveCount(0)
    await expect(page.getByTestId('probe-extension')).toBeFocused()
  })
})

test.describe('Menu pointer submenu intent (P2E)', () => {
  test('MN-INTENT-02: Diagonal travel toward content keeps the submenu open', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    const content = page.getByTestId('menu-sub-content')
    await page.getByTestId('menu-sub-item-new').focus()

    await trigger.hover()
    await expect(content).toBeVisible()

    // Diagonal path through the 5px grace polygon into the content. The path
    // ends on a plain item: resting on the nested More trigger would
    // legitimately hover-open the second level mid-travel.
    const from = await centerOf(trigger)
    const to = await centerOf(page.getByTestId('menu-sub-item-email'))
    await page.mouse.move(from.x, from.y)
    for (let step = 1; step <= 8; step++) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * step) / 8,
        from.y + ((to.y - from.y) * step) / 8
      )
    }
    await page.waitForTimeout(450)

    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('menu-sub-logs')).toHaveText('Sub Logs: share:onOpen')
    await expect(page.getByTestId('menu-sub-item-new')).toBeFocused()

    // The content stays reachable: travel ends in a genuine selection.
    await page.getByTestId('menu-sub-item-email').click()
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: Email')
  })

  test('MN-INTENT-03: Travel clearly away requests closure at 300ms, not before', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    const content = page.getByTestId('menu-sub-content')
    const logs = page.getByTestId('menu-sub-logs')

    await trigger.hover()
    await expect(content).toBeVisible()

    await page.mouse.move(30, 30)
    await page.waitForTimeout(150)
    await expect(logs).toHaveText('Sub Logs: share:onOpen')
    await expect(content).toBeVisible()

    await expect(logs).toHaveText('Sub Logs: share:onOpen,share:onDismiss', { timeout: 3000 })
    await expect(content).toHaveCount(0)
  })

  test('MN-INTENT-04: Returning through the submenu path duplicates no callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    const content = page.getByTestId('menu-sub-content')
    const logs = page.getByTestId('menu-sub-logs')

    await trigger.hover()
    await expect(content).toBeVisible()

    // Trigger -> content -> same trigger: associated level stays open, silent.
    const triggerPoint = await centerOf(trigger)
    const contentPoint = await centerOf(content)
    await page.mouse.move(contentPoint.x, contentPoint.y)
    await page.mouse.move(triggerPoint.x, triggerPoint.y)
    await page.waitForTimeout(450)
    await expect(content).toBeVisible()
    await expect(logs).toHaveText('Sub Logs: share:onOpen')

    // Deeper: return to the root trigger closes only the unassociated level.
    await page.getByTestId('menu-sub-trigger-l2').hover()
    await expect(page.getByTestId('menu-sub-content-l2')).toBeVisible()
    await page.mouse.move(triggerPoint.x, triggerPoint.y)
    await expect(logs).toHaveText('Sub Logs: share:onOpen,more:onOpen,more:onDismiss', {
      timeout: 3000,
    })
    await expect(page.getByTestId('menu-sub-content-l2')).toHaveCount(0)
    await expect(content).toBeVisible()
  })

  test('MN-INTENT-05: Switching to another parent entry closes the open submenu once', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    const logs = page.getByTestId('menu-sub-logs')

    // Sibling item: old level closes once, no action runs.
    await trigger.hover()
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await page.getByTestId('menu-sub-item-new').hover()
    await expect(logs).toHaveText('Sub Logs: share:onOpen,share:onDismiss', { timeout: 3000 })
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: None')
  })

  test('MN-INTENT-05: Switching to an enabled trigger closes the old level and opens the new one', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    const logs = page.getByTestId('menu-sub-logs')

    await trigger.hover()
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await page.getByTestId('menu-sub-trigger-omitted').hover()

    await expect(logs).toContainText('share:onDismiss', { timeout: 3000 })
    await expect(logs).toContainText('omitted:onOpen', { timeout: 3000 })
    const text = await logs.textContent()
    expect(text?.split('share:onDismiss').length).toBe(2)
    expect(text?.split('omitted:onOpen').length).toBe(2)
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)
  })

  test('MN-INTENT-06: Grace geometry follows the resolved collision side', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-flip-trigger').click()
    const trigger = page.getByTestId('probe-flip-trigger')
    const content = page.getByTestId('probe-flip-content')
    const logs = page.getByTestId('menu-probe-flip-logs')

    await trigger.hover()
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-side', 'left')

    // Toward travel on the flipped side keeps the level open.
    const from = await centerOf(trigger)
    const to = await centerOf(content)
    await page.mouse.move(from.x, from.y)
    for (let step = 1; step <= 8; step++) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * step) / 8,
        from.y + ((to.y - from.y) * step) / 8
      )
    }
    await page.waitForTimeout(450)
    await expect(content).toBeVisible()
    await expect(logs).toHaveText('Flip Logs: flip:onOpen')

    // Away travel on the flipped side requests close once.
    await page.mouse.move(30, 400)
    await expect(logs).toHaveText('Flip Logs: flip:onOpen,flip:onDismiss', { timeout: 3000 })
    await expect(content).toHaveCount(0)
  })

  test('MN-INTENT-07: RTL mirrors toward-and-away intent geometry', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuRtl')
    await page.getByTestId('btn-rtl-trigger').click()
    const trigger = page.getByTestId('menu-rtl-trigger')
    const content = page.getByTestId('menu-rtl-content')
    const logs = page.getByTestId('menu-rtl-logs')

    await trigger.hover()
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-side', 'left')

    const from = await centerOf(trigger)
    const to = await centerOf(content)
    await page.mouse.move(from.x, from.y)
    for (let step = 1; step <= 8; step++) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * step) / 8,
        from.y + ((to.y - from.y) * step) / 8
      )
    }
    await page.waitForTimeout(450)
    await expect(content).toBeVisible()
    await expect(logs).toHaveText('RTL Logs: share:onOpen')

    await page.mouse.move(770, 450)
    await expect(logs).toHaveText('RTL Logs: share:onOpen,share:onDismiss', { timeout: 3000 })
    await expect(content).toHaveCount(0)
  })

  test('MN-INTENT-08: Touch starts no hover timers and activates the trigger once', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()
    const trigger = page.getByTestId('menu-sub-trigger')
    const logs = page.getByTestId('menu-sub-logs')

    // Touch hover trajectory: enter/move/leave past every intent delay.
    await trigger.evaluate(el => {
      const target = el as HTMLElement
      target.dispatchEvent(
        new PointerEvent('pointerover', { bubbles: true, pointerType: 'touch' })
      )
      target.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch' })
      )
      target.dispatchEvent(
        new PointerEvent('pointerout', { bubbles: true, pointerType: 'touch' })
      )
    })
    await page.waitForTimeout(450)
    await expect(logs).toHaveText('Sub Logs: ')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)

    // Tap-equivalent activation opens exactly once.
    await trigger.click()
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(logs).toHaveText('Sub Logs: share:onOpen')
  })
})

test.describe('Menu placement and dynamic ownership (P2E)', () => {
  test('MN-DOM-08: Submenu content uses the shared Popover engine from its trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    const content = page.getByTestId('menu-sub-content')
    await expect(content).toBeVisible()

    await expect(content).toHaveAttribute('data-side', 'right')
    await expect(content).toHaveAttribute('data-state', 'open')

    const triggerBox = await trigger.boundingBox()
    const contentBox = await content.boundingBox()
    if (!triggerBox || !contentBox) throw new Error('expected trigger and content boxes')
    expect(contentBox.x).toBeGreaterThanOrEqual(triggerBox.x + triggerBox.width - 20)
    expect(Math.abs(contentBox.y - triggerBox.y)).toBeLessThan(48)

    // One stable id across viewport change; single positioned node.
    const id = await content.getAttribute('id')
    expect(id).toBeTruthy()
    await page.setViewportSize({ width: 700, height: 480 })
    await page.waitForTimeout(300)
    await expect(content).toBeVisible()
    expect(await content.getAttribute('id')).toBe(id)
    await expect(content).toHaveAttribute('data-side', 'right')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(1)
    await page.setViewportSize({ width: 800, height: 480 })
  })

  test('MN-DOM-10: Mirrored default placement with explicit geometry passthrough', async ({
    mount,
    page,
  }) => {
    // LTR default resolves right-start.
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-content')).toHaveAttribute('data-side', 'right')

    // RTL default mirrors to left-start.
    await mount('components/Menu/Menu/SubmenuRtl')
    await page.getByTestId('btn-rtl-trigger').click()
    await expect(page.getByTestId('menu-rtl-root')).toBeFocused()
    await page.getByTestId('menu-rtl-trigger').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('menu-rtl-content')).toBeVisible()
    await expect(page.getByTestId('menu-rtl-content')).toHaveAttribute('data-side', 'left')

    // Explicit geometry reaches Popover once; consumer transform survives.
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-explicit-trigger').click()
    await expect(page.getByTestId('menu-probe-explicit-root')).toBeFocused()
    await page.getByTestId('probe-explicit-trigger').focus()
    await page.keyboard.press('ArrowRight')
    const explicit = page.getByTestId('probe-explicit-content')
    await expect(explicit).toBeVisible()
    await expect(explicit).toHaveAttribute('data-side', 'bottom')
    expect(await explicit.getAttribute('style')).toContain('translateX(4px)')
  })

  test('MN-DYNAMIC-02: Removing an open submenu cleans timers, layers, and branches', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    // Witness root opens first and must survive the removal untouched.
    await page.getByTestId('btn-probe-dyn-trigger-b').click()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeVisible()

    // Keyboard opening avoids an outside press against the witness.
    await page.getByTestId('btn-probe-dyn-trigger-a').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-probe-dyn-root-a')).toBeVisible()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeVisible()
    await expect(page.getByTestId('probe-dyn-item-a1')).toBeFocused()

    await page.getByTestId('probe-dyn-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-dyn-content')).toBeVisible()

    await page
      .getByTestId('btn-probe-dyn-remove')
      .evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('probe-dyn-trigger')).toHaveCount(0)
    await expect(page.getByTestId('probe-dyn-content')).toHaveCount(0)

    // Stale timers and branches stay silent; the witness root is unaffected.
    await page.mouse.move(400, 300)
    await page.mouse.move(100, 100)
    await page.waitForTimeout(450)
    await expect(page.getByTestId('menu-probe-dyn-logs')).toHaveText('Dyn Logs: dyn:onOpen')
    await expect(page.getByTestId('menu-probe-dyn-root-a')).toBeVisible()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeVisible()
  })

  test('MN-DYNAMIC-02: Moving an open submenu registers once with its new parent', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-dyn-trigger-a').click()
    await expect(page.getByTestId('menu-probe-dyn-root-a')).toBeFocused()
    await page.getByTestId('probe-dyn-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-dyn-content')).toBeVisible()

    await page.getByTestId('btn-probe-dyn-move').evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('menu-probe-dyn-parent')).toHaveText('Dyn Parent: b')
    await expect(page.getByTestId('probe-dyn-content')).toHaveCount(0)
    await expect(page.getByTestId('menu-probe-dyn-logs')).toHaveText('Dyn Logs: dyn:onOpen')

    // The moved level mounts open under its new parent and closes exactly once.
    await page.getByTestId('btn-probe-dyn-trigger-b').click()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeVisible()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeFocused()
    await expect(page.getByTestId('probe-dyn-content')).toBeVisible()
    await page.getByTestId('probe-dyn-item').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-probe-dyn-logs')).toHaveText(
      'Dyn Logs: dyn:onOpen,dyn:onDismiss'
    )
    await expect(page.getByTestId('probe-dyn-content')).toHaveCount(0)
    await expect(page.getByTestId('probe-dyn-trigger')).toBeFocused()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeVisible()
  })

  test('MN-DYNAMIC-04: Submenu control relationships follow a trigger id change', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-id-trigger').click()
    await expect(page.getByTestId('menu-probe-id-root')).toBeFocused()
    const trigger = page.getByTestId('probe-id-trigger')
    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-id-item')).toBeFocused()
    const contentId = await page.getByTestId('probe-id-content').getAttribute('id')

    // The id update itself requests nothing and keeps expansion + control.
    await page
      .getByTestId('btn-probe-id-change')
      .evaluate(el => (el as HTMLElement).click())
    await expect(trigger).toHaveAttribute('id', 'probe-id-trigger-v2')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)
    await expect(page.locator('#probe-id-trigger-v1')).toHaveCount(0)
    await expect(page.locator('#probe-id-trigger-v2')).toHaveCount(1)
    await expect(page.getByTestId('menu-probe-id-logs')).toHaveText('Id Logs: idsub:onOpen')

    // Close and reopen resolve only to the live node.
    await page.getByTestId('probe-id-item').focus()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('probe-id-item')).toBeFocused()
    await expect(page.getByTestId('menu-probe-id-logs')).toHaveText(
      'Id Logs: idsub:onOpen,idsub:onDismiss,idsub:onOpen'
    )
    await expect(page.locator('#probe-id-trigger-v1')).toHaveCount(0)
  })
})

test.describe('Menu dynamic choice and link parts (P2E)', () => {
  test('MN-CHOICE-10: Dynamic choice values, handlers, and group membership stay current', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/ChoiceDynamic')
    await page.getByTestId('btn-dyn-choice-trigger').click()
    const root = page.getByTestId('menu-dyn-choice-root')
    const changes = page.getByTestId('menu-dyn-choice-change-logs')
    await expect(root).toBeVisible()

    // Added choice joins roles, ARIA, typeahead, and activation at once.
    await page.getByTestId('btn-dyn-add-check').evaluate(el => (el as HTMLElement).click())
    const gamma = page.getByTestId('dyn-check-gamma')
    await expect(gamma).toHaveAttribute('role', 'menuitemcheckbox')
    await expect(gamma).toHaveAttribute('aria-checked', 'false')
    await page.getByTestId('dyn-check-alpha').focus()
    await page.keyboard.press('g')
    await expect(gamma).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(changes).toContainText('gamma:true')
    await expect(root).toBeVisible()

    // Reorder follows value identity; the checked member stays checked.
    await page.getByTestId('btn-dyn-reverse-radios').evaluate(el => (el as HTMLElement).click())
    const order = await root.locator('[role="menuitemradio"]').evaluateAll(els =>
      els.map(el => el.getAttribute('data-testid'))
    )
    expect(order).toEqual(['dyn-radio-date', 'dyn-radio-name'])
    await expect(page.getByTestId('dyn-radio-name')).toHaveAttribute('aria-checked', 'true')

    // A radio moved between groups answers to its new group authority.
    await page.getByTestId('btn-dyn-move-radio').evaluate(el => (el as HTMLElement).click())
    await expect(
      page.getByTestId('dyn-view-group').getByTestId('dyn-radio-date')
    ).toBeVisible()
    await expect(page.getByTestId('dyn-sort-group').locator('[role="menuitemradio"]')).toHaveCount(
      1
    )
    await page.getByTestId('dyn-radio-name').focus()
    await page.keyboard.press('Enter')
    await expect(changes).toContainText('sort:name')

    // Disabling the focused choice keeps one tab stop and valid menu focus.
    await page.getByTestId('dyn-check-beta').focus()
    await page.getByTestId('btn-dyn-disable-beta').evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('dyn-check-beta')).toHaveAttribute('aria-disabled', 'true')
    await expect(root.locator('[tabindex="0"]')).toHaveCount(1)
    expect(
      await root.evaluate(
        el => el.contains(document.activeElement) && document.activeElement !== document.body
      )
    ).toBe(true)

    // Removed choices leave no stale registrations behind.
    await page.getByTestId('btn-dyn-remove-check').evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('dyn-check-alpha')).toHaveCount(0)
    await page.waitForTimeout(1200)
    await page.getByTestId('dyn-check-gamma').focus()
    await page.keyboard.press('a')
    await expect(page.getByTestId('dyn-check-gamma')).toBeFocused()
    await expect(changes).not.toContainText('alpha:')
  })

  test('MN-LINK-06: Nested target and download links keep native effects with tree dismissal', async ({
    mount,
    page,
    context,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-nested-trigger').click()
    await expect(page.getByTestId('menu-link-nested-root')).toBeFocused()
    await page.getByTestId('menu-link-nested-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-link-nested-content')).toBeVisible()

    // _blank: the browser receives the exact target request, then one tree unwind.
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByTestId('menu-link-nested-blank').click(),
    ])
    expect(popup.url()).toContain('#nested-blank')
    await popup.close()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: NestedBlank')
    await expect(page.getByTestId('menu-link-nested-logs')).toHaveText(
      'Nested Logs: nested:onOpen,nested:onDismiss'
    )
    await expect(page.getByTestId('menu-link-nested-root-logs')).toHaveText(
      'Nested Root Logs: true,false'
    )
    await expect(page.getByTestId('menu-link-nested-root')).toHaveCount(0)
  })

  test('MN-LINK-06: Nested download links dismiss the tree without navigating', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-nested-trigger').click()
    await expect(page.getByTestId('menu-link-nested-root')).toBeFocused()
    await page.getByTestId('menu-link-nested-trigger').focus()
    await page.keyboard.press('ArrowRight')
    const download = page.getByTestId('menu-link-nested-download')
    await expect(download).toBeVisible()
    await expect(download).toHaveAttribute('download', 'nested.csv')

    await download.click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: NestedDownload')
    await expect(page.getByTestId('menu-link-nested-logs')).toHaveText(
      'Nested Logs: nested:onOpen,nested:onDismiss'
    )
    await expect(page.getByTestId('menu-link-nested-root')).toHaveCount(0)
    // P2 (F40, DIAG stretch): a download is not a navigation, but the download
    // + same-document-fragment interaction is engine-native — Chromium
    // suppresses the fragment nav, Firefox/WebKit perform it (harmless hash).
    expect(await page.evaluate(() => window.location.hash)).toBe(
      engineOf() === 'chromium' ? '' : '#nested-dl'
    )
  })

  test('MN-LINK-09: Dynamic links use current href, label, state, and close policy', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/LinksDynamic')
    await page.getByTestId('btn-dyn-link-trigger').click()
    await expect(page.getByTestId('menu-dyn-link-root')).toBeFocused()
    const docs = page.getByTestId('dyn-link-docs')
    await docs.focus()
    await page.keyboard.press('o')
    await expect(docs).toBeFocused()

    // Retarget: current text matches, stale text does not, href is current.
    await page.getByTestId('btn-dyn-link-retarget').evaluate(el => (el as HTMLElement).click())
    await expect(docs).toHaveAttribute('href', '#new-section')
    await page.waitForTimeout(1200)
    await docs.focus()
    await page.keyboard.press('n')
    await expect(docs).toBeFocused()
    await page.waitForTimeout(1200)
    await page.getByTestId('dyn-link-api').focus()
    await page.keyboard.press('o')
    await expect(page.getByTestId('dyn-link-api')).toBeFocused()

    // Current close policy controls dismissal; navigation still runs once.
    await page.getByTestId('btn-dyn-link-stay').evaluate(el => (el as HTMLElement).click())
    await docs.click()
    await expect(page.getByTestId('menu-dyn-link-action')).toHaveText('Dyn Link Action: docs')
    expect(await page.evaluate(() => window.location.hash)).toBe('#new-section')
    await expect(page.getByTestId('menu-dyn-link-root')).toBeVisible()
    await expect(page.getByTestId('menu-dyn-link-open-logs')).toHaveText(
      'Dyn Link Open Logs: true'
    )

    // Disabled links leave roving; reorder and removal stay current.
    await page.getByTestId('btn-dyn-link-disable').evaluate(el => (el as HTMLElement).click())
    await expect(docs).toHaveAttribute('aria-disabled', 'true')
    await page.getByTestId('btn-dyn-link-reorder').evaluate(el => (el as HTMLElement).click())
    const first = await page
      .getByTestId('menu-dyn-link-root')
      .locator('[role="menuitem"]')
      .first()
      .getAttribute('data-testid')
    expect(first).toBe('dyn-link-api')
    await page.getByTestId('btn-dyn-link-remove').evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('dyn-link-api')).toHaveCount(0)
  })
})

test.describe('Menu composition gates (P2E)', () => {
  test('MN-COMP-01: MenuButton composes Button, Popover, and Menu with one authority', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')

    // Pointer open selects and dismisses with trigger-relative restoration.
    await trigger.click()
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await page.getByTestId('menu-item-edit').click()
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: Edit')
    await expect(page.getByTestId('menu-open-logs')).toHaveText('Open Logs: true,false')
    await expect(trigger).toBeFocused()

    // ArrowUp entry lands on the last enabled item; Escape restores once.
    await trigger.focus()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('menu-item-duplicate')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(trigger).toBeFocused()

    // Tab continues relative to the source trigger, not portal order.
    await trigger.click()
    await page.getByTestId('menu-item-edit').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(page.getByTestId('btn-cancel-trigger')).toBeFocused()
  })

  test('MN-COMP-02: ContextMenu composes a virtual anchor with Menu and no trigger markup', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/ContextMenu')
    const target = page.getByTestId('ctx-target')
    const logs = page.getByTestId('menu-ctx-logs')

    // Primary click never opens; the target carries no MenuButton markup.
    await target.click()
    await expect(page.getByTestId('menu-ctx-root')).toHaveCount(0)
    expect(await target.getAttribute('aria-expanded')).toBeNull()
    expect(await target.getAttribute('aria-controls')).toBeNull()
    expect(await target.getAttribute('aria-haspopup')).toBeNull()

    // Right press opens at the pointer anchor with entry on the first item.
    const targetBox = await target.boundingBox()
    if (!targetBox) throw new Error('expected context target box')
    const at = { x: targetBox.x + 40, y: targetBox.y + 20 }
    await page.mouse.click(at.x, at.y, { button: 'right' })
    const root = page.getByTestId('menu-ctx-root')
    await expect(root).toBeVisible()
    await expect(page.getByTestId('menu-ctx-item-edit')).toBeFocused()
    const rootBox = await root.boundingBox()
    if (!rootBox) throw new Error('expected context menu box')
    expect(Math.abs(rootBox.x - at.x)).toBeLessThan(80)
    expect(Math.abs(rootBox.y - at.y)).toBeLessThan(80)

    // Internal context presses stay inside without dismissing.
    await page.getByTestId('menu-ctx-item-edit').click({ button: 'right' })
    await expect(logs).not.toContainText('root:onDismiss')
    await expect(root).toBeVisible()

    // Keyboard gesture opens with the same entry focus.
    await page.keyboard.press('Escape')
    await expect(root).toHaveCount(0)
    await target.focus()
    await page.keyboard.press('Shift+F10')
    await expect(root).toBeVisible()
    await expect(page.getByTestId('menu-ctx-item-edit')).toBeFocused()

    // A repeated source gesture closes stale submenus and reopens only root.
    const ctxTrigger = page.getByTestId('menu-ctx-trigger')
    await ctxTrigger.focus()
    await expect(ctxTrigger).toBeFocused()
    await ctxTrigger.press('ArrowRight')
    await expect(page.getByTestId('menu-ctx-content')).toBeVisible()
    await target.evaluate(el => {
      const rect = el.getBoundingClientRect()
      el.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 10,
          clientY: rect.top + 10,
        })
      )
    })
    await expect(page.getByTestId('menu-ctx-content')).toHaveCount(0)
    await expect(root).toBeVisible()
    await expect(logs).toContainText('share:onDismiss')

    // Outside right press dismisses once with native behavior unprevented.
    const prevented = await page.getByTestId('ctx-outside').evaluate(el => {
      let observed: boolean | null = null
      el.addEventListener(
        'contextmenu',
        e => {
          observed = e.defaultPrevented
        },
        { once: true }
      )
      el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
      return observed
    })
    expect(prevented).toBe(false)
    await expect(root).toHaveCount(0)
    const text = await logs.textContent()
    const dismisses = text?.split('root:onDismiss').length ?? 0
    // One for the Escape leg, one for the repeated gesture, one for outside.
    expect(dismisses).toBe(4)
  })

  test('MN-COMP-03: Two-level submenu ownership across keyboard, intent, and dismissal', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    const rootTrigger = page.getByTestId('btn-sub-trigger')
    await rootTrigger.click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()

    // Two keyboard levels open with mounted focus targets. The entry-focus
    // effect lands on a frame: settle it before moving to the next trigger
    // or it steals focus back after our programmatic focus under load.
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await page.getByTestId('menu-sub-trigger-l2').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-deep')).toBeFocused()

    // Intent travel keeps the deep level open without extra requests.
    const l2Trigger = page.getByTestId('menu-sub-trigger-l2')
    const l2Content = page.getByTestId('menu-sub-content-l2')
    const from = await centerOf(l2Trigger)
    const to = await centerOf(l2Content)
    await page.mouse.move(from.x, from.y)
    for (let step = 1; step <= 6; step++) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * step) / 6,
        from.y + ((to.y - from.y) * step) / 6
      )
    }
    await page.waitForTimeout(450)
    await expect(l2Content).toBeVisible()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen'
    )

    // Deep selection unwinds deepest-first with one root restoration.
    await page.getByTestId('menu-sub-item-deep').click()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss,share:onDismiss'
    )
    await expect(page.getByTestId('menu-sub-root-logs')).toHaveText('Sub Root Logs: true,false')
    await expect(rootTrigger).toBeFocused()

    // Mirrored ownership holds under RTL.
    await mount('components/Menu/Menu/SubmenuRtl')
    await page.getByTestId('btn-rtl-trigger').click()
    await expect(page.getByTestId('menu-rtl-root')).toBeFocused()
    await page.getByTestId('menu-rtl-trigger').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('menu-rtl-item-email')).toBeFocused()
    await page.getByTestId('menu-rtl-item-email').click()
    await expect(page.getByTestId('menu-rtl-action')).toHaveText('RTL Action: Email')
    await expect(page.getByTestId('btn-rtl-trigger')).toBeFocused()
  })

  test('MN-COMP-04: Settings menu composes controlled choices with per-item close policy', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-trigger').click()
    const root = page.getByTestId('menu-choice-root')
    await expect(root).toBeVisible()

    // Pointer choice requests state and stays open by default.
    await page.getByTestId('choice-grid').click()
    await expect(page.getByTestId('menu-choice-change-logs')).toHaveText(
      'Choice Changes: grid:true'
    )
    await expect(root).toBeVisible()
    await expect(page.getByTestId('menu-choice-state')).toContainText('grid=true')

    // Keyboard radio requests its value with shared roving order.
    await page.getByTestId('choice-sort-date').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-choice-change-logs')).toHaveText(
      'Choice Changes: grid:true,sort:date'
    )
    await expect(root).toBeVisible()

    // Typeahead crosses into choices; rejection stays authoritative.
    await page.getByTestId('choice-plain').focus()
    await page.keyboard.press('m')
    await expect(page.getByTestId('choice-mixed')).toBeFocused()
    await page.getByTestId('choice-mixed').click()
    await expect(page.getByTestId('choice-mixed')).toHaveAttribute('aria-checked', 'mixed')

    // Explicit close policy dismisses after the state request.
    await page.keyboard.press('Escape')
    await page.getByTestId('btn-choice-close-trigger').click()
    await page.getByTestId('choice-close-check').click()
    await expect(page.getByTestId('menu-choice-close-logs')).toHaveText(
      'Choice Close Logs: true,false'
    )
    await expect(page.getByTestId('menu-choice-close-root')).toHaveCount(0)
  })

  test('MN-COMP-05: Mixed link-and-command menu keeps native link gestures', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')

    // Plain activation navigates natively and dismisses by default.
    await page.getByTestId('btn-link-trigger').click()
    await page.getByTestId('menu-link-help').click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Help')
    expect(await page.evaluate(() => window.location.hash)).toBe('#help-section')
    await expect(page.getByTestId('menu-link-root')).toHaveCount(0)

    // Keyboard activation preserves navigation with default dismissal.
    // Settle the pointer-open entry focus first: it lands on a frame and
    // would otherwise steal focus back after our programmatic focus.
    await page.getByTestId('btn-link-trigger').click()
    const linkRoot = page.getByTestId('menu-link-root')
    await expect(linkRoot).toBeVisible()
    await expect(linkRoot).toBeFocused()
    const download = page.getByTestId('menu-link-download')
    await download.focus()
    await expect(download).toBeFocused()
    await download.press('Enter')
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Download')
    await expect(page.getByTestId('menu-link-root')).toHaveCount(0)

    // Alternate gestures stay native: no select, no dismiss.
    await page.getByTestId('btn-link-trigger').click()
    await page.keyboard.down('Meta')
    await page.getByTestId('menu-link-help').click()
    await page.keyboard.up('Meta')
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Download')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()

    // Cancellation stops both navigation and dismissal.
    await page.getByTestId('menu-link-cancel').click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: CancelObserved')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
    await expect(page.getByTestId('menu-link-open-logs')).toHaveText(
      'Link Open Logs: true,false,true,false,true'
    )

    // Preserved-open links navigate without dismissing.
    await page.getByTestId('menu-link-stay').click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Stay')
    expect(await page.evaluate(() => window.location.hash)).toBe('#stay-section')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
  })
})

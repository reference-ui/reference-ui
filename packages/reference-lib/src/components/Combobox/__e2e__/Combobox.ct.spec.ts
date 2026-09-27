import { test, expect, snap } from '../../../../playwright/ct'
import type { Locator, Page } from '@playwright/test'

async function expectAnchoredBottomStart(trigger: Locator, content: Locator) {
  const triggerBox = await trigger.boundingBox()
  const contentBox = await content.boundingBox()
  expect(triggerBox).toBeTruthy()
  expect(contentBox).toBeTruthy()

  expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 2)
  expect(contentBox!.y).toBeLessThan(triggerBox!.y + triggerBox!.height + 24)
  expect(Math.abs(contentBox!.x - triggerBox!.x)).toBeLessThan(16)
}

test.describe('Combobox CT', () => {
  test('renders combobox input, opens popover on click, selects option and closes', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/FruitSelect')

    const input = page.getByTestId('combobox-input')
    const popover = page.getByTestId('combobox-popover')
    const display = page.getByTestId('combobox-value-display')

    await expect(input).toHaveAttribute('role', 'combobox')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).toHaveCount(0)
    await page.waitForTimeout(300)
    await snap(page, 'combobox-resting')

    // Click input -> opens popover (focus alone never opens)
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect(popover).toBeVisible()
    await expectAnchoredBottomStart(input, popover)

    const optBanana = page.getByTestId('combo-opt-banana')
    await expect(optBanana).toBeVisible()
    const optBox = await optBanana.boundingBox()
    expect(optBox?.height).toBe(34)
    await page.waitForTimeout(300)
    await snap(page, 'combobox-open')

    // Hover banana option
    await optBanana.hover()
    await page.waitForTimeout(200)
    await snap(page, 'combobox-hover-option')

    // Click Banana option -> selects banana and closes popover
    await optBanana.click()
    await expect(popover).toHaveCount(0)
    await expect(input).toHaveValue('Banana')
    await expect(display).toHaveText('Selected: banana')
    await page.waitForTimeout(300)
    await snap(page, 'combobox-selected')
  })

  test('displays checkmark indicator when selected, and has solid highlight on focus with no outline ring', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/FruitSelect')

    const input = page.getByTestId('combobox-input')
    const popover = page.getByTestId('combobox-popover')

    // Click input to open popover
    await input.click()
    await expect(popover).toBeVisible()

    const optBanana = page.getByTestId('combo-opt-banana')
    const optApple = page.getByTestId('combo-opt-apple')

    // Click Banana to select it
    await optBanana.click()
    await expect(popover).toHaveCount(0)

    // Re-open popover
    await input.click()
    await expect(popover).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'combobox-reopened-with-check')

    // Selected option has checkmark tick slot
    const bananaCheck = optBanana.locator('[data-slot="check"]')
    await expect(bananaCheck).toBeVisible()
    await expect(bananaCheck.locator('svg')).toBeVisible()

    // Unselected option does NOT have checkmark tick slot
    const appleCheck = optApple.locator('[data-slot="check"]')
    await expect(appleCheck).toHaveCount(0)

    // Focus apple option
    await optApple.focus()
    await expect(optApple).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'combobox-option-focused')

    const appleStyles = await optApple.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        backgroundColor: s.backgroundColor,
      }
    })

    // No outline ring on focused combobox option
    const isOutlineAbsent =
      appleStyles.outlineStyle === 'none' ||
      appleStyles.outlineWidth === '0px' ||
      appleStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      appleStyles.outlineColor === 'transparent' ||
      appleStyles.outlineColor.includes('/ 0)')

    expect(isOutlineAbsent).toBe(true)

    // Solid background on focused option
    expect(appleStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(appleStyles.backgroundColor).not.toBe('transparent')
    expect(appleStyles.backgroundColor.includes('/ 0)')).toBe(false)
  })
})

async function readLog(page: Page, testid: string): Promise<string[]> {
  const text = await page.getByTestId(testid).textContent()
  return JSON.parse(text ?? '[]')
}

async function focusedTestId(page: Page) {
  return page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid')
  )
}

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

async function clickPopoverChrome(page: Page, popover: Locator) {
  const box = await popover.boundingBox()
  const firstOption = popover.locator('[role="option"]').first()
  const optBox = await firstOption.boundingBox()
  expect(box).toBeTruthy()
  expect(optBox).toBeTruthy()
  const gap = optBox!.y - box!.y
  expect(gap).toBeGreaterThan(0)
  await page.mouse.click(box!.x + 3, box!.y + gap / 2)
}

test.describe('Combobox quarantine reconciliation CT', () => {
  test('CB-DOM-01: transparent coordinator with native parts and controlled relationships', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    const popover = page.getByTestId('log-popover')

    await expect(input).toHaveAttribute('role', 'combobox')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    await expect(input).toHaveAttribute('aria-haspopup', 'listbox')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).toHaveCount(0)

    await input.click()
    await expect(popover).toBeVisible()
    const tag = await popover.evaluate(el => el.tagName)
    expect(tag).toBe('DIV')
    await expect(popover).toHaveAttribute('role', 'presentation')
    await expect(popover.locator('[role="listbox"]')).toBeVisible()
    const controls = await input.getAttribute('aria-controls')
    expect(controls).toBe(await popover.getAttribute('id'))
  })

  test('CB-DOM-09/CB-COMMIT-04: nonmodal tab order with tab commit and native traversal', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TabOrder')

    const before = page.getByTestId('tab-before')
    const input = page.getByTestId('tab-input')
    const after = page.getByTestId('tab-after')

    await before.click()
    await expect(before).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(input).toBeFocused()
    // #11: focus alone never opens.
    await expect(input).toHaveAttribute('aria-expanded', 'false')

    // Closed ArrowDown opens with first enabled pending; the next arrow
    // derives keyboard intent, which Tab commits while traversing natively.
    await page.keyboard.press('ArrowDown')
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    const apple = page.getByTestId('tab-opt-apple')
    await expectActiveDescendant(input, apple)

    await page.keyboard.press('ArrowDown')
    const banana = page.getByTestId('tab-opt-banana')
    await expectActiveDescendant(input, banana)

    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-value-display')).toHaveText('Selected: banana')
    await expect(after).toBeFocused()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  test('CB-DOM-12: one popover with collision-safe bottom-start placement', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/FruitSelect')

    const input = page.getByTestId('combobox-input')
    const popover = page.getByTestId('combobox-popover')
    await input.click()
    await expect(popover).toBeVisible()
    await expect(popover).toHaveAttribute('data-side', 'bottom')
    await expect(popover).toHaveAttribute('data-align', 'start')
    await expectAnchoredBottomStart(input, popover)
    await expect(page.getByTestId('combobox-popover')).toHaveCount(1)
  })

  test('CB-OPEN-01: ArrowDown requests open without disturbing focus or text', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/FixedClosed')

    const input = page.getByTestId('fixed-input')
    await input.focus()
    // #11: focus never requests open.
    expect(await readLog(page, 'fixed-log')).toEqual([])
    await expect(input).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('ArrowDown')
    // ArrowDown adds exactly one request; focus and text are undisturbed.
    expect(await readLog(page, 'fixed-log')).toEqual(['open'])
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('Hello')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('fixed-popover')).toHaveCount(0)
  })

  test('CB-OPEN-02: ArrowUp opens with the selected option pending', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectedLog')

    const input = page.getByTestId('log-input')
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    const bravo = page.getByTestId('log-opt-bravo')
    await expectActiveDescendant(input, bravo)
  })

  test('CB-OPEN-04: open editable input stays open on click; trigger toggles', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(await readLog(page, 'log-counts')).not.toContain('dismiss')
  })

  test('CB-OPEN-04 select-only: trigger toggles with open and dismiss requests', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')

    const trigger = page.getByTestId('select-trigger')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(await readLog(page, 'select-log')).toEqual(['open', 'dismiss'])
  })

  test('CB-OPEN-08: readOnly and disabled sources never request open', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/DisabledReadonly')

    const readonly = page.getByTestId('dr-readonly')
    await readonly.click()
    await readonly.focus()
    await page.keyboard.press('ArrowDown')
    expect(await readLog(page, 'dr-log')).toEqual([])

    // Disabled sources are inert: no focus, no click, no request.
    await page.getByTestId('dr-disabled').focus()
    await expect(page.getByTestId('dr-disabled')).not.toBeFocused()
    expect(await readLog(page, 'dr-log')).toEqual([])
  })

  test('CB-EDIT-01: arrows move the active descendant while DOM focus stays in input', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    await input.click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    const bravo = page.getByTestId('log-opt-bravo')
    await expectActiveDescendant(input, bravo)
    expect(await focusedTestId(page)).toBe('log-input')
  })

  test('CB-EDIT-03 caret: Home and End move the caret with the active option unchanged', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/CaretField')

    const input = page.getByTestId('caret-input')
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Home')
    expect(await input.evaluate(el => (el as HTMLInputElement).selectionStart)).toBe(0)
    await page.keyboard.press('End')
    expect(await input.evaluate(el => (el as HTMLInputElement).selectionStart)).toBe(11)
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    expect(await readLog(page, 'caret-log')).toEqual([])
  })

  test('CB-EDIT-04 ancestor scroll: scrolling the page dismisses the open popover', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ScrollPage')

    const input = page.getByTestId('scroll-input')
    await input.click()
    await expect(page.getByTestId('scroll-popover')).toBeVisible()

    await page.evaluate(() => window.scrollBy(0, 400))
    await expect(page.getByTestId('scroll-popover')).toHaveCount(0)
    expect(await readLog(page, 'scroll-log')).toContain('dismiss')
  })

  test('CB-EDIT-08: pointer commit keeps input focus and fills the label', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    await input.click()
    await page.getByTestId('log-opt-bravo').click()
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('Bravo')
  })

  test('CB-NAV-01: arrows wrap through enabled options, skipping disabled, focus stays', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    const opt = (testid: string) => page.getByTestId(testid)
    await input.click()

    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, opt('log-opt-alpha'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, opt('log-opt-bravo'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, opt('log-opt-charlie'))
    // Wraps past the disabled delta back to alpha.
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, opt('log-opt-alpha'))
    // Wraps back up to charlie.
    await page.keyboard.press('ArrowUp')
    await expectActiveDescendant(input, opt('log-opt-charlie'))
    expect(await focusedTestId(page)).toBe('log-input')
  })

  test('CB-NAV-05 hover half: pointer-hovered option goes active without focus or commit', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    await input.click()
    await page.keyboard.press('ArrowDown')
    await page.getByTestId('log-opt-bravo').hover()
    const bravo = page.getByTestId('log-opt-bravo')
    await expectActiveDescendant(input, bravo)
    expect(await focusedTestId(page)).toBe('log-input')
    expect(await readLog(page, 'log-counts')).not.toContain('change:bravo')
  })

  test('CB-NAV-08: newly active option scrolls inside the popover; page and input unmoved', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/LongList')

    const input = page.getByTestId('long-input')
    await input.click()
    // Park the cursor off-fixture so no hover highlight races the arrows.
    await page.mouse.move(6, 6)
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('ArrowDown')
    }
    // opt-05 is disabled, so 12 arrows land on opt-12.
    const target = page.getByTestId('long-opt-opt-12')
    await expectActiveDescendant(input, target)
    await expect(target).toBeInViewport()
    const listScrollTop = await page
      .getByTestId('long-popover')
      .locator('[role="listbox"]')
      .evaluate(el => (el as HTMLElement).scrollTop)
    expect(listScrollTop).toBeGreaterThan(0)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await expect(input).toBeInViewport()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  test('CB-COMMIT-03: popup chrome click is ignored; option pointer commits exactly once', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    const popover = page.getByTestId('log-popover')
    await input.click()
    await clickPopoverChrome(page, popover)
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(await readLog(page, 'log-counts')).toEqual(['open'])

    await page.getByTestId('log-opt-charlie').click()
    const log = await readLog(page, 'log-counts')
    expect(log.filter(e => e === 'change:charlie').length).toBe(1)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  test('CB-CLOSE-01: true outside press dismisses once; internal chrome stays open', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    const popover = page.getByTestId('log-popover')
    await input.click()
    await clickPopoverChrome(page, popover)
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    // Click fixture padding above the input: guaranteed outside the popover.
    await page.mouse.click(6, 6)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    const log = await readLog(page, 'log-counts')
    expect(log.filter(e => e === 'dismiss').length).toBe(1)
  })

  test('CB-CLOSE-02: popover registers as an overlay branch inside a parent overlay', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/NestedOverlay')

    await expect(page.getByTestId('parent-content')).toBeVisible()
    const input = page.getByTestId('nested-input')
    await input.click()
    await expect(page.getByTestId('nested-popover')).toBeVisible()

    await page.getByTestId('nested-opt-bravo').click()
    await expect(page.getByTestId('nested-value-display')).toHaveText('Selected: bravo')
    await expect(page.getByTestId('parent-state')).toHaveText('parent-open')
    await expect(page.getByTestId('parent-content')).toBeVisible()
  })

  test('LB-CB-01: virtual focus without tab stops; activedescendant tracks; one scalar commit', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    await input.click()

    const tabIndexes = await page
      .getByTestId('log-popover')
      .locator('[role="option"]')
      .evaluateAll(els => els.map(el => (el as HTMLElement).tabIndex))
    expect(tabIndexes.length).toBe(4)
    expect(tabIndexes.every(t => t === -1)).toBe(true)

    await page.keyboard.press('ArrowDown')
    const alpha = page.getByTestId('log-opt-alpha')
    const activeId = await input.getAttribute('aria-activedescendant')
    expect(activeId).toBe(await alpha.getAttribute('id'))
    expect(
      await page.evaluate(id => !!document.getElementById(id!), activeId)
    ).toBe(true)

    await page.keyboard.press('Enter')
    const log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual(['change:alpha'])
  })

  test('LB-CB-04: only the activedescendant-named option publishes active styling', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/DynamicOptions')

    const input = page.getByTestId('dyn-input')
    await input.click()
    await page.keyboard.press('ArrowDown')
    const bravo = page.getByTestId('dyn-opt-bravo')
    await expectActiveDescendant(input, bravo)

    // Only bravo carries data-active; alpha keeps selected state independently.
    await expect(bravo).toHaveAttribute('data-active', '')
    await expect(page.getByTestId('dyn-opt-alpha')).not.toHaveAttribute('data-active', '')
    await expect(page.getByTestId('dyn-opt-charlie')).not.toHaveAttribute('data-active', '')
    await expect(page.getByTestId('dyn-opt-alpha')).toHaveAttribute('data-state', 'selected')
    await page.waitForTimeout(300)
    await snap(page, 'combobox-lb-cb-04-highlight')

    // Removing the active option leaves no stale reference behind.
    await page.getByTestId('dyn-remove-bravo').click()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    const alpha = page.getByTestId('dyn-opt-alpha')
    await expectActiveDescendant(input, alpha)
  })

  test('FI-COMP-04 Combobox side: token picker commits one scalar value; chip removal is silent', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TokenPicker')

    const opener = page.getByTestId('token-opener')
    await expect(opener).toHaveAttribute('type', 'button')
    await expect(opener).not.toHaveAttribute('role', 'combobox')
    const labelFor = await page.locator('label[for="people"]').getAttribute('for')
    expect(labelFor).toBe('people')

    await opener.click()
    const input = page.getByTestId('token-input')
    await expect(input).toBeFocused()
    const popover = page.getByTestId('token-popover')
    await expect(popover).toBeVisible()
    const listInsideField = await page.evaluate(() => {
      const field = document.querySelector('[data-testid="token-field"]')!
      const list = document.querySelector('[data-testid="token-popover"] [role="listbox"]')!
      return field.contains(list)
    })
    expect(listInsideField).toBe(false)

    await page.getByTestId('token-opt-grace').click()
    await expect(page.getByTestId('token-change-count')).toHaveText('1')
    await expect(page.getByTestId('token-value')).toHaveText('grace')
    const chip = page.getByTestId('chip-grace')
    await expect(chip).toBeVisible()
    await expect(chip).toHaveText('Grace')
    expect(await chip.evaluate(el => el.tagName)).toBe('BUTTON')
    // The popover carries no token nodes; chips are application chrome in Field.
    expect(await popover.locator('[data-testid^="chip-"]').count()).toBe(0)

    await chip.click()
    await expect(page.getByTestId('chip-grace')).toHaveCount(0)
    await expect(page.getByTestId('token-change-count')).toHaveText('1')
  })

  test('CB-SELECT-01: trigger labeling stays app-owned; selected option is active on open', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')

    const trigger = page.getByTestId('select-trigger')
    await expect(trigger).toHaveText('Bravo')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const bravo = page.getByTestId('select-opt-bravo')
    await expectActiveDescendant(trigger, bravo)
  })

  test('CB-SELECT-04 native: Enter opens then commits via one key-decided path, no toggle', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')

    const trigger = page.getByTestId('select-trigger')
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    // Second Enter commits the active option (not a toggle): one scalar
    // commit plus dismissal, no synthetic click duplicate, no text callback.
    // B-36: identical recommit is silent, so the commit moves to charlie.
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-charlie'))
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(await readLog(page, 'select-log')).toEqual(['open', 'change:charlie', 'dismiss'])
  })

  test('CB-COMMIT-07: tab after pointer leave commits nothing, reverts, closes, traverses', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    await input.click()
    // Wait for content mount before arrowing.
    await expect(page.getByTestId('log-opt-alpha')).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('log-opt-alpha'))
    // Pointer overwrites keyboard, then leave clears back to committed.
    await page.getByTestId('log-opt-bravo').hover()
    await expectActiveDescendant(input, page.getByTestId('log-opt-bravo'))
    await page.mouse.move(6, 6)
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)

    await page.keyboard.press('Tab')
    const log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual([])
    expect(log.filter(e => e === 'dismiss').length).toBe(1)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('log-clear')).toBeFocused()
  })

  test('CB-COMMIT-04 source gate: immediate tab on selection-active commits nothing', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectedLog')

    const input = page.getByTestId('log-input')
    await input.click()
    const bravo = page.getByTestId('log-opt-bravo')
    await expectActiveDescendant(input, bravo)

    // Initial-on-open active carries no source, so Tab cannot commit it.
    await page.keyboard.press('Tab')
    const log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual([])
    expect(log.filter(e => e === 'dismiss').length).toBe(1)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('log-clear')).toBeFocused()
  })

  test('CB-REVERT-03: outside press blurs, reverts unmatched text, dismisses once', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    await input.click()
    await page.keyboard.type('Zulu')
    await expect(input).toHaveValue('Zulu')

    // Click fixture padding: blur reverts before Overlay's deferred
    // click-dismiss collapses into the same single dismissal.
    await page.mouse.click(6, 6)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('')
    expect(await readLog(page, 'log-counts')).toEqual([
      'open',
      'input:Z',
      'input:Zu',
      'input:Zul',
      'input:Zulu',
      'input:',
      'dismiss',
    ])
  })

  test('CB-REVERT-07: closeOnBlur=false preserves open and text on blur; escape still closes', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/BlurPersist')

    const input = page.getByTestId('blur-input')
    await input.click()
    await input.press('End')
    await page.keyboard.type('Z')
    await expect(input).toHaveValue('AlphaZ')

    // Programmatic focus (the open popover overlaps the outside button):
    // a real blur with an outside relatedTarget, no pointer involved.
    await page.getByTestId('blur-outside').focus()
    await expect(page.getByTestId('blur-outside')).toBeFocused()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect(input).toHaveValue('AlphaZ')
    expect(await readLog(page, 'blur-log')).toEqual(['open', 'input:AlphaZ'])

    // Escape still runs its documented revert-then-dismiss sequence.
    await input.click()
    await page.keyboard.press('Escape')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('Alpha')
    expect(await readLog(page, 'blur-log')).toEqual([
      'open',
      'input:AlphaZ',
      'input:Alpha',
      'dismiss',
    ])
  })

  test('CB-SELECT-02 trigger arrows: open keeps trigger focus with selection pending', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')

    const trigger = page.getByTestId('select-trigger')
    await trigger.focus()
    await page.keyboard.press('ArrowDown')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-bravo'))
    expect(await focusedTestId(page)).toBe('select-trigger')
    expect(await readLog(page, 'select-log')).toEqual(['open'])

    // Open arrows wrap through enabled options, skipping disabled delta.
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-charlie'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-alpha'))
    await page.keyboard.press('ArrowUp')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-charlie'))
    expect(await focusedTestId(page)).toBe('select-trigger')
    expect(await readLog(page, 'select-log')).toEqual(['open'])
  })

  test('CB-SELECT-03 trigger typeahead: opens closed, cycles enabled matches, commits nothing', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')

    const trigger = page.getByTestId('select-trigger')
    await trigger.focus()
    // Closed typeahead requests one open; nothing is mounted to match yet.
    await page.keyboard.press('a')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(await readLog(page, 'select-log')).toEqual(['open'])

    // Wait for content mount before typeahead matching.
    await expect(page.getByTestId('select-opt-alpha')).toBeVisible()
    await page.keyboard.press('a')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-alpha'))
    await page.keyboard.press('a')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-alpha'))
    expect(await focusedTestId(page)).toBe('select-trigger')
    expect(await readLog(page, 'select-log')).toEqual(['open'])

    // After the buffer timeout the cycle restarts from the first match.
    await page.waitForTimeout(650)
    await page.keyboard.press('b')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-bravo'))
    expect(await readLog(page, 'select-log')).toEqual(['open'])
  })

  test('CB-SELECT-08 trigger home/end: jump to first and last enabled options', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')

    const trigger = page.getByTestId('select-trigger')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // Wait for content mount before Home/End navigation.
    await expect(page.getByTestId('select-opt-alpha')).toBeVisible()
    await page.keyboard.press('End')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-charlie'))
    await page.keyboard.press('Home')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-alpha'))
    expect(await focusedTestId(page)).toBe('select-trigger')
    expect(await readLog(page, 'select-log')).toEqual(['open'])
  })

  test('CB-SELECT-05: select-only escape/tab/blur mirror with zero text callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyTabOrder')

    const trigger = page.getByTestId('sel-tab-trigger')
    const logIsTextFree = async () => {
      const log = await readLog(page, 'sel-tab-log')
      expect(log.filter(e => e.startsWith('input:'))).toEqual([])
      return log
    }

    // Escape: no commit, one close, cleared active, trigger keeps focus.
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).not.toHaveAttribute('aria-activedescendant', /.+/)
    await expect(trigger).toBeFocused()
    expect(await logIsTextFree()).toEqual(['open', 'dismiss'])

    // Tab with keyboard-derived active commits and traverses natively.
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    // Wait for content mount + selection resolution before arrowing.
    await expectActiveDescendant(trigger, page.getByTestId('sel-tab-opt-alpha'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(trigger, page.getByTestId('sel-tab-opt-bravo'))
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('sel-tab-after')).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(await logIsTextFree()).toEqual(['open', 'dismiss', 'open', 'change:bravo', 'dismiss'])

    // Blur outside closes with no commit.
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.getByTestId('sel-tab-after').focus()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(await logIsTextFree()).toEqual([
      'open',
      'dismiss',
      'open',
      'change:bravo',
      'dismiss',
      'open',
      'dismiss',
    ])
  })
})

test.describe('Combobox PATCHES CT', () => {
  test('CB-CLOSE-03 escape: one layer, one positioned popover, one ordered revert-before-dismiss', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/LayerAudit')

    const input = page.getByTestId('layer-input')
    const popover = page.getByTestId('layer-popover')
    await input.click()
    await expect(popover).toBeVisible()

    // One popover, one open layer, shared Popover positioning.
    await expect(page.getByTestId('layer-popover')).toHaveCount(1)
    await expect(page.getByTestId('layer-count')).toHaveText('1')
    await expect(popover).toHaveAttribute('data-side', 'bottom')
    await expect(popover).toHaveAttribute('data-align', 'start')
    await expectAnchoredBottomStart(input, popover)

    // Escape reverts unmatched text, then dismisses — exactly once each,
    // with no double-registered document-level dismissal.
    await page.keyboard.type('Z')
    await expect(input).toHaveValue('Z')
    await page.keyboard.press('Escape')
    expect(await readLog(page, 'layer-log')).toEqual(['open', 'input:Z', 'input:', 'dismiss'])
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
    await expect(popover).toHaveCount(0)
    await expect(page.getByTestId('layer-count')).toHaveText('0')
  })

  test('CB-CLOSE-03 outside: one layer, one positioned popover, one dismissal', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/LayerAudit')

    const input = page.getByTestId('layer-input')
    const popover = page.getByTestId('layer-popover')
    await input.click()
    await expect(popover).toBeVisible()

    await expect(page.getByTestId('layer-popover')).toHaveCount(1)
    await expect(page.getByTestId('layer-count')).toHaveText('1')
    await expect(popover).toHaveAttribute('data-side', 'bottom')
    await expect(popover).toHaveAttribute('data-align', 'start')
    await expectAnchoredBottomStart(input, popover)

    // Click fixture padding above the input: guaranteed outside the popover.
    await page.mouse.click(6, 6)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).toHaveCount(0)
    expect(await readLog(page, 'layer-log')).toEqual(['open', 'dismiss'])
    await expect(page.getByTestId('layer-count')).toHaveText('0')
  })

  test('CB-ENV-03: shadow-root portal destination, focus, scroll, composed paths, ordered callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ShadowLog')

    const host = page.getByTestId('sh-host')
    const input = page.getByTestId('sh-input')
    const popover = page.getByTestId('sh-popover')
    await input.click()
    await expect(popover).toBeVisible()

    // The popover portals into the focus source's ShadowRoot, not body.
    expect(
      await host.evaluate(
        el => !!el.shadowRoot?.querySelector('[data-testid="sh-popover"]')
      )
    ).toBe(true)
    expect(
      await page.evaluate(
        () => !!document.querySelector('[data-testid="sh-popover"]')
      )
    ).toBe(false)

    // Focus is discovered in the owning root.
    expect(
      await host.evaluate(
        el =>
          ((el.shadowRoot?.activeElement ?? null) as HTMLElement | null)?.getAttribute(
            'data-testid'
          ) ?? null
      )
    ).toBe('sh-input')

    // Navigate beyond the window: active IDs resolve in the same root and
    // scroll correction stays inside the popover.
    await page.mouse.move(6, 6)
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('ArrowDown')
    }
    const target = page.getByTestId('sh-opt-opt-11')
    await expectActiveDescendant(input, target)
    const descId = await input.getAttribute('aria-activedescendant')
    expect(descId).toBeTruthy()
    expect(await host.evaluate((el, id) => !!el.shadowRoot?.getElementById(id!), descId)).toBe(
      true
    )
    await expect(target).toBeInViewport()
    const listScrollTop = await popover
      .locator('[role="listbox"]')
      .evaluate(el => (el as HTMLElement).scrollTop)
    expect(listScrollTop).toBeGreaterThan(0)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    // Typing resets active to the first match; Enter commits with the exact
    // ordered callback sequence a cross-engine run compares against.
    await page.keyboard.type('x')
    await page.keyboard.press('Enter')
    expect(await readLog(page, 'sh-log')).toEqual([
      'open',
      'input:x',
      'change:opt-00',
      'dismiss',
    ])
    await expect(popover).toHaveCount(0)

    // Composed inside paths stay open with no extra callbacks.
    await input.click()
    await expect(popover).toBeVisible()
    await clickPopoverChrome(page, popover)
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(await readLog(page, 'sh-log')).toEqual([
      'open',
      'input:x',
      'change:opt-00',
      'dismiss',
      'open',
    ])

    // A true outside path dismisses exactly once.
    await page.mouse.click(6, 6)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).toHaveCount(0)
    expect(await readLog(page, 'sh-log')).toEqual([
      'open',
      'input:x',
      'change:opt-00',
      'dismiss',
      'open',
      'dismiss',
    ])
  })
})

test.describe('Combobox cluster B CT', () => {
  async function logOf(page: Page, testid: string): Promise<string[]> {
    return JSON.parse((await page.getByTestId(testid).textContent()) ?? '[]')
  }

  async function inputState(input: Locator) {
    return input.evaluate((el: HTMLInputElement) => ({
      value: el.value,
      start: el.selectionStart,
      end: el.selectionEnd,
    }))
  }

  async function clickNoFocus(page: Page, testid: string) {
    await page.getByTestId(testid).evaluate((el: HTMLElement) => el.click())
  }

  function captureComboboxDiagnostics(page: Page) {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('[reference-ui] Combobox')) {
        errors.push(msg.text())
      }
    })
    return errors
  }

  test('CB-MODE-01: none navigates suggestions without changing input text', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/NoneLog')
    const input = page.getByTestId('log-input')
    await expect(input).toHaveAttribute('aria-autocomplete', 'none')

    await input.focus()
    await input.pressSequentially('Al')
    expect(await logOf(page, 'log-counts')).toEqual(['input:A', 'open', 'input:Al'])

    await input.press('ArrowDown')
    const bravoId = await page.getByTestId('log-opt-bravo').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', bravoId ?? '')
    await input.press('ArrowDown')
    const charlieId = await page.getByTestId('log-opt-charlie').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', charlieId ?? '')
    expect((await inputState(input)).value).toBe('Al')
    expect(await logOf(page, 'log-counts')).toEqual(['input:A', 'open', 'input:Al'])
  })

  test('CB-MODE-02: list opens on edits and leaves typed text unchanged during navigation', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')
    const input = page.getByTestId('log-input')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')

    await input.focus()
    await input.pressSequentially('al')
    expect(await logOf(page, 'log-counts')).toEqual(['input:a', 'open', 'input:al'])
    await expect(page.getByTestId('log-popover')).toBeVisible()

    await input.press('ArrowDown')
    await input.press('ArrowDown')
    expect((await inputState(input)).value).toBe('al')
    expect(await logOf(page, 'log-counts')).toEqual(['input:a', 'open', 'input:al'])
  })

  test('CB-MODE-03: both completes the suffix; typing replaces only the suffix', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/BothLog')
    const input = page.getByTestId('log-input')
    await expect(input).toHaveAttribute('aria-autocomplete', 'both')

    await input.focus()
    await input.pressSequentially('Al')
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })

    await input.press('p')
    expect(await logOf(page, 'log-counts')).toEqual(['input:A', 'open', 'input:Al', 'input:Alp'])
    await expect(input).toHaveValue('Alpha')
  })

  test('CB-MODE-04: both tracks completion across options and restores the prefix', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/BothLog')
    const input = page.getByTestId('log-input')
    await input.focus()
    await input.pressSequentially('Al')
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })
    const typedLog = await logOf(page, 'log-counts')

    // Pointer preview of a non-matching label drops the completion; leave restores.
    await page.getByTestId('log-opt-bravo').hover()
    expect((await inputState(input)).value).toBe('Al')
    await page.getByTestId('log-popover').hover()
    await page.mouse.move(4, 4)
    expect(await inputState(input)).toEqual({ value: 'Al', start: 2, end: 2 })
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    expect(await logOf(page, 'log-counts')).toEqual(typedLog)
  })

  test('CB-MODE-05: backspace and delete edit inline completion natively without committing', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/BothLog')
    const input = page.getByTestId('log-input')
    const counts = page.getByTestId('log-counts')
    await input.focus()

    // Backspace half from a waited completion (fill is one commit).
    await input.fill('Al')
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })
    await input.press('Backspace')
    await expect(counts).toContainText('input:Al')
    expect(await logOf(page, 'log-counts')).not.toContain('dismiss')
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    // Delete half from a fresh waited completion; caret proof first.
    await input.fill('Al')
    await expect(input).toHaveValue('Alpha')
    await input.press('ArrowLeft')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 2 })
    await input.press('Delete')
    await expect(counts).toContainText('input:Alha')
    const log = await logOf(page, 'log-counts')
    expect(log.some(entry => entry.startsWith('change:'))).toBe(false)
    await expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  test('CB-MODE-06: mode switches clear obsolete completion with the source focused', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ModeSwitchLog')
    const input = page.getByTestId('mode-input')
    await input.click()
    await input.pressSequentially('Al')
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })
    const typedLog = await logOf(page, 'mode-log')

    await clickNoFocus(page, 'mode-set-list')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(await inputState(input)).toEqual({ value: 'Al', start: 2, end: 2 })

    await clickNoFocus(page, 'mode-set-none')
    await expect(input).toHaveAttribute('aria-autocomplete', 'none')
    expect(await inputState(input)).toEqual({ value: 'Al', start: 2, end: 2 })

    await clickNoFocus(page, 'mode-set-both')
    await expect(input).toHaveAttribute('aria-autocomplete', 'both')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })

    // Inline completes like both; switching back to list clears again.
    await clickNoFocus(page, 'mode-set-inline')
    await expect(input).toHaveAttribute('aria-autocomplete', 'inline')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })

    await clickNoFocus(page, 'mode-set-list')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(await inputState(input)).toEqual({ value: 'Al', start: 2, end: 2 })

    expect(await logOf(page, 'mode-log')).toEqual(typedLog)
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(
      'mode-input'
    )
  })

  test('CB-MODE-07: completion navigation emits no text or value callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/BothLog')
    const input = page.getByTestId('log-input')
    await input.focus()
    await input.pressSequentially('Al')
    const before = await page.getByTestId('log-counts').textContent()

    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await input.press('ArrowDown')
    expect(await page.getByTestId('log-counts').textContent()).toBe(before)
    await expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  test('CB-MODE-08: inline completes the suffix; typing replaces only the suffix', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/InlineLog')
    const input = page.getByTestId('log-input')
    await expect(input).toHaveAttribute('aria-autocomplete', 'inline')

    await input.focus()
    await input.pressSequentially('Al')
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })

    await input.press('p')
    expect(await logOf(page, 'log-counts')).toEqual(['input:A', 'open', 'input:Al', 'input:Alp'])
    await expect(input).toHaveValue('Alpha')
  })

  test('CB-OPEN-03 populated: one edit requests one open with content', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')
    const input = page.getByTestId('log-input')
    await input.focus()
    await input.pressSequentially('a')
    expect(await logOf(page, 'log-counts')).toEqual(['input:a', 'open'])
    await input.pressSequentially('b')
    expect(await logOf(page, 'log-counts')).toEqual(['input:a', 'open', 'input:ab'])
  })

  test('CB-OPEN-03 empty: edits never request open without collection content', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/EmptyPopoverLog')
    const emptyInput = page.getByTestId('eo-input')
    await emptyInput.focus()
    await emptyInput.pressSequentially('a')
    expect(await logOf(page, 'eo-log')).toEqual(['input:a'])
    await expect(emptyInput).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('eo-popover')).toHaveCount(0)

    await mount('components/Combobox/Combobox/NoPopoverLog')
    const bareInput = page.getByTestId('np-input')
    await bareInput.focus()
    await bareInput.pressSequentially('a')
    expect(await logOf(page, 'np-log')).toEqual(['input:a'])
    await expect(bareInput).toHaveAttribute('aria-expanded', 'false')
  })

  test('CB-REVERT-02: onEscape runs first; preventDefault stops revert and dismissal', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/EscapeLog')
    const input = page.getByTestId('esc-input')

    // Passing hook: escape runs first, then the documented revert + dismiss.
    await input.click()
    await input.fill('AlphaZ')
    await clickNoFocus(page, 'esc-clear')
    await input.press('Escape')
    expect(await logOf(page, 'esc-log')).toEqual(['escape:Escape', 'input:Alpha', 'dismiss'])
    await expect(input).toHaveAttribute('aria-expanded', 'false')

    // Preventing hook: nothing follows, open DOM stays controlled.
    await clickNoFocus(page, 'esc-toggle')
    await input.click()
    await input.fill('AlphaZ')
    await clickNoFocus(page, 'esc-clear')
    await input.press('Escape')
    expect(await logOf(page, 'esc-log')).toEqual(['escape:Escape'])
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('esc-popover')).toBeVisible()
    expect((await inputState(input)).value).toBe('AlphaZ')
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(
      'esc-input'
    )
  })

  test('CB-DOM-02: autocomplete modes and popup roles map to input relationships', async ({
    mount,
    page,
  }) => {
    for (const [story, mode] of [
      ['NoneLog', 'none'],
      ['InlineLog', 'inline'],
      ['ControlledLog', 'list'],
      ['BothLog', 'both'],
    ] as const) {
      await mount(`components/Combobox/Combobox/${story}`)
      const input = page.getByTestId('log-input')
      await expect(input).toHaveAttribute('role', 'combobox')
      await expect(input).toHaveAttribute('aria-autocomplete', mode)
      await expect(input).toHaveAttribute('aria-haspopup', 'listbox')
      await input.click()
      const controls = await input.getAttribute('aria-controls')
      expect(controls).toBe(await page.getByTestId('log-popover').getAttribute('id'))
    }

    await mount('components/Combobox/Combobox/TreePopupLog')
    await expect(page.getByTestId('tp-input')).toHaveAttribute('aria-haspopup', 'tree')
    await page.getByTestId('tp-input').click()
    await expect(page.getByTestId('tp-input')).toHaveAttribute('aria-controls', await page.getByTestId('tp-popover').getAttribute('id') ?? '')

    await mount('components/Combobox/Combobox/GridLog')
    await expect(page.getByTestId('grid-input')).toHaveAttribute('aria-haspopup', 'grid')
    await page.getByTestId('grid-input').click()
    await expect(page.getByTestId('grid-input')).toHaveAttribute('aria-controls', await page.getByTestId('grid-popover').getAttribute('id') ?? '')
  })

  test('CB-DOM-03: trigger keeps button semantics while exposing popup state', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')
    const trigger = page.getByTestId('select-trigger')
    await expect(trigger).toHaveAttribute('role', 'combobox')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await mount('components/Combobox/Combobox/TreeTriggerLog')
    const treeTrigger = page.getByTestId('tt-trigger')
    await expect(treeTrigger).toHaveAttribute('aria-haspopup', 'tree')
    await treeTrigger.click()
    await expect(treeTrigger).toHaveAttribute('aria-expanded', 'true')

    await mount('components/Combobox/Combobox/GridSelectOnly')
    const gridTrigger = page.getByTestId('gs-trigger')
    await expect(gridTrigger).toHaveAttribute('aria-haspopup', 'grid')
    await gridTrigger.click()
    await expect(gridTrigger).toHaveAttribute('aria-expanded', 'true')
  })

  test('CB-DOM-04: popover owns a stable id and derives grid role only from the adapter', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/GridLog')
    const gridInput = page.getByTestId('grid-input')
    await gridInput.click()
    const gridPopover = page.getByTestId('grid-popover')
    await expect(gridPopover).toHaveAttribute('role', 'grid')
    const gridId = await gridPopover.getAttribute('id')
    await gridInput.pressSequentially('x')
    expect(await gridPopover.getAttribute('id')).toBe(gridId)

    await mount('components/Combobox/Combobox/ControlledLog')
    await page.getByTestId('log-input').click()
    await expect(page.getByTestId('log-popover')).toHaveAttribute('role', 'presentation')
    await expect(page.getByTestId('log-popover').getByRole('listbox')).toBeVisible()

    await mount('components/Combobox/Combobox/TreePopupLog')
    await page.getByTestId('tp-input').click()
    await expect(page.getByTestId('tp-popover')).toHaveAttribute('role', 'presentation')
    await expect(page.getByTestId('tp-tree')).toBeVisible()
  })

  test('CB-ADAPTER-01: grid adapter navigates, scrolls, and commits one scalar', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/GridLog')
    const input = page.getByTestId('grid-input')
    await input.click()
    await expect(page.getByTestId('grid-popover')).toHaveAttribute('role', 'grid')
    expect(await page.getByRole('gridcell').count()).toBe(20)
    expect(await page.getByRole('row').count()).toBe(2)

    // Mounted navigation publishes real IDs with no scroll.
    await input.press('ArrowDown')
    const firstId = await page.getByTestId('grid-cell-cell-00').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', firstId ?? '')
    await expect(page.getByTestId('grid-cell-cell-00')).toHaveAttribute('data-active', '')
    expect(await logOf(page, 'grid-log')).toEqual(['open'])

    // Unmounted target: one scroll, no ID until the cell mounts.
    await input.press('ArrowDown')
    await input.press('ArrowDown')
    expect(await logOf(page, 'grid-log')).toContain('scroll:20')
    await expect(page.getByTestId('grid-cell-cell-20')).toBeVisible()
    const pendingId = await page.getByTestId('grid-cell-cell-20').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', pendingId ?? '')

    // One scalar commit through the root, then dismissal.
    await page.getByTestId('grid-cell-cell-01').click()
    const log = await logOf(page, 'grid-log')
    expect(log.filter(entry => entry.startsWith('change:'))).toEqual(['change:cell-01'])
    expect(log[log.length - 1]).toBe('dismiss')
    expect(await page.getByTestId('grid-popover').count()).toBe(0)
  })

  test('CB-ADAPTER-02: root onChange is the sole commit authority', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')
    await page.getByTestId('log-input').click()
    await page.getByTestId('log-opt-bravo').click()
    expect((await logOf(page, 'log-counts')).filter(entry => entry.startsWith('change:'))).toEqual([
      'change:bravo',
    ])
  })

  test('CB-ADAPTER-02 invalid: nested onChange diagnoses and never double-updates', async ({
    mount,
    page,
  }) => {
    const errors = captureComboboxDiagnostics(page)
    await mount('components/Combobox/Combobox/NestedChangeLog')
    await expect(page.getByTestId('nc-fallback')).toContainText('cannot have an onChange')
    expect(errors.some(text => text.includes('must not carry its own onChange'))).toBe(true)
    expect(await logOf(page, 'nc-log')).toEqual([])
  })

  test('CB-ADAPTER-03: multiple-selection listbox diagnoses and stays scalar', async ({
    mount,
    page,
  }) => {
    const errors = captureComboboxDiagnostics(page)
    await mount('components/Combobox/Combobox/MultipleLog')
    expect(errors.some(text => text.includes('commit contract is scalar'))).toBe(true)

    await page.getByTestId('ml-input').click()
    await expect(page.getByTestId('ml-popover').getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true'
    )
    await page.getByTestId('ml-opt-alpha').click()
    const log = await logOf(page, 'ml-log')
    expect(log.filter(entry => entry.startsWith('change:'))).toEqual(['change:"alpha"'])
    expect(log.join(' ')).not.toContain('[')
  })

  test('CB-ADAPTER-04: VirtualItem slots stable state onto one native child', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SlottedCellLog')
    const input = page.getByTestId('slot-input')
    await expect(page.getByTestId('slot-cell-solo')).toHaveCount(0)

    await input.click()
    const solo = page.getByTestId('slot-cell-solo')
    await expect(solo).toBeVisible()
    const soloId = await solo.getAttribute('id')
    expect(soloId).toContain('solo')
    await expect(solo).toHaveClass(/cell-base/)
    await expect(solo).toHaveClass(/virt-extra/)
    expect(await solo.evaluate(el => getComputedStyle(el).opacity)).toBe('0.5')
    expect(await solo.evaluate(el => getComputedStyle(el).color)).toBe('rgb(1, 2, 3)')
    expect(await logOf(page, 'slot-log')).toContain('ref-solo')

    // Hover previews with the real child id; rerenders keep it stable.
    await solo.hover()
    await expect(input).toHaveAttribute('aria-activedescendant', soloId ?? '')
    await expect(solo).toHaveAttribute('data-active', '')
    await page.getByTestId('slot-cell-duo').hover()
    await solo.hover()
    expect(await solo.getAttribute('id')).toBe(soloId)

    // Child click runs before the root commit.
    await solo.click()
    const log = await logOf(page, 'slot-log')
    expect(log.indexOf('cell-click')).toBeLessThan(log.indexOf('change:solo'))

    // Committed selection publishes selected state on reopen.
    await input.click()
    await expect(solo).toHaveAttribute('aria-selected', 'true')
    await expect(solo).toHaveAttribute('data-selected', '')
  })

  test('CB-ADAPTER-05: invalid grid metadata, targets, and children diagnose before activation', async ({
    mount,
    page,
  }) => {
    test.setTimeout(60000)
    const errors = captureComboboxDiagnostics(page)
    await mount('components/Combobox/Combobox/GridInvalidLog')
    await expect(page.getByTestId('gi-nav-cell')).toBeVisible()

    expect(errors.some(text => text.includes('must have unique values'))).toBe(true)
    expect(errors.some(text => text.includes('index 7') && text.includes('out of range'))).toBe(true)
    expect(errors.some(text => text.includes('Duplicate Combobox.VirtualItem mount'))).toBe(true)
    expect(errors.some(text => text.includes('exactly one native child'))).toBe(true)
    expect(errors.some(text => text.includes('not ref-capable'))).toBe(true)

    // Invalid navigation targets diagnose with no active ID, scroll, or commit.
    // Programmatic focus: stacked open popovers cover the inputs below.
    const navInput = page.getByTestId('gi-nav-input')
    await navInput.focus()
    const before = errors.length
    await navInput.press('ArrowDown')
    await navInput.press('ArrowUp')
    const navErrors = errors.slice(before).filter(text => text.includes('out of range or disabled'))
    expect(navErrors.length).toBeGreaterThanOrEqual(2)
    await expect(navInput).not.toHaveAttribute('aria-activedescendant', /.+/)
  })

  test('CB-ADAPTER-05 recovery: the latest valid adapter recovers cleanly', async ({
    mount,
    page,
  }) => {
    const errors = captureComboboxDiagnostics(page)
    await mount('components/Combobox/Combobox/RecoverLog')
    expect(errors.some(text => text.includes('must have unique values'))).toBe(true)

    await page.getByTestId('rc-input').click()
    await expect(page.getByTestId('rc-cell')).toBeVisible()
    expect(await page.getByTestId('rc-cell').getAttribute('id')).toBeNull()

    await clickNoFocus(page, 'rc-toggle')
    await page.getByTestId('rc-input').press('ArrowDown')
    const cellId = await page.getByTestId('rc-cell').getAttribute('id')
    expect(cellId).toContain('ok')
    await expect(page.getByTestId('rc-input')).toHaveAttribute('aria-activedescendant', cellId ?? '')
  })

  test('CB-ADAPTER-06: consumer handlers cancel cell preview and commit independently', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/PreventCellLog')
    const input = page.getByTestId('pc-input')
    await input.click()

    // Unprevented movement previews with the real child id.
    await page.getByTestId('pc-cell-move').hover()
    const moveId = await page.getByTestId('pc-cell-move').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', moveId ?? '')
    expect(await logOf(page, 'pc-log')).toContain('move-handler')

    // Prevented movement leaves the previous active state untouched.
    await clickNoFocus(page, 'pc-arm-move')
    await page.getByTestId('pc-cell-click').hover()
    const clickId = await page.getByTestId('pc-cell-click').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', clickId ?? '')
    await page.getByTestId('pc-cell-move').hover()
    await expect(input).toHaveAttribute('aria-activedescendant', clickId ?? '')
    await expect(page.getByTestId('pc-cell-move')).not.toHaveAttribute('data-active', '')

    // Prevented activation commits nothing and stays open.
    await clickNoFocus(page, 'pc-arm-click')
    await page.getByTestId('pc-cell-click').click()
    const log = await logOf(page, 'pc-log')
    expect(log).toContain('click-handler')
    expect(log.some(entry => entry.startsWith('change:'))).toBe(false)
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    // Unprevented activation commits exactly once.
    await clickNoFocus(page, 'pc-arm-click')
    await page.getByTestId('pc-cell-click').click()
    expect((await logOf(page, 'pc-log')).filter(entry => entry.startsWith('change:'))).toEqual([
      'change:click',
    ])
  })

  test('CB-ADAPTER-07: grid typeahead follows current metadata and cancels stale requests', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/StaleGridLog')
    const input = page.getByTestId('sg-input')
    await input.focus()
    await input.pressSequentially('z')
    expect(await logOf(page, 'sg-log')).toContain('scroll:37')
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)

    // Replace metadata, then mount the stale window: index 37 now holds
    // another value and must not publish.
    await clickNoFocus(page, 'sg-replace')
    await clickNoFocus(page, 'sg-grow')
    await expect(page.getByTestId('sg-cell-i-36-37')).toBeVisible()
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)

    // The same value under current metadata scrolls once (still
    // unmounted) and publishes only after its own window mounts.
    // Select-all + type avoids an empty-text intermediate scroll.
    await input.press('ControlOrMeta+a')
    await input.pressSequentially('b')
    expect((await logOf(page, 'sg-log')).filter(entry => entry.startsWith('scroll:'))).toEqual([
      'scroll:37',
      'scroll:12',
    ])
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await clickNoFocus(page, 'sg-grow2')
    const zuluId = await page.getByTestId('sg-cell-zulu-12').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', zuluId ?? '')
  })

  test('CB-ADAPTER-08: competing authorities diagnose, stay inert, and recover', async ({
    mount,
    page,
  }) => {
    const errors = captureComboboxDiagnostics(page)
    await mount('components/Combobox/Combobox/ConflictLog')
    expect(errors.some(text => text.includes('exactly one collection authority'))).toBe(true)
    expect(errors.some(text => text.includes('virtualFocus') && text.includes('listbox'))).toBe(true)

    const input = page.getByTestId('cf-input')
    await input.click()
    await expect(page.getByTestId('cf-popover')).toHaveAttribute('role', 'presentation')

    await input.press('ArrowDown')
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await page.getByTestId('cf-opt-alpha').hover()
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await page.getByTestId('cf-opt-alpha').click()
    expect(await logOf(page, 'cf-log')).toEqual(['open'])

    // Single-authority rerender recovers navigation and commit.
    await clickNoFocus(page, 'cf-toggle')
    await input.press('ArrowDown')
    const cellId = await page.getByTestId('cf-cell-cell-00').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', cellId ?? '')
    await page.getByTestId('cf-cell-cell-00').click()
    expect(await logOf(page, 'cf-log')).toContain('change:cell-00')
  })

  test('CB-SELECT-08 virtual: trigger home/end/page wait behind one current scroll', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/GridSelectOnly')
    const trigger = page.getByTestId('gs-trigger')
    await trigger.click()

    await trigger.press('Home')
    const firstId = await page.getByTestId('gs-cell-cell-00').getAttribute('id')
    await expect(trigger).toHaveAttribute('aria-activedescendant', firstId ?? '')

    await trigger.press('PageDown')
    expect(await logOf(page, 'gs-log')).toContain('scroll:20')
    await expect(page.getByTestId('gs-cell-cell-20')).toBeVisible()
    const pageId = await page.getByTestId('gs-cell-cell-20').getAttribute('id')
    await expect(trigger).toHaveAttribute('aria-activedescendant', pageId ?? '')

    await trigger.press('End')
    expect(await logOf(page, 'gs-log')).toContain('scroll:99')
    await expect(page.getByTestId('gs-cell-cell-99')).toBeVisible()
    const lastId = await page.getByTestId('gs-cell-cell-99').getAttribute('id')
    await expect(trigger).toHaveAttribute('aria-activedescendant', lastId ?? '')
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(
      'gs-trigger'
    )
  })

  test('Tree popup survey: haspopup maps to tree; no navigation bridge exists yet (#6)', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TreePopupLog')
    const input = page.getByTestId('tp-input')
    await input.click()
    await expect(page.getByTestId('tp-tree')).toBeVisible()
    await input.press('ArrowDown')
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    expect(await logOf(page, 'tp-log')).toEqual(['open'])
  })

  test('CB-COMP-02: filtered both-mode consumer across edit, commit, escape, blur, tab, reject', async ({
    mount,
    page,
  }) => {
    test.setTimeout(60000)
    await mount('components/Combobox/Combobox/FilterBothLog')
    const input = page.getByTestId('fb-input')

    // Edit filters; completion tracks; Enter commits one ordered sequence.
    // Delay lets each keystroke commit, so suffix replacement is deterministic.
    await input.focus()
    await input.pressSequentially('alp', { delay: 100 })
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 3, end: 5 })
    await input.press('Enter')
    // Controlled input: the app applies the label from onChange, so no
    // input: request follows the commit (COMMIT-01 order is uncontrolled).
    // Suffix replacement preserves the completed capital (Al, Alp).
    expect(await logOf(page, 'fb-log')).toEqual([
      'input:a',
      'open',
      'input:Al',
      'input:Alp',
      'change:alpha',
      'dismiss',
    ])
    expect((await inputState(input)).value).toBe('Alpha')

    // Unmatched text reverts on Escape.
    await input.click()
    await input.fill('Zulu')
    await clickNoFocus(page, 'fb-clear')
    await input.press('Escape')
    expect(await logOf(page, 'fb-log')).toEqual(['input:Alpha', 'dismiss'])
    expect((await inputState(input)).value).toBe('Alpha')

    // Blur outside reverts-or-keeps then dismisses once.
    await input.click()
    await page.getByTestId('fb-outside').click()
    expect(await logOf(page, 'fb-log')).toEqual(['input:Alpha', 'dismiss', 'open', 'dismiss'])

    // Tab with no keyboard intent closes natively onto the next control.
    await input.click()
    await clickNoFocus(page, 'fb-clear')
    await input.press('Tab')
    expect(await logOf(page, 'fb-log')).toEqual(['dismiss'])
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(
      'fb-after'
    )

    // Rejected requests cannot create accepted state.
    await clickNoFocus(page, 'fb-accept')
    await page.getByTestId('fb-before').focus()
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(await logOf(page, 'fb-log')).toContain('open')
  })
})

test.describe('Combobox playtest CT', () => {
  test('B-20: escape restores committed text over stale input', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectedLog')
    const input = page.getByTestId('log-input')
    await input.click()
    await expect(page.getByTestId('log-opt-bravo')).toBeVisible()
    await page.keyboard.type('zzz')
    await expect(input).toHaveValue('Bravozzz')

    await page.keyboard.press('Escape')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('Bravo')
  })

  test('B-20: blur restores committed text over stale input', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectedLog')
    const input = page.getByTestId('log-input')
    await input.click()
    await expect(page.getByTestId('log-opt-bravo')).toBeVisible()
    await page.keyboard.type('zzz')
    await expect(input).toHaveValue('Bravozzz')

    await page.getByTestId('log-clear').focus()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('Bravo')
  })

  test('B-21: tabbing into the input never opens the popup', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TabOrder')
    const input = page.getByTestId('tab-input')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await page.getByTestId('tab-before').focus()
    await page.keyboard.press('Tab')
    await expect(input).toBeFocused()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('tab-popover')).toHaveCount(0)
  })

  test('B-22: combobox in a dialog closes on blur and never breaks the trap', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/DialogCombo')
    await page.getByTestId('dlgcombo-open').click()
    const dialog = page.getByTestId('dlgcombo-dialog')
    await expect(dialog).toBeVisible()

    // Popup closes on Tab out of the room input, like outside dialogs.
    const room = page.getByTestId('dlgcombo-room-input')
    await room.click()
    await expect(page.getByTestId('dlgcombo-room-borealis')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(room).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('dlgcombo-seats-input')).toBeFocused()

    // Tab on to Cancel, then Tab from Cancel wraps inside the dialog —
    // never into a list option. (Clicking Cancel would activate it and
    // close the dialog; the trap repro Tabs through.)
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('dlgcombo-cancel')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('dlgcombo-title-input')).toBeFocused()
    const activeRole = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('role')
    )
    expect(activeRole).not.toBe('option')
  })

  test('B-36: recommitting the identical value emits no onChange', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectedLog')
    const input = page.getByTestId('log-input')

    // Pointer path: clicking the already-selected option closes silently.
    // (No log-clear clicks: pressing the outside button would itself
    // dismiss the popup. The committed value never changes, so the whole
    // log must stay free of change: entries.)
    await input.click()
    await expect(page.getByTestId('log-opt-bravo')).toBeVisible()
    await page.getByTestId('log-opt-bravo').click()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    let log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual([])
    expect(log).toContain('dismiss')

    // Keyboard path: arrows back onto the committed value + Enter.
    await input.click()
    await expect(page.getByTestId('log-opt-bravo')).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Enter')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual([])
  })

  test('CB-CUSTOM-01: Enter commits exact unmatched text when custom values are allowed', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/CustomLog')
    const input = page.getByTestId('log-input')
    await input.click()
    await expect(page.getByTestId('log-opt-bravo')).toBeVisible()
    await input.fill('Zen Den')
    await expect(page.getByTestId('log-opt-alpha')).toHaveCount(0)
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)

    await page.keyboard.press('Enter')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('Zen Den')
    expect(await readLog(page, 'log-counts')).toEqual([
      'open',
      'input:Zen Den',
      'change:Zen Den',
      'dismiss',
    ])
  })

  test('CB-CUSTOM-01 false / CB-COMMIT-02: Enter with no active reverts and dismisses without a value', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/NoCustomLog')
    const input = page.getByTestId('log-input')
    await input.click()
    await input.fill('Zen Den')
    await expect(page.getByTestId('log-opt-alpha')).toHaveCount(0)

    await page.keyboard.press('Enter')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('Bravo')
    const log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual([])
    expect(log).toEqual(['open', 'input:Zen Den', 'input:Bravo', 'dismiss'])
  })

  test('CB-CUSTOM-02: blur commits custom text', async ({ mount, page }) => {
    await mount('components/Combobox/Combobox/CustomLog')
    const input = page.getByTestId('log-input')
    await input.click()
    await input.fill('New value')
    await page.getByTestId('log-clear').focus()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('New value')
    expect(await readLog(page, 'log-counts')).toEqual([
      'open',
      'input:New value',
      'change:New value',
      'dismiss',
    ])
  })

  test('CB-CUSTOM-02 empty: blur maps empty custom text to null', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/CustomLog')
    const input = page.getByTestId('log-input')
    await input.click()
    await input.fill('')
    await page.getByTestId('log-clear').focus()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('')
    expect(await readLog(page, 'log-counts')).toEqual([
      'open',
      'input:',
      'change:null',
      'dismiss',
    ])
  })

  test('W-24: unmatched pointer blur inside a dialog reverts, closes, and keeps the trap', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/DialogCombo')
    await page.getByTestId('dlgcombo-open').click()
    const dialog = page.getByTestId('dlgcombo-dialog')
    await expect(dialog).toBeVisible()

    // Pointer blur onto another dialog field: unmatched text reverts and
    // the popup closes, while the dialog stays open.
    const room = page.getByTestId('dlgcombo-room-input')
    await room.click()
    await expect(page.getByTestId('dlgcombo-room-borealis')).toBeVisible()
    await page.keyboard.type('zzz')
    await expect(room).toHaveValue('zzz')
    await page.getByTestId('dlgcombo-title-input').click()
    await expect(room).toHaveAttribute('aria-expanded', 'false')
    await expect(room).toHaveValue('')
    await expect(page.getByTestId('dlgcombo-title-input')).toBeFocused()
    await expect(dialog).toBeVisible()
    expect(await readLog(page, 'dlgcombo-log')).toEqual([
      'open',
      'input:z',
      'input:zz',
      'input:zzz',
      'input:',
      'dismiss',
    ])

    // Backward trap wrap still lands inside the dialog, never in the list.
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByTestId('dlgcombo-cancel')).toBeFocused()
    const activeRole = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('role')
    )
    expect(activeRole).not.toBe('option')
  })

  test('W-24: closeOnBlur=false inside a dialog preserves open text and the trap', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/DialogComboPersist')
    await page.getByTestId('dlgcombo-open').click()
    await expect(page.getByTestId('dlgcombo-dialog')).toBeVisible()

    const room = page.getByTestId('dlgcombo-room-input')
    await room.click()
    await page.keyboard.type('zzz')
    await page.getByTestId('dlgcombo-seats-input').focus()
    await expect(page.getByTestId('dlgcombo-seats-input')).toBeFocused()
    await expect(room).toHaveAttribute('aria-expanded', 'true')
    await expect(room).toHaveValue('zzz')
    expect(await readLog(page, 'dlgcombo-log')).toEqual([
      'open',
      'input:z',
      'input:zz',
      'input:zzz',
    ])

    // Tab traversal with the popup open wraps inside the dialog.
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('dlgcombo-cancel')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('dlgcombo-title-input')).toBeFocused()
    await expect(room).toHaveAttribute('aria-expanded', 'true')
    const activeRole = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('role')
    )
    expect(activeRole).not.toBe('option')
  })
})

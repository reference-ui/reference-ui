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
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(await readLog(page, 'select-log')).toEqual(['open', 'change:bravo', 'dismiss'])
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

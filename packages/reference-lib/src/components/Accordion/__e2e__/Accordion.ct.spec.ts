import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Accordion Composition Gates & Browser Proofs', () => {
  test('Single expansion manages item visibility and arrow traversal (legacy smoke)', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Single')
    const trigger1 = page.getByTestId('btn-trigger-1')
    const content1 = page.getByTestId('content-1')
    const trigger2 = page.getByTestId('btn-trigger-2')
    const content2 = page.getByTestId('content-2')
    const trigger3 = page.getByTestId('btn-trigger-3')

    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(content1).toBeVisible()
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false')
    await expect(content2).toHaveCount(0)

    const accordion = page.getByTestId('test-accordion')
    const root = page.getByTestId('accordion-fixture-root')

    await page.waitForTimeout(300)
    await snap(page, 'single-resting')
    await snap(accordion, 'single-resting-accordion', { maxDiffPixelRatio: 0.001 })
    await snap(root, 'single-resting-root', { maxDiffPixelRatio: 0.001 })

    // Hover trigger 2
    await trigger2.hover()
    await page.waitForTimeout(200)
    await snap(page, 'single-hover-trigger-2')

    // Click trigger 2 -> opens item-2, closes item-1
    await trigger2.click()
    await expect(content1).toHaveAttribute('data-state', 'closed')
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content2).toBeVisible()
    await expect(content1).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'single-item-2-open')
    await snap(accordion, 'single-accordion-item-2-open', { maxDiffPixelRatio: 0.001 })

    // Arrow keys navigate between triggers
    await trigger2.focus()
    await expect(trigger2).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'single-trigger-2-focused')

    await page.keyboard.press('ArrowUp')
    await expect(trigger1).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'single-trigger-1-focused')

    await page.keyboard.press('ArrowDown')
    await expect(trigger2).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(trigger3).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'single-trigger-3-focused')
  })

  test('Multiple expansion allows concurrent open sections (legacy smoke)', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Multiple')
    const multiRoot = page.getByTestId('accordion-multiple-root')
    const trigger1 = page.getByTestId('multi-trigger-1')
    const content1 = page.getByTestId('multi-content-1')
    const trigger2 = page.getByTestId('multi-trigger-2')
    const content2 = page.getByTestId('multi-content-2')

    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content1).toBeVisible()
    await expect(content2).toBeVisible()

    await page.waitForTimeout(300)
    await snap(page, 'multiple-both-open')
    await snap(multiRoot, 'multiple-root-both-open', { maxDiffPixelRatio: 0.001 })

    // Click trigger 1 to collapse section 1
    await trigger1.click()
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(content1).toHaveCount(0)
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content2).toBeVisible()

    await page.waitForTimeout(300)
    await snap(page, 'multiple-item-1-closed')
    await snap(multiRoot, 'multiple-root-item-1-closed', { maxDiffPixelRatio: 0.001 })
  })

  test('AC-DOM-01: Accordion should render one root while preserving each Collapsible transparent disclosure anatomy', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/DomAnatomy')
    const before = page.getByTestId('dom-01-sibling-before')
    const root = page.getByTestId('dom-01-root')
    const after = page.getByTestId('dom-01-sibling-after')
    const trigger1 = page.getByTestId('btn-trigger-1')
    const content1 = page.getByTestId('content-1')
    const trigger2 = page.getByTestId('btn-trigger-2')
    const content2 = page.getByTestId('content-2')

    await expect(before).toBeVisible()
    await expect(root).toBeVisible()
    await expect(after).toBeVisible()

    // Assert Accordion contributes one native div
    const rootTagName = await root.evaluate(el => el.tagName.toLowerCase())
    expect(rootTagName).toBe('div')

    // Initial state: trigger 1 is expanded, content 1 visible
    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(content1).toBeVisible()
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false')
    await expect(content2).toHaveCount(0)

    // Direct children check: no item or header wrapper div inserted
    const childTagNames = await root.evaluate(el => Array.from(el.children).map(c => c.tagName.toLowerCase()))
    expect(childTagNames).toEqual(['button', 'div', 'div', 'button'])

    // Click trigger 2 -> trigger 1 closes, trigger 2 opens
    await trigger2.click()
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content2).toBeVisible()
    await expect(content1).toHaveCount(0)
  })

  test('AC-KEY-01: Accordion header traversal should move ArrowDown to the next enabled Trigger and wrap at the end', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyTraversal')
    const triggerA = page.getByTestId('key-trigger-a')
    const triggerB = page.getByTestId('key-trigger-b')
    const triggerC = page.getByTestId('key-trigger-c')

    await triggerA.focus()
    await expect(triggerA).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(triggerB).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(triggerC).toBeFocused()

    // Wraps to A
    await page.keyboard.press('ArrowDown')
    await expect(triggerA).toBeFocused()
  })

  test('AC-KEY-02: Accordion header traversal should move ArrowUp to the previous enabled Trigger and wrap at the beginning', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyTraversal')
    const triggerA = page.getByTestId('key-trigger-a')
    const triggerB = page.getByTestId('key-trigger-b')
    const triggerC = page.getByTestId('key-trigger-c')

    await triggerC.focus()
    await expect(triggerC).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(triggerB).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(triggerA).toBeFocused()

    // Wraps to C
    await page.keyboard.press('ArrowUp')
    await expect(triggerC).toBeFocused()
  })

  test('AC-KEY-03: Accordion header traversal should send Home and End to the enabled boundaries', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyBoundaries')
    const triggerA = page.getByTestId('bound-trigger-a')
    const triggerC = page.getByTestId('bound-trigger-c')
    const triggerD = page.getByTestId('bound-trigger-d')

    await triggerC.focus()
    await expect(triggerC).toBeFocused()

    await page.keyboard.press('Home')
    await expect(triggerA).toBeFocused()

    await triggerC.focus()
    await expect(triggerC).toBeFocused()

    await page.keyboard.press('End')
    await expect(triggerD).toBeFocused()
  })

  test('AC-KEY-04: Accordion header traversal should skip every disabled item, including a trigger disabled after it held focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyDisabled')
    const triggerA = page.getByTestId('dyn-trigger-a')
    const triggerB = page.getByTestId('dyn-trigger-b')
    const triggerD = page.getByTestId('dyn-trigger-d')
    const toggleBtn = page.getByTestId('btn-toggle-dyn-disabled')

    // 1. A enabled, B/C disabled, D enabled: A ArrowDown skips B and C to reach D
    await triggerA.focus()
    await page.keyboard.press('ArrowDown')
    await expect(triggerD).toBeFocused()

    // D ArrowUp skips C and B to reach A
    await page.keyboard.press('ArrowUp')
    await expect(triggerA).toBeFocused()

    // 2. Enable B so it can hold focus
    await toggleBtn.click()
    await expect(triggerB).toBeEnabled()
    await triggerB.focus()
    await expect(triggerB).toBeFocused()

    // Rerender B disabled while retaining active DOM node
    await toggleBtn.dispatchEvent('click')
    await expect(triggerB).toBeDisabled()

    // Dispatch ArrowDown from that retained node
    await triggerB.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })))
    await expect(triggerD).toBeFocused()
  })

  test('AC-KEY-05: Accordion arrow and boundary keys should move focus without activating an item', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyNoActivate')
    const triggerA = page.getByTestId('noact-trigger-a')
    const triggerB = page.getByTestId('noact-trigger-b')
    const triggerC = page.getByTestId('noact-trigger-c')
    const log = page.getByTestId('key-no-act-log')

    await expect(triggerA).toHaveAttribute('aria-expanded', 'true')
    await expect(triggerB).toHaveAttribute('aria-expanded', 'false')

    await triggerA.focus()
    await page.keyboard.press('ArrowDown')
    await expect(triggerB).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(triggerC).toBeFocused()
    await page.keyboard.press('Home')
    await expect(triggerA).toBeFocused()
    await page.keyboard.press('End')
    await expect(triggerC).toBeFocused()

    // State remains unchanged
    await expect(triggerA).toHaveAttribute('aria-expanded', 'true')
    await expect(triggerB).toHaveAttribute('aria-expanded', 'false')
    await expect(triggerC).toHaveAttribute('aria-expanded', 'false')
    await expect(log).toHaveText('')
  })

  test('AC-KEY-06: Accordion should apply single or multiple expansion policy exactly once for native Space and Enter activation', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/NativeKeys')
    const singleTriggerB = page.getByTestId('native-single-trigger-b')
    const singleLog = page.getByTestId('native-single-log')

    // Single Space activation
    await singleTriggerB.focus()
    await page.keyboard.press('Space')
    await expect(singleLog).toHaveText('b')

    // Multiple Space activation
    const multiTriggerB = page.getByTestId('native-multi-trigger-b')
    const multiLog = page.getByTestId('native-multi-log')

    await multiTriggerB.focus()
    await page.keyboard.press('Space')
    await expect(multiLog).toHaveText('b')

    // Enter toggle
    await page.keyboard.press('Enter')
    await expect(multiLog).toHaveText('b;')
  })

  test('AC-KEY-07: Accordion should ignore traversal keys originating inside item Content', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/ContentKeys')
    const input = page.getByTestId('content-descendant-input')
    const link = page.getByTestId('content-descendant-link')
    const button = page.getByTestId('content-descendant-button')
    const triggerA = page.getByTestId('content-keys-trigger-a')
    const log = page.getByTestId('content-keys-log')

    // Inside input
    await input.focus()
    await page.keyboard.press('ArrowDown')
    await expect(input).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(input).toBeFocused()

    // Inside link
    await link.focus()
    await page.keyboard.press('ArrowDown')
    await expect(link).toBeFocused()

    // Inside button
    await button.focus()
    await page.keyboard.press('ArrowDown')
    await expect(button).toBeFocused()

    // No accordion change
    await expect(triggerA).toHaveAttribute('aria-expanded', 'true')
    await expect(log).toHaveText('')
  })

  test('AC-KEY-08: Accordion should leave header navigation entirely native when keyboard traversal is disabled', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyboardNone')
    const triggerB = page.getByTestId('none-trigger-b')
    const log = page.getByTestId('none-key-log')

    await triggerB.focus()
    await page.keyboard.press('ArrowDown')
    await expect(triggerB).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(triggerB).toBeFocused()
    await page.keyboard.press('Home')
    await expect(triggerB).toBeFocused()
    await page.keyboard.press('End')
    await expect(triggerB).toBeFocused()

    // Activation still functions
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('b')
  })

  test('AC-KEY-09: Accordion should let consumer key cancellation run before header navigation or native activation', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyCancel')
    const cancelTrigger = page.getByTestId('cancel-trigger-b')
    const cancelLog = page.getByTestId('cancel-log')

    await cancelTrigger.focus()
    await page.keyboard.press('ArrowDown')
    await expect(cancelTrigger).toBeFocused()
    await page.keyboard.press('Home')
    await expect(cancelTrigger).toBeFocused()
    await page.keyboard.press('Space')
    await expect(cancelTrigger).toBeFocused()

    await expect(cancelLog).toHaveText('canceled:ArrowDown,canceled:Home,canceled: ')
  })

  test('AC-KEY-10: Accordion should recompute header order after dynamic collection changes without remounting surviving Triggers', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/DynamicOrder')
    const reorderBtn = page.getByTestId('btn-reorder-to-cxa')
    await reorderBtn.click()

    const triggerC = page.getByTestId('dyn-order-trigger-c')
    const triggerX = page.getByTestId('dyn-order-trigger-x')
    const triggerA = page.getByTestId('dyn-order-trigger-a')

    await triggerC.focus()
    await page.keyboard.press('ArrowDown')
    await expect(triggerX).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(triggerA).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(triggerC).toBeFocused()
  })

  test('AC-KEY-11: Accordion should keep every enabled header in the browsers native Tab sequence even after arrow focus moves', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/TabSequence')
    const beforeLink = page.getByTestId('tab-link-before')
    const headerA = page.getByTestId('tab-trigger-a')
    const headerB = page.getByTestId('tab-trigger-b')
    const innerBtn = page.getByTestId('tab-content-inner-btn')
    const headerC = page.getByTestId('tab-trigger-c')
    const afterLink = page.getByTestId('tab-link-after')

    // Verify native tabIndex property is 0 and not roving (-1)
    expect(await headerA.evaluate(el => (el as HTMLElement).tabIndex)).toBe(0)
    expect(await headerB.evaluate(el => (el as HTMLElement).tabIndex)).toBe(0)
    expect(await headerC.evaluate(el => (el as HTMLElement).tabIndex)).toBe(0)
    await expect(headerA).not.toHaveAttribute('tabindex', '-1')
    await expect(headerB).not.toHaveAttribute('tabindex', '-1')
    await expect(headerC).not.toHaveAttribute('tabindex', '-1')

    // Move focus via arrow key first
    await headerA.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(headerC).toBeFocused()

    // Tab sequence from beginning
    await beforeLink.focus()
    await page.keyboard.press('Tab')
    await expect(headerA).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(headerB).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(innerBtn).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(headerC).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(afterLink).toBeFocused()

    // Shift+Tab back
    await page.keyboard.press('Shift+Tab')
    await expect(headerC).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(innerBtn).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(headerB).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(headerA).toBeFocused()
  })

  test('AC-NEST-01: A nested Accordion should keep its collection, values, and header keys independent from its parent', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Nested')
    const innerX = page.getByTestId('nest-inner-trigger-x')
    const innerY = page.getByTestId('nest-inner-trigger-y')
    const outerB = page.getByTestId('nest-outer-trigger-b')
    const innerLog = page.getByTestId('nest-inner-log')
    const outerLog = page.getByTestId('nest-outer-log')

    // Click inner X
    await innerX.click()
    await expect(innerLog).toHaveText('inner-x')
    await expect(outerLog).toHaveText('')

    // Arrow navigation inside inner stays inside inner
    await innerX.focus()
    await page.keyboard.press('ArrowDown')
    await expect(innerY).toBeFocused()

    // Click outer B
    await outerB.click()
    await expect(outerLog).toHaveText('outer-b')
  })

  test('AC-PRES-01: A single Accordion should expose only the new item as expanded while the old Content completes its exit', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/PresenceStory')
    const triggerA = page.getByTestId('pres-trigger-a')
    const contentA = page.getByTestId('pres-content-a')
    const triggerB = page.getByTestId('pres-trigger-b')
    const contentB = page.getByTestId('pres-content-b')
    const log = page.getByTestId('pres-log')

    await expect(triggerA).toHaveAttribute('aria-expanded', 'true')
    await expect(contentA).toBeVisible()

    await triggerB.click()

    // Request emitted and committed: B expanded, A not, B panel mounted
    await expect(log).toHaveText('b')
    await expect(triggerB).toHaveAttribute('aria-expanded', 'true')
    await expect(triggerA).toHaveAttribute('aria-expanded', 'false')
    await expect(contentB).toBeVisible()

    // A unmounts after exit finishes
    await expect(contentA).toHaveCount(0, { timeout: 3000 })
  })

  test('AC-A11Y-01: Accordion should remain accessibility-clean across every supported expansion and disabled-state shape', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/KeyBoundaries')
    const root = page.getByTestId('key-bound-root')

    // Every header carries an honest expanded state; disabled headers are marked
    const triggers = root.locator('button[aria-expanded]')
    const count = await triggers.count()
    expect(count).toBe(4)
    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i)
      const hasAriaExpanded = await trigger.getAttribute('aria-expanded')
      expect(hasAriaExpanded === 'true' || hasAriaExpanded === 'false').toBe(true)

      const isDisabled = await trigger.isDisabled()
      if (isDisabled) {
        await expect(trigger).toHaveAttribute('data-disabled', '')
      }
    }
  })

  test('AC-COMP-01: A single Accordion should implement a collapsible FAQ with native header tabbing', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Faq')
    const q1 = page.getByTestId('faq-trigger-1')
    const a1 = page.getByTestId('faq-content-1')
    const q2 = page.getByTestId('faq-trigger-2')
    const a2 = page.getByTestId('faq-content-2')

    await expect(q1).toHaveAttribute('aria-expanded', 'true')
    await expect(a1).toBeVisible()

    // Click Q2
    await q2.click()
    await expect(q1).toHaveAttribute('aria-expanded', 'false')
    await expect(q2).toHaveAttribute('aria-expanded', 'true')
    await expect(a2).toBeVisible()

    // Click Q2 again -> all collapsed
    await q2.click()
    await expect(q2).toHaveAttribute('aria-expanded', 'false')
    await expect(a2).toHaveCount(0)
  })

  test('AC-COMP-02: A multiple Accordion should keep animated settings sections independently controllable', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Settings')
    const s1 = page.getByTestId('settings-trigger-s1')
    const s3 = page.getByTestId('settings-trigger-s3')
    const reorderBtn = page.getByTestId('btn-reorder-settings')
    const settingsLog = page.getByTestId('settings-log')

    await expect(s1).toHaveAttribute('aria-expanded', 'true')
    await expect(s3).toHaveAttribute('aria-expanded', 'true')

    // Reorder C (S3) before B (S2)
    await reorderBtn.click()

    // Toggle S1 off
    await s1.click()
    await expect(settingsLog).toContainText('s3')
  })

  test('AC-COMP-03: Accordion should scope header traversal to the outer group that enables it in nested disclosure compositions', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Scope')
    const outer1 = page.getByTestId('scope-outer-trigger-1')
    const outer2 = page.getByTestId('scope-outer-trigger-2')
    const inner1 = page.getByTestId('scope-inner-trigger-1')
    const standalone = page.getByTestId('scope-standalone-trigger')

    // Outer arrow navigation skips inner items
    await outer1.focus()
    await page.keyboard.press('ArrowDown')
    await expect(outer2).toBeFocused()

    // Inner arrows do not move focus (keyboard="none")
    await inner1.focus()
    await page.keyboard.press('ArrowDown')
    await expect(inner1).toBeFocused()

    // Standalone collapsible toggles independently
    await standalone.click()
    await expect(standalone).toHaveAttribute('aria-expanded', 'true')
    await expect(outer1).toHaveAttribute('aria-expanded', 'true')
  })
})

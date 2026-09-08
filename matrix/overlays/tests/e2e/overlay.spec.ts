import { expect, test, type Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {

  test.describe('1. DOM & Anatomy Contracts', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-DOM-01 & OV-DOM-05: Renders no portal content initially, renders Backdrop and Content upon open', async ({
      page,
    }) => {
      const backdrop = page.getByTestId('dialog-backdrop')
      const content = page.getByTestId('dialog-content')

      await expect(backdrop).toHaveCount(0)
      await expect(content).toHaveCount(0)

      await page.getByTestId('btn-open-basic-dialog').click()

      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()
      await expect(content.getByTestId('dialog-title')).toHaveText('Dialog Title')

      // Sibling elements in document.body
      const areSiblings = await page.evaluate(() => {
        const b = document.querySelector('[data-testid="dialog-backdrop"]')
        const c = document.querySelector('[data-testid="dialog-content"]')
        return b?.parentElement === document.body && c?.parentElement === document.body
      })
      expect(areSiblings).toBe(true)

      await page.getByTestId('btn-dialog-close').click()
      await expect(content).toHaveCount(0)
      await expect(backdrop).toHaveCount(0)
    })

    test('OV-DOM-02: Unbound Content writes no inline position coordinates or centering', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-unbound').click()
      const content = page.getByTestId('dialog-unbound-content')
      await expect(content).toBeVisible()

      const inlineStyles = await content.evaluate(el => ({
        position: (el as HTMLElement).style.position,
        top: (el as HTMLElement).style.top,
        left: (el as HTMLElement).style.left,
        transform: (el as HTMLElement).style.transform,
      }))

      expect(inlineStyles.position).toBe('')
      expect(inlineStyles.top).toBe('')
      expect(inlineStyles.left).toBe('')
      expect(inlineStyles.transform).toBe('')
    })

    test('OV-DOM-06: Pure controlled open prop changes without dismiss callbacks', async ({
      page,
    }) => {
      const content = page.getByTestId('dialog-controlled-content')
      await expect(content).toHaveCount(0)

      await page.getByTestId('btn-set-controlled-open').click()
      await expect(content).toBeVisible()
      await expect(page.getByTestId('controlled-escape-log')).toHaveText('')

      await page.getByTestId('btn-set-controlled-closed').click()
      await expect(content).toHaveCount(0)
      await expect(page.getByTestId('controlled-escape-log')).toHaveText('')
    })

    test('OV-DOM-07: Overlay remains fully active when dismissal is rejected by parent', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-reject').click()
      const content = page.getByTestId('dialog-reject-content')
      const backdrop = page.getByTestId('dialog-reject-backdrop')
      await expect(content).toBeVisible()

      // Press Escape
      await page.getByTestId('btn-reject-inner').focus()
      await page.keyboard.press('Escape')
      await expect(page.getByTestId('reject-log')).toContainText('escape-called')

      // Overlay must STILL be open and visible!
      await expect(content).toBeVisible()
      await expect(backdrop).toBeVisible()

      // Click outside on backdrop
      await backdrop.click({ position: { x: 10, y: 10 } })
      await expect(page.getByTestId('reject-log')).toContainText('outside-called')
      await expect(content).toBeVisible()

      // Force close via application state
      await page.getByTestId('btn-reject-force-close').click()
      await expect(content).toHaveCount(0)
    })

    test('OV-FOCUS-04: Focus is trapped inside overlay content while open', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-basic-dialog').click()
      const firstAction = page.getByTestId('btn-dialog-first')
      const closeBtn = page.getByTestId('btn-dialog-close')

      await expect(firstAction).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(closeBtn).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(firstAction).toBeFocused()

      await page.getByTestId('btn-dialog-close').click()
    })

    test('OV-POS-01: Application centering styles are preserved on isolating dialog', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-basic-dialog').click()
      const content = page.getByTestId('dialog-content')
      await expect(content).toBeVisible()

      const inline = await content.evaluate(el => ({
        position: (el as HTMLElement).style.position,
        top: (el as HTMLElement).style.top,
        left: (el as HTMLElement).style.left,
      }))

      expect(inline.position).toBe('fixed')
      expect(inline.top).toBe('50%')
      expect(inline.left).toBe('50%')
      await page.getByTestId('btn-dialog-close').click()
    })

    test('OV-ISO-02: isolation={false} does not inert the background', async ({
      page,
    }) => {
      const counter = page.getByTestId('btn-outside-counter')
      await page.getByTestId('btn-set-controlled-open').click()
      const content = page.getByTestId('dialog-controlled-content')
      await expect(content).toBeVisible()

      const inert = await counter.evaluate(el => Boolean(el.closest('[inert]')))
      expect(inert).toBe(false)
      await counter.click()
      await expect(counter).toHaveText('Outside Counter (1)')

      await page.getByTestId('btn-set-controlled-closed').click()
      await expect(content).toHaveCount(0)
    })

    test('OV-DOM-08 & OV-DOM-09: Duplicate parts fail atomically and emit diagnostic warnings', async ({
      page,
    }) => {
      const consoleErrors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })

      // Duplicate backdrop
      await page.getByTestId('btn-open-dup-backdrop').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Duplicate Overlay.Backdrop'))).toBe(true)
      await expect(page.getByTestId('dup-backdrop-1')).toHaveCount(0)

      // Duplicate content
      await page.getByTestId('btn-open-dup-content').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Duplicate Overlay.Content'))).toBe(true)
      await expect(page.getByTestId('dup-content-1')).toHaveCount(0)

      // Duplicate trigger
      await page.getByTestId('btn-open-dup-trigger').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Duplicate Overlay.Trigger'))).toBe(true)

      // Duplicate handle
      await page.getByTestId('btn-open-dup-handle').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Duplicate Overlay.Handle'))).toBe(true)
      await expect(page.getByTestId('dup-handle-1')).toHaveCount(0)

      // Handle without edge
      await page.getByTestId('btn-open-no-edge-handle').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Overlay.Handle requires `edge`'))).toBe(true)

      // Missing content
      await page.getByTestId('btn-open-missing-content').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Missing Overlay.Content'))).toBe(true)
      await expect(page.getByTestId('missing-content-backdrop')).toHaveCount(0)

      // Mixed geometry (edge + anchor)
      await page.getByTestId('btn-open-mixed-geometry').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('`edge` and `anchor` are mutually exclusive'))).toBe(true)
      await expect(page.getByTestId('mixed-geometry-content')).toHaveCount(0)
    })
  })

  test.describe('2. Escape Ordering & Cancellation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()
    })

    test('OV-ESC-01 & OV-ESC-04: Escape key routes deepest-first and closes only the topmost layer', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-root-parent').click()
      const parent = page.getByTestId('nested-parent-content')
      await expect(parent).toBeVisible()

      await page.getByTestId('btn-open-child').click()
      const child = page.getByTestId('nested-child-content')
      await expect(child).toBeVisible()

      await page.getByTestId('btn-open-grandchild').click()
      const grandchild = page.getByTestId('nested-grandchild-content')
      await expect(grandchild).toBeVisible()

      // Press Escape 1: closes ONLY Grandchild
      await page.keyboard.press('Escape')
      await expect(grandchild).toHaveCount(0)
      await expect(child).toBeVisible()
      await expect(parent).toBeVisible()

      // Press Escape 2: closes ONLY Child
      await page.keyboard.press('Escape')
      await expect(child).toHaveCount(0)
      await expect(parent).toBeVisible()

      // Press Escape 3: closes Parent
      await page.keyboard.press('Escape')
      await expect(parent).toHaveCount(0)

      await expect(page.getByTestId('nested-events-log')).toHaveText(
        'open:parent,open:child,open:grandchild,grandchild:escape,grandchild:dismiss,child:escape,child:dismiss,parent:escape,parent:dismiss'
      )
    })

    test('OV-ESC-03: Observes latest state closure and prevents escape dismissal after rerender', async ({
      page,
    }) => {
      await page.goto('/overlay/dialog')
      await page.getByTestId('btn-open-escape-rerender').click()
      const content = page.getByTestId('escape-rerender-content')
      await expect(content).toBeVisible()

      // Increment count to 1 (triggering state update and rerender)
      await page.getByTestId('btn-increment-escape-block').click()
      await expect(page.getByTestId('escape-block-count')).toHaveText('Count: 1')

      // Press Escape: the updated closure should observe escapeBlockCount=1 and call preventDefault()
      await page.keyboard.press('Escape')

      // Content should remain open and modal
      await expect(content).toBeVisible()

      // onDismiss should NOT have been called
      await expect(page.getByTestId('escape-rerender-log')).toHaveText('escape:count=1')
    })

    test('OV-ESC-06: Non-dismissible AlertDialog when application prevents Escape', async ({
      page,
    }) => {
      await page.goto('/overlay/dialog')
      await page.getByTestId('btn-open-alertdialog').click()
      const content = page.getByTestId('alertdialog-content')
      await expect(content).toBeVisible()

      // Focus should be on the destructive button via data-autofocus
      const destructiveBtn = page.getByTestId('btn-alertdialog-destructive')
      await expect(destructiveBtn).toBeFocused()

      // Press Escape
      await page.keyboard.press('Escape')

      // Content should still be visible and open
      await expect(content).toBeVisible()

      // onEscape ran once, onDismiss did not run
      await expect(page.getByTestId('alertdialog-log')).toHaveText('alertdialog:escape')

      // Focus remains contained within the alertdialog
      await page.keyboard.press('Tab')
      await expect(page.getByTestId('btn-alertdialog-cancel')).toBeFocused()
    })
  })

  test.describe('3. Layer Stacks & Nesting Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()
    })

    test('OV-LAYER-01: Interactions inside child popup do not trigger parent outside dismissal', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-root-parent').click()
      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()

      await page.getByTestId('btn-child-action').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()
    })

    test('OV-LAYER-02: Clicking parent outside child dismisses only the child', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-root-parent').click()
      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()

      await page.getByTestId('btn-parent-action').click()
      await expect(page.getByTestId('nested-child-content')).toHaveCount(0)
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()
    })

    test('OV-LAYER-03: Single outside click beyond all layers is consumed by child first, leaving parent open', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-root-parent').click()
      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()

      // Click outside target (force: true because modal dialog backdrop marks outside document inert)
      await page.getByTestId('btn-nested-outside-target').click({ force: true })
      // Child should be dismissed
      await expect(page.getByTestId('nested-child-content')).toHaveCount(0)
      // Parent should remain open!
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()
    })

    test('OV-LAYER-04: Outside touch tap dismisses child without dismissing deferred modal parent', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-root-parent').click()
      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()

      // Dispatch touch tap sequence on outside target
      const target = page.getByTestId('btn-nested-outside-target')
      await target.dispatchEvent('pointerdown', { pointerType: 'touch', button: 0, isPrimary: true })
      await target.dispatchEvent('touchstart')
      await target.dispatchEvent('touchend')
      await target.dispatchEvent('pointerup', { pointerType: 'touch', button: 0, isPrimary: true })
      await target.dispatchEvent('click')

      // Child should be dismissed
      await expect(page.getByTestId('nested-child-content')).toHaveCount(0)

      // Modal parent MUST remain open!
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()

      // Log must show child outside and dismiss, but NO parent dismissal
      const log = await page.getByTestId('nested-events-log').textContent()
      expect(log).toContain('child:outside')
      expect(log).toContain('child:dismiss')
      expect(log).not.toContain('parent:outside')
      expect(log).not.toContain('parent:dismiss')
    })

    test('OV-LAYER-05: Clears deferred parent state when child dismisses first during an outside interaction', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-root-parent').click()
      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()

      // Perform a mouse sequence outside: mousedown -> child dismisses -> mouseup
      const target = page.getByTestId('btn-nested-outside-target')
      const box = (await target.boundingBox())!
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()

      // Child should dismiss upon mouse down outside
      await expect(page.getByTestId('nested-child-content')).toHaveCount(0)

      // Complete the mouse click
      await page.mouse.up()

      // Parent MUST remain open - pending outside state was canceled by child dismissal
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()
      const log = await page.getByTestId('nested-events-log').textContent()
      expect(log).not.toContain('parent:dismiss')
    })

    test('OV-LAYER-06: Controlled parent close cascades deepest-first and restores only outer origin focus', async ({
      page,
    }) => {
      // Focus outer trigger and open parent
      const rootTrigger = page.getByTestId('btn-open-root-parent')
      await rootTrigger.focus()
      await page.keyboard.press('Enter')
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()

      // Open child
      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()

      // Open grandchild
      await page.getByTestId('btn-open-grandchild').click()
      await expect(page.getByTestId('nested-grandchild-content')).toBeVisible()

      // Close parent via controlled close button inside parent content
      await page.getByTestId('btn-parent-close-inner').click()

      // All overlays should unmount
      await expect(page.getByTestId('nested-grandchild-content')).toHaveCount(0)
      await expect(page.getByTestId('nested-child-content')).toHaveCount(0)
      await expect(page.getByTestId('nested-parent-content')).toHaveCount(0)

      // Descendants cascaded deepest-first: grandchild:dismiss before child:dismiss
      const log = (await page.getByTestId('nested-events-log').textContent()) || ''
      expect(log).toContain('grandchild:dismiss')
      expect(log).toContain('child:dismiss')
      expect(log.indexOf('grandchild:dismiss')).toBeLessThan(log.indexOf('child:dismiss'))

      // Outer origin trigger receives focus restoration
      await expect(rootTrigger).toBeFocused()
    })
  })

  test.describe('4. Outside Press & Pointer Mechanics', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/outside')
      await expect(page.getByTestId('outside-fixture-root')).toBeVisible()
    })

    test('OV-OUT-01: Primary pointer down on Backdrop triggers outside press and dismiss', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-outside-dialog').click()
      const content = page.getByTestId('outside-content')
      const backdrop = page.getByTestId('outside-backdrop')
      await expect(content).toBeVisible()

      await backdrop.click({ position: { x: 10, y: 10 } })
      await expect(content).toHaveCount(0)
      await expect(page.getByTestId('outside-events-log')).toHaveText('open,outside:button=0,dismiss')
    })

    test('OV-OUT-02: Pointer click inside Content does not dismiss', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-outside-dialog').click()
      await page.getByTestId('btn-inside-click-test').click()
      await expect(page.getByTestId('outside-content')).toBeVisible()
      await expect(page.getByTestId('outside-events-log')).toHaveText('open,click:inside')
    })

    test('OV-OUT-03: Preventing outside press keeps overlay open', async ({
      page,
    }) => {
      await page.getByTestId('chk-prevent-outside').check()
      await page.getByTestId('btn-open-outside-dialog').click()
      const backdrop = page.getByTestId('outside-backdrop')

      await backdrop.click({ position: { x: 10, y: 10 } })
      await expect(page.getByTestId('outside-content')).toBeVisible()
      await expect(page.getByTestId('outside-events-log')).toContainText('outside:button=0')
    })

    test('OV-OUT-05: Non-primary right-click on Backdrop is ignored and does not dismiss', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-outside-dialog').click()
      const backdrop = page.getByTestId('outside-backdrop')

      await backdrop.click({ button: 'right', position: { x: 10, y: 10 } })
      await expect(page.getByTestId('outside-content')).toBeVisible()
      await expect(page.getByTestId('outside-events-log')).toHaveText('open')
    })

    test('OV-OUT-08: Backdrop that stops click propagation still dismisses overlay', async ({
      page,
    }) => {
      await page.getByTestId('chk-stop-backdrop-click').check()
      await page.getByTestId('btn-open-outside-dialog').click()
      const backdrop = page.getByTestId('outside-backdrop')

      await backdrop.click({ position: { x: 10, y: 10 } })
      await expect(page.getByTestId('outside-content')).toHaveCount(0)
      await expect(page.getByTestId('outside-events-log')).toContainText('dismiss')
    })

    test('OV-OUT-09: ComposedPath classifies Shadow DOM inside Content as inside, outside as outside', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-outside-dialog').click()
      const content = page.getByTestId('outside-content')
      await expect(content).toBeVisible()

      // Click inside shadow host
      const insideShadowBtn = page.getByTestId('shadow-btn-inside')
      await insideShadowBtn.click()
      // Overlay must NOT close
      await expect(content).toBeVisible()

      // Click outside shadow host
      const outsideShadowBtn = page.getByTestId('shadow-btn-outside')
      await outsideShadowBtn.click({ force: true })
      // Overlay MUST close
      await expect(content).toHaveCount(0)
    })

    test('OV-POINTER-02: Restores exact consumer pointer styles on body after modal close', async ({
      page,
    }) => {
      await page.evaluate(() => {
        document.body.style.setProperty('pointer-events', 'auto', 'important')
      })
      const before = await page.evaluate(() => ({
        val: document.body.style.getPropertyValue('pointer-events'),
        prio: document.body.style.getPropertyPriority('pointer-events'),
      }))
      expect(before.val).toBe('auto')
      expect(before.prio).toBe('important')

      await page.getByTestId('btn-open-outside-dialog').click()
      await expect(page.getByTestId('outside-content')).toBeVisible()

      // Body should be locked to none
      const locked = await page.evaluate(() => document.body.style.pointerEvents)
      expect(locked).toBe('none')

      // Close dialog via backdrop click
      await page.getByTestId('outside-backdrop').click({ position: { x: 10, y: 10 } })
      await expect(page.getByTestId('outside-content')).toHaveCount(0)

      // Exact value and priority restored
      const restored = await page.evaluate(() => ({
        val: document.body.style.getPropertyValue('pointer-events'),
        prio: document.body.style.getPropertyPriority('pointer-events'),
      }))
      expect(restored.val).toBe('auto')
      expect(restored.prio).toBe('important')

      // Cleanup
      await page.evaluate(() => document.body.style.removeProperty('pointer-events'))
    })
  })

  test.describe('5. Scroll Lock Mechanics', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/scroll')
      await expect(page.getByTestId('scroll-fixture-root')).toBeVisible()
    })

    test('OV-SCROLL-01: Document scroll position is preserved against background wheel', async ({
      page,
    }) => {
      await page.evaluate(() => window.scrollTo(0, 240))
      const before = await page.evaluate(() => window.scrollY)
      expect(before).toBeGreaterThan(0)

      // Open overlay using the button visible at scrolled offset 240
      await page.getByTestId('btn-open-at-scroll').click()
      const content = page.getByTestId('scroll-content')
      await expect(content).toBeVisible()

      const locked = await page.evaluate(() => window.scrollY)
      expect(locked).toBe(before)

      // Background wheeling
      await page.mouse.move(12, 12)
      await page.mouse.wheel(0, 500)
      const afterWheel = await page.evaluate(() => window.scrollY)
      expect(afterWheel).toBe(before)

      await page.getByTestId('btn-close-scroll-dialog').click()
      await expect(content).toHaveCount(0)
    })

    test('OV-SCROLL-03: Scrollable container inside Content can scroll while document is locked', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-at-scroll').click()
      const inner = page.getByTestId('scrollable-content-inner')
      await expect(inner).toBeVisible()

      const initialInnerScroll = await inner.evaluate(el => el.scrollTop)
      expect(initialInnerScroll).toBe(0)

      const box = await inner.boundingBox()
      expect(box).toBeTruthy()
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.wheel(0, 200)

      await page.waitForFunction(
        () => (document.querySelector('[data-testid="scrollable-content-inner"]') as HTMLElement)?.scrollTop > 0,
        null,
        { timeout: 3000 }
      )

      const afterInnerScroll = await inner.evaluate(el => el.scrollTop)
      expect(afterInnerScroll).toBeGreaterThan(0)
    })
  })

  test.describe('6. Inert Background Isolation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/inert')
      await expect(page.getByTestId('inert-fixture-root')).toBeVisible()
    })

    test('OV-INERT-01: Sibling DOM nodes are marked inert while isolating overlay is open', async ({
      page,
    }) => {
      const siblingContainer = page.getByTestId('inert-sibling-container')
      const siblingBtn = page.getByTestId('btn-sibling-clickable')

      await page.getByTestId('btn-open-inert-dialog').click()
      await expect(page.getByTestId('inert-content')).toBeVisible()

      const isInert = await siblingContainer.evaluate(el => el.hasAttribute('inert') || Boolean(el.closest('[inert]')))
      expect(isInert).toBe(true)

      // Clicking sibling button has no effect
      await siblingBtn.click({ force: true })
      await expect(siblingBtn).toHaveText('Sibling Button (Clicks: 0)')

      await page.getByTestId('btn-close-inert-dialog').click()
      await expect(page.getByTestId('inert-content')).toHaveCount(0)

      const isStillInert = await siblingContainer.evaluate(el => el.hasAttribute('inert') || Boolean(el.closest('[inert]')))
      expect(isStillInert).toBe(false)
    })

    test('OV-INERT-05: Live regions and toast host are exempted from inerting', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-inert-dialog').click()
      await expect(page.getByTestId('inert-content')).toBeVisible()

      const liveRegionInert = await page.getByTestId('sibling-live-region').evaluate(
        el => el.hasAttribute('inert')
      )
      expect(liveRegionInert).toBe(false)

      const toastHostInert = await page.getByTestId('sibling-toast-host').evaluate(
        el => el.hasAttribute('inert')
      )
      expect(toastHostInert).toBe(false)
    })
  })

  test.describe('7. Edge Sheets & Handle Gestures', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/edge')
      await expect(page.getByTestId('edge-fixture-root')).toBeVisible()
    })

    test('OV-EDGE-01: Binds to all four edges correctly', async ({
      page,
    }) => {
      // Bottom edge
      await page.getByTestId('btn-open-edge-bottom').click()
      let content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()
      await expect(content).toHaveAttribute('data-edge', 'bottom')
      await page.getByTestId('btn-close-edge').click()
      await expect(content).toHaveCount(0)

      // Top edge
      await page.getByTestId('btn-open-edge-top').click()
      content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()
      await expect(content).toHaveAttribute('data-edge', 'top')
      await page.getByTestId('btn-close-edge').click()
      await expect(content).toHaveCount(0)

      // Left edge
      await page.getByTestId('btn-open-edge-left').click()
      content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()
      await expect(content).toHaveAttribute('data-edge', 'left')
      await page.getByTestId('btn-close-edge').click()
      await expect(content).toHaveCount(0)

      // Right edge
      await page.getByTestId('btn-open-edge-right').click()
      content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()
      await expect(content).toHaveAttribute('data-edge', 'right')
      await page.getByTestId('btn-close-edge').click()
      await expect(content).toHaveCount(0)
    })

    test('OV-HND-01: Dragging bottom handle past 25% requests dismiss', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-edge-bottom').click()
      const content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()

      const handle = page.getByTestId('edge-handle')
      const box = await handle.boundingBox()
      expect(box).toBeTruthy()

      // Drag down past 25% (e.g. 150px on 240px sheet)
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.down()
      await page.mouse.move(box!.x + box!.width / 2, box!.y + 150, { steps: 10 })
      await page.mouse.up()

      await expect(content).toHaveCount(0)
    })

    test('OV-HND-01: Fast velocity fling dismisses even when dragged < 25%', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-edge-bottom').click()
      const content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()

      const handle = page.getByTestId('edge-handle')
      const box = await handle.boundingBox()
      expect(box).toBeTruthy()

      // Fast fling down by 30px (< 25% of 240 = 60px) in 2 rapid steps
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.down()
      await page.mouse.move(box!.x + box!.width / 2, box!.y + 40, { steps: 2 })
      await page.mouse.up()

      await expect(content).toHaveCount(0)
    })

    test('OV-HND-02: Dragging < 25% slowly snaps back without dismissing', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-edge-bottom').click()
      const content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()

      const handle = page.getByTestId('edge-handle')
      const box = await handle.boundingBox()
      expect(box).toBeTruthy()

      // Slow drag down by only 20px over 25 steps (low velocity, < 25%)
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.down()
      await page.mouse.move(box!.x + box!.width / 2, box!.y + 20, { steps: 25 })
      // pause to ensure zero velocity
      await page.waitForTimeout(100)
      await page.mouse.up()

      // Content must STILL be visible and snapped back!
      await expect(content).toBeVisible()
      const transform = await content.evaluate(el => el.style.transform)
      expect(transform).toBe('')
    })
  })

  test.describe('8. Themed Portal Scoping', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/theme')
      await expect(page.getByTestId('theme-fixture-root')).toBeVisible()
    })

    test('OV-THEME-01 & OV-THEME-02: Portaled content re-establishes dark and light layer scope tokens', async ({
      page,
    }) => {
      // Dark mode
      await page.getByTestId('btn-open-dark-theme').click()
      const darkContent = page.getByTestId('content-dark-theme')
      await expect(darkContent).toBeVisible()

      const darkMeta = await darkContent.evaluate(el => ({
        isBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-panda-theme'),
        bg: window.getComputedStyle(el).backgroundColor,
      }))
      expect(darkMeta.isBodyChild).toBe(true)
      expect(darkMeta.dataLayer).toBeTruthy()
      expect(darkMeta.dataTheme).toBe('dark')
      expect(darkMeta.bg).not.toBe('rgb(255, 255, 255)')

      // Close dark mode
      await page.getByTestId('btn-close-dark-theme').click()
      await expect(darkContent).toHaveCount(0)

      // Light mode
      await page.getByTestId('btn-open-light-theme').click()
      const lightContent = page.getByTestId('content-light-theme')
      await expect(lightContent).toBeVisible()

      const lightMeta = await lightContent.evaluate(el => ({
        isBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-panda-theme'),
        color: window.getComputedStyle(el).color,
      }))
      expect(lightMeta.isBodyChild).toBe(true)
      expect(lightMeta.dataLayer).toBeTruthy()
      expect(lightMeta.dataTheme).toBe('light')
      expect(lightMeta.color).not.toBe('rgb(255, 255, 255)')

      // Close light mode
      await page.getByTestId('btn-close-light-theme').click()
      await expect(lightContent).toHaveCount(0)
    })

    test('OV-TRG-02: isolation={false} Trigger is the Floating UI reference', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-open-dark-theme')
      const content = page.getByTestId('content-dark-theme')

      await expect(content).toHaveCount(0)
      await trigger.click()
      await expect(content).toBeVisible()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')

      const triggerBox = await trigger.boundingBox()
      const contentBox = await content.boundingBox()
      expect(triggerBox).toBeTruthy()
      expect(contentBox).toBeTruthy()

      expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 2)
      expect(contentBox!.y).toBeLessThan(triggerBox!.y + triggerBox!.height + 24)
      expect(Math.abs(contentBox!.x - triggerBox!.x)).toBeLessThan(16)

      await page.getByTestId('btn-close-dark-theme').click()
      await expect(content).toHaveCount(0)
    })
  })

  test.describe('Focus & Restoration Contracts (OV-FOCUS-* & OV-RESTORE-*)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/focus')
      await expect(page.getByTestId('focus-fixture-root')).toBeVisible()
    })

    test('OV-FOCUS-01: Focuses first tabbable by default, or autoFocus when present', async ({
      page,
    }) => {
      // 1. Default first tabbable
      const trigger = page.getByTestId('btn-trigger-focus-default')
      await trigger.click()
      const content = page.getByTestId('focus-default-content')
      await expect(content).toBeVisible()
      await expect(page.getByTestId('focus-default-btn-1')).toBeFocused()

      await page.getByTestId('btn-close-focus-default').click()
      await expect(content).toHaveCount(0)

      // 2. Authored autoFocus takes priority
      const triggerAutoFocus = page.getByTestId('btn-trigger-focus-autofocus')
      await triggerAutoFocus.click()
      const autoFocusContent = page.getByTestId('focus-autofocus-content')
      await expect(autoFocusContent).toBeVisible()
      await expect(page.getByTestId('focus-autofocus-btn-2')).toBeFocused()

      await page.getByTestId('btn-close-focus-autofocus').click()
      await expect(autoFocusContent).toHaveCount(0)
    })

    test('OV-FOCUS-02: Honors initialFocus ref, resolver, and falls back gracefully on invalid resolver', async ({
      page,
    }) => {
      // 1. initialFocus as Ref
      await page.getByTestId('btn-open-focus-ref').click()
      const refContent = page.getByTestId('focus-ref-content')
      await expect(refContent).toBeVisible()
      await expect(page.getByTestId('focus-ref-btn-3')).toBeFocused()
      await page.getByTestId('btn-close-focus-ref').click()
      await expect(refContent).toHaveCount(0)

      // 2. initialFocus as Resolver function
      await page.getByTestId('btn-open-focus-resolver').click()
      const resolverContent = page.getByTestId('focus-resolver-content')
      await expect(resolverContent).toBeVisible()
      await expect(page.getByTestId('focus-resolver-btn-2')).toBeFocused()
      await page.getByTestId('btn-close-focus-resolver').click()
      await expect(resolverContent).toHaveCount(0)

      // 3. initialFocus as Invalid detached node -> fallback to first tabbable
      await page.getByTestId('btn-open-focus-invalid').click()
      const invalidContent = page.getByTestId('focus-invalid-content')
      await expect(invalidContent).toBeVisible()
      await expect(page.getByTestId('focus-invalid-btn-1')).toBeFocused()
      await page.getByTestId('btn-close-focus-invalid').click()
      await expect(invalidContent).toHaveCount(0)
    })

    test('OV-FOCUS-03: Skips initial focus move when initialFocus={false}, reclaims once inside', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-trigger-no-initial')
      await trigger.focus()
      await expect(trigger).toBeFocused()
      await page.keyboard.press('Enter')

      const content = page.getByTestId('focus-no-initial-content')
      await expect(content).toBeVisible()
      // Focus must remain on the trigger (initial focus skipped)
      await expect(trigger).toBeFocused()

      // Entering content activates trap
      await page.getByTestId('focus-no-initial-btn-1').click()
      await expect(page.getByTestId('focus-no-initial-btn-1')).toBeFocused()

      // Attempting programmatic escape outside must be reclaimed
      await page.evaluate(() => {
        document.querySelector<HTMLElement>('[data-testid="btn-outside-focus-target"]')?.focus()
      })
      await expect(page.getByTestId('focus-no-initial-btn-1')).toBeFocused()

      await page.getByTestId('btn-close-no-initial').click()
      await expect(content).toHaveCount(0)
    })

    test('OV-RESTORE-02: Restores focus to trigger immediately on zero-duration exit', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-trigger-restore-zero')
      await trigger.focus()
      await page.keyboard.press('Enter')

      const content = page.getByTestId('restore-zero-content')
      await expect(content).toBeVisible()
      await expect(page.getByTestId('restore-zero-inner-btn')).toBeFocused()

      await page.getByTestId('btn-close-restore-zero').click()
      await expect(content).toHaveCount(0)
      await expect(trigger).toBeFocused()
    })

    test('OV-RESTORE-01: Restores focus only after animated exit completes', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-trigger-restore-animated')
      await trigger.focus()
      await page.keyboard.press('Enter')

      const content = page.getByTestId('restore-animated-content')
      await expect(content).toBeVisible()
      await expect(page.getByTestId('restore-animated-inner-btn')).toBeFocused()

      await page.getByTestId('btn-close-restore-animated').click()
      // Content should still be mounted with data-state="closed" during exit animation
      await expect(content).toHaveAttribute('data-state', 'closed')

      // Wait for complete unmount
      await expect(content).toHaveCount(0)
      // Focus restores to trigger upon unmount
      await expect(trigger).toBeFocused()
    })

    test('OV-RESTORE-07: Restores focus to explicit FocusTarget upon close', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-trigger-custom-restore')
      const target = page.getByTestId('btn-custom-restore-target')

      await trigger.click()
      const content = page.getByTestId('custom-restore-content')
      await expect(content).toBeVisible()

      await page.getByTestId('btn-close-custom-restore').click()
      await expect(content).toHaveCount(0)
      await expect(target).toBeFocused()
    })

    test('OV-FOCUS-05: Preserves focus containment when focused element is removed, disabled, or hidden', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-dynamic-focus').click()
      const content = page.getByTestId('dynamic-focus-content')
      await expect(content).toBeVisible()

      const firstBtn = page.getByTestId('btn-dynamic-first')
      const middleBtn = page.getByTestId('btn-dynamic-middle')
      const removeBtn = page.getByTestId('btn-action-remove-middle')
      const disableBtn = page.getByTestId('btn-action-disable-middle')
      const hideBtn = page.getByTestId('btn-action-hide-middle')

      // 1. Remove focused element
      await middleBtn.focus()
      await expect(middleBtn).toBeFocused()

      // Click remove button via evaluate to remove middle button while maintaining focus context
      await removeBtn.evaluate((el: HTMLElement) => el.click())
      await expect(middleBtn).toHaveCount(0)

      // Press Tab: Focus must stay contained inside Content (should not leak to body or outside)
      await page.keyboard.press('Tab')
      const activeAfterRemove = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(['btn-action-remove-middle', 'btn-dynamic-first', 'dynamic-focus-content', 'btn-dynamic-last']).toContain(activeAfterRemove)

      // Close and reopen to test disabling
      await page.getByTestId('btn-close-dynamic-focus').click()
      await expect(content).toHaveCount(0)

      // 2. Disable focused element
      await page.getByTestId('btn-open-dynamic-focus').click()
      await expect(content).toBeVisible()
      await middleBtn.focus()
      await expect(middleBtn).toBeFocused()

      await disableBtn.evaluate((el: HTMLElement) => el.click())
      await expect(middleBtn).toBeDisabled()

      await page.keyboard.press('Tab')
      const activeAfterDisable = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(activeAfterDisable).not.toBe('btn-outside-focus-target')
      const isInsideAfterDisable = await page.evaluate(() => {
        const active = document.activeElement
        const container = document.querySelector('[data-testid="dynamic-focus-content"]')
        return container?.contains(active)
      })
      expect(isInsideAfterDisable).toBe(true)

      // Close and reopen to test hiding
      await page.getByTestId('btn-close-dynamic-focus').click()
      await expect(content).toHaveCount(0)

      // 3. Hide focused element
      await page.getByTestId('btn-open-dynamic-focus').click()
      await expect(content).toBeVisible()
      await middleBtn.focus()
      await expect(middleBtn).toBeFocused()

      await hideBtn.evaluate((el: HTMLElement) => el.click())
      await expect(middleBtn).toBeHidden()

      await page.keyboard.press('Tab')
      const isInsideAfterHide = await page.evaluate(() => {
        const active = document.activeElement
        const container = document.querySelector('[data-testid="dynamic-focus-content"]')
        return container?.contains(active)
      })
      expect(isInsideAfterHide).toBe(true)

      await page.getByTestId('btn-close-dynamic-focus').click()
      await expect(content).toHaveCount(0)
    })

    test('OV-FOCUS-06: Pauses parent focus lock when nested modal is active and resumes upon close', async ({
      page,
    }) => {
      const openParentBtn = page.getByTestId('btn-open-parent-modal')
      await openParentBtn.click()

      const parentContent = page.getByTestId('parent-modal-content')
      await expect(parentContent).toBeVisible()
      const parentBtn1 = page.getByTestId('btn-parent-focus-1')
      await expect(parentBtn1).toBeFocused()

      // Open child modal
      await page.getByTestId('btn-open-child-modal').click()
      const childContent = page.getByTestId('child-modal-content')
      await expect(childContent).toBeVisible()

      const childBtn1 = page.getByTestId('btn-child-focus-1')
      const childBtn2 = page.getByTestId('btn-child-focus-2')
      await expect(childBtn1).toBeFocused()

      // Tabbing loops within child modal only
      await page.keyboard.press('Tab')
      await expect(childBtn2).toBeFocused()

      // Attempt programmatic escape to parent modal control: child lock must reclaim!
      await parentBtn1.evaluate((el: HTMLElement) => el.focus())
      // Parent must NOT retain focus; child lock reclaims focus to child candidate
      const activeDuringChild = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(['btn-child-focus-1', 'btn-child-focus-2', 'child-modal-content']).toContain(activeDuringChild)

      // Attempt programmatic escape to background: child lock must reclaim!
      await page.evaluate(() => {
        document.querySelector<HTMLElement>('[data-testid="btn-outside-focus-target"]')?.focus()
      })
      const activeDuringBgAttempt = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(['btn-child-focus-1', 'btn-child-focus-2', 'child-modal-content']).toContain(activeDuringBgAttempt)

      // Close child modal
      await page.getByTestId('btn-close-child-modal').click()
      await expect(childContent).toHaveCount(0)

      // Parent modal resumes! Focus returns to parent control
      const isInsideParent = await page.evaluate(() => {
        const active = document.activeElement
        const parent = document.querySelector('[data-testid="parent-modal-content"]')
        return parent?.contains(active)
      })
      expect(isInsideParent).toBe(true)

      // Parent lock now contains focus: attempting programmatic escape outside is reclaimed by parent
      await page.evaluate(() => {
        document.querySelector<HTMLElement>('[data-testid="btn-outside-focus-target"]')?.focus()
      })
      const isInsideParentAfterReclaim = await page.evaluate(() => {
        const active = document.activeElement
        const parent = document.querySelector('[data-testid="parent-modal-content"]')
        return parent?.contains(active)
      })
      expect(isInsideParentAfterReclaim).toBe(true)

      // Close parent modal
      await page.getByTestId('btn-close-parent-modal').click()
      await expect(parentContent).toHaveCount(0)
    })
  })

  test.describe('Anchored Floating UI & Arrow Contracts (OV-POS-*)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/anchor')
      await expect(page.getByTestId('anchor-fixture-root')).toBeVisible()
    })

    test('OV-POS-02: Positions Content from anchor with frozen defaults (bottom-start, 8px offset, CSS vars)', async ({
      page,
    }) => {
      const anchor = page.getByTestId('anchor-target-defaults')
      await anchor.click()

      const content = page.getByTestId('content-pos-defaults')
      await expect(content).toBeVisible()

      const anchorBox = (await anchor.boundingBox())!
      const contentBox = (await content.boundingBox())!

      // Default bottom-start: top of content should be anchor.bottom + 8px offset
      expect(Math.abs(contentBox.y - (anchorBox.y + anchorBox.height + 8))).toBeLessThanOrEqual(2)
      // Start aligned: x of content matches x of anchor
      expect(Math.abs(contentBox.x - anchorBox.x)).toBeLessThanOrEqual(2)

      // Data attributes
      await expect(content).toHaveAttribute('data-side', 'bottom')
      await expect(content).toHaveAttribute('data-align', 'start')

      // Position absolute
      const positionStyle = await content.evaluate(el => (el as HTMLElement).style.position)
      expect(positionStyle).toBe('absolute')

      // Published CSS variables
      const cssVars = await content.evaluate(el => {
        const style = (el as HTMLElement).style
        return {
          availableWidth: style.getPropertyValue('--reference-overlay-available-width'),
          availableHeight: style.getPropertyValue('--reference-overlay-available-height'),
          anchorWidth: style.getPropertyValue('--reference-overlay-anchor-width'),
          anchorHeight: style.getPropertyValue('--reference-overlay-anchor-height'),
          transformOrigin: style.getPropertyValue('--reference-overlay-transform-origin'),
        }
      })

      expect(parseFloat(cssVars.availableWidth)).toBeGreaterThan(0)
      expect(parseFloat(cssVars.availableHeight)).toBeGreaterThan(0)
      expect(parseFloat(cssVars.anchorWidth)).toBe(anchorBox.width)
      expect(parseFloat(cssVars.anchorHeight)).toBe(anchorBox.height)
      expect(cssVars.transformOrigin).toBe('0 0')

      await page.getByTestId('btn-close-pos-defaults').click()
      await expect(content).toHaveCount(0)
    })

    test('OV-POS-03: Flips and shifts anchored Content instead of overflowing', async ({
      page,
    }) => {
      const anchor = page.getByTestId('anchor-target-edge')
      await anchor.click()

      // 1. Flip & shift enabled
      const enabledContent = page.getByTestId('content-flip-shift-enabled')
      await expect(enabledContent).toBeVisible()

      const anchorBox = (await anchor.boundingBox())!
      const enabledBox = (await enabledContent.boundingBox())!

      // Bottom would overflow viewport (anchor is at y=680 in 720h viewport), so it must flip to top
      await expect(enabledContent).toHaveAttribute('data-side', 'top')
      expect(enabledBox.y + enabledBox.height).toBeLessThanOrEqual(anchorBox.y)

      // Shift should keep content within viewport bounds
      const viewport = page.viewportSize()!
      expect(enabledBox.x + enabledBox.width).toBeLessThanOrEqual(viewport.width)

      await page.getByTestId('btn-close-flip-shift').click()
      await expect(enabledContent).toHaveCount(0)

      // 2. Flip & shift disabled
      await page.getByTestId('btn-open-no-flip-no-shift').click()
      const disabledContent = page.getByTestId('content-flip-shift-disabled')
      await expect(disabledContent).toBeVisible()

      const disabledBox = (await disabledContent.boundingBox())!
      // Must NOT flip: side stays 'bottom'
      await expect(disabledContent).toHaveAttribute('data-side', 'bottom')
      expect(disabledBox.y).toBeGreaterThanOrEqual(anchorBox.y + anchorBox.height)

      await page.getByTestId('btn-close-no-flip-shift').click()
      await expect(disabledContent).toHaveCount(0)
    })

    test('OV-POS-04: Honors explicit offset, collisionPadding, and strategy="fixed"', async ({
      page,
    }) => {
      const anchor = page.getByTestId('anchor-target-custom')
      await anchor.click()

      const content = page.getByTestId('content-pos-custom')
      await expect(content).toBeVisible()

      const anchorBox = (await anchor.boundingBox())!
      const contentBox = (await content.boundingBox())!

      // Strategy: fixed
      const inline = await content.evaluate(el => ({
        position: (el as HTMLElement).style.position,
        transform: (el as HTMLElement).style.transform,
      }))
      expect(inline.position).toBe('fixed')
      expect(inline.transform).toBe('scale(1.05)')

      // Explicit offset = 24
      expect(Math.abs(contentBox.y - (anchorBox.y + anchorBox.height + 24))).toBeLessThanOrEqual(2)

      await page.getByTestId('btn-close-pos-custom').click()
      await expect(content).toHaveCount(0)
    })

    test('OV-POS-05: Overlay.Arrow participates in position pass and honors edgePadding', async ({
      page,
    }) => {
      // 1. Default edgePadding = 4
      await page.getByTestId('anchor-target-arrow').click()
      const contentDefault = page.getByTestId('content-arrow-default')
      const arrowDefault = page.getByTestId('arrow-default')
      await expect(contentDefault).toBeVisible()
      await expect(arrowDefault).toBeVisible()

      const defaultContentBox = (await contentDefault.boundingBox())!
      const defaultArrowBox = (await arrowDefault.boundingBox())!

      expect(defaultArrowBox.x).toBeGreaterThanOrEqual(defaultContentBox.x + 3)
      await page.getByTestId('btn-close-arrow-default').click()
      await expect(contentDefault).toHaveCount(0)

      // 2. Custom edgePadding = 16
      await page.getByTestId('btn-open-arrow-custom').click()
      const contentCustom = page.getByTestId('content-arrow-custom')
      const arrowCustom = page.getByTestId('arrow-custom')
      await expect(contentCustom).toBeVisible()
      await expect(arrowCustom).toBeVisible()

      const customContentBox = (await contentCustom.boundingBox())!
      const customArrowBox = (await arrowCustom.boundingBox())!

      expect(customArrowBox.x).toBeGreaterThanOrEqual(customContentBox.x + 15)
      await page.getByTestId('btn-close-arrow-custom').click()
      await expect(contentCustom).toHaveCount(0)
    })
  })

  test.describe('10. Presence & Exit Lifecycle', () => {
    test('OV-PRES-01: Keeps both Backdrop and Content mounted with data-state="closed" during owned CSS exit', async ({
      page,
    }) => {
      await page.goto('/overlay/dialog')
      await page.getByTestId('btn-open-pres-equal').click()
      const backdrop = page.getByTestId('dialog-pres-equal-backdrop')
      const content = page.getByTestId('dialog-pres-equal-content')
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()
      await expect(backdrop).toHaveAttribute('data-state', 'open')
      await expect(content).toHaveAttribute('data-state', 'open')

      // Close dialog
      await page.getByTestId('btn-close-pres-equal').click()

      // Immediately after close, both parts must have data-state="closed" AND remain mounted in the DOM
      await expect(backdrop).toHaveAttribute('data-state', 'closed')
      await expect(content).toHaveAttribute('data-state', 'closed')
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // Wait for the 150ms animation to finish
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(backdrop).toHaveCount(0, { timeout: 3000 })
    })

    test('OV-PRES-02: Waits for slower part (Backdrop 250ms, Content 100ms)', async ({
      page,
    }) => {
      await page.goto('/overlay/dialog')
      await page.getByTestId('btn-open-pres-backdrop-slower').click()
      const backdrop = page.getByTestId('dialog-pres-backdrop-slower-backdrop')
      const content = page.getByTestId('dialog-pres-backdrop-slower-content')
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // Close dialog
      await page.getByTestId('btn-close-pres-backdrop-slower').click()

      // At 120ms (Content's 100ms exit is complete, but Backdrop's 250ms exit is still running)
      await page.waitForTimeout(120)

      // Content MUST NOT tear down early! Both parts must remain mounted in DOM
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // Modal systems (pointer lock) must still be active
      const bodyPointer = await page.evaluate(() => document.body.style.pointerEvents)
      expect(bodyPointer).toBe('none')

      // After Backdrop 250ms completes (> 350ms total), both unmount together
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(backdrop).toHaveCount(0, { timeout: 3000 })

      // And modal pointer lock is restored
      const restoredPointer = await page.evaluate(() => document.body.style.pointerEvents)
      expect(restoredPointer).not.toBe('none')
    })

    test('OV-PRES-02: Waits for slower part (Backdrop 100ms, Content 250ms)', async ({
      page,
    }) => {
      await page.goto('/overlay/dialog')
      await page.getByTestId('btn-open-pres-content-slower').click()
      const backdrop = page.getByTestId('dialog-pres-content-slower-backdrop')
      const content = page.getByTestId('dialog-pres-content-slower-content')
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // Close dialog
      await page.getByTestId('btn-close-pres-content-slower').click()

      // At 120ms (Backdrop's 100ms exit is complete, but Content's 250ms exit is still running)
      await page.waitForTimeout(120)

      // Backdrop MUST NOT tear down early! Both parts must remain mounted in DOM
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // After Content 250ms completes, both unmount together
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(backdrop).toHaveCount(0, { timeout: 3000 })
    })

    test('OV-PRES-04: Completes close immediately with zero/no-animation styles or reduced motion', async ({
      page,
    }) => {
      await page.goto('/overlay/dialog')

      // Case 1: zero/no-motion styles
      await page.getByTestId('btn-open-pres-no-motion').click()
      const noMotionContent = page.getByTestId('dialog-pres-no-motion-content')
      await expect(noMotionContent).toBeVisible()

      const startTime = Date.now()
      await page.getByTestId('btn-close-pres-no-motion').click()
      await expect(noMotionContent).toHaveCount(0, { timeout: 500 })
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(400) // Unmounts immediately, no 5s timeout

      // Case 2: Reduced motion emulation
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.getByTestId('btn-open-pres-equal').click()
      const equalContent = page.getByTestId('dialog-pres-equal-content')
      await expect(equalContent).toBeVisible()

      const reducedStart = Date.now()
      await page.getByTestId('btn-close-pres-equal').click()
      await expect(equalContent).toHaveCount(0, { timeout: 500 })
      const reducedElapsed = Date.now() - reducedStart
      expect(reducedElapsed).toBeLessThan(400) // Unmounts immediately under reduced motion
    })

    test('OV-PRES-03: Ignores bubbled child animation events when Content itself is still exiting', async ({
      page,
    }) => {
      await page.goto('/overlay/dialog')
      await page.getByTestId('btn-open-pres-child-anim').click()
      const backdrop = page.getByTestId('dialog-pres-child-anim-backdrop')
      const content = page.getByTestId('dialog-pres-child-anim-content')
      const child = page.getByTestId('pres-child-anim-target')
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()
      await expect(child).toBeVisible()

      // Close dialog
      await page.getByTestId('btn-close-pres-child-anim').click()

      // At 80ms (child's 50ms animation is done and bubbled, but Content/Backdrop 250ms is still active)
      await page.waitForTimeout(80)

      // Content and Backdrop MUST remain mounted despite child's animationend event bubbling
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // After 250ms owned animations complete (> 350ms total), both unmount
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(backdrop).toHaveCount(0, { timeout: 3000 })
    })

    test('OV-PRES-05: Maintains one current lifecycle during rapid close -> reopen -> close sequence', async ({
      page,
    }) => {
      await page.goto('/overlay/dialog')
      const openBtn = page.getByTestId('btn-open-pres-equal')
      const backdrop = page.getByTestId('dialog-pres-equal-backdrop')
      const content = page.getByTestId('dialog-pres-equal-content')

      // 1. Initial open
      await openBtn.click()
      await expect(content).toBeVisible()
      await expect(content).toHaveAttribute('data-state', 'open')

      // 2. Trigger rapid close -> reopen cycle during exit animation
      await page.getByTestId('btn-close-then-reopen-inner').click()

      // At 60ms (reopened at 40ms, so it is open again while the 150ms animation was in-flight)
      await page.waitForTimeout(60)

      // Content and Backdrop should return to open state and NOT unmount
      await expect(content).toHaveAttribute('data-state', 'open')
      await expect(backdrop).toHaveAttribute('data-state', 'open')
      await expect(content).toBeVisible()
      await expect(backdrop).toBeVisible()

      // Wait beyond the original 150ms to ensure stale exit animation does NOT unmount it
      await page.waitForTimeout(160)
      await expect(content).toBeVisible()
      await expect(backdrop).toBeVisible()

      // Pointer lock should still be active
      const locked = await page.evaluate(() => document.body.style.pointerEvents)
      expect(locked).toBe('none')

      // 3. Final close
      await page.getByTestId('btn-close-pres-equal').click()
      await expect(content).toHaveAttribute('data-state', 'closed')

      // Should unmount cleanly after final exit
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(backdrop).toHaveCount(0, { timeout: 3000 })

      // Pointer lock restored exactly once
      const restored = await page.evaluate(() => document.body.style.pointerEvents)
      expect(restored).not.toBe('none')
    })
  })

  test.describe('11. Modal Pointer Isolation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/overlay/dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-POINTER-01: Blocks background pointer activation (mouse, text, focus) while modal is open', async ({
      page,
    }) => {
      const bgBtn = page.getByTestId('btn-pointer-bg-click')
      const bgInput = page.getByTestId('input-pointer-bg-text')
      const openBtn = page.getByTestId('btn-open-pointer-iso')
      const content = page.getByTestId('pointer-iso-content')
      const insideBtn = page.getByTestId('btn-pointer-inside-action')

      // Initial sanity: background controls work before modal opens
      await bgBtn.click()
      await expect(bgBtn).toHaveText('BG Click (1)')

      // Open modal
      await openBtn.click()
      await expect(content).toBeVisible()

      // While open, clicking inside content works normally
      await insideBtn.click()
      await expect(insideBtn).toHaveText('Inside Action (1)')

      // Click at background button coordinates while modal is open:
      // Real click lands on backdrop, closing the modal without activating the background button
      const bgBox = await bgBtn.boundingBox()
      expect(bgBox).not.toBeNull()
      if (bgBox) {
        await page.mouse.click(bgBox.x + bgBox.width / 2, bgBox.y + bgBox.height / 2)
      }
      await expect(content).toHaveCount(0)
      // Background button counter must remain unchanged!
      await expect(bgBtn).toHaveText('BG Click (1)')

      // Re-open modal to test input focus isolation
      await openBtn.click()
      await expect(content).toBeVisible()

      // Real mouse click at background input coordinates while modal is open:
      const inputBox = await bgInput.boundingBox()
      expect(inputBox).not.toBeNull()
      if (inputBox) {
        await page.mouse.click(inputBox.x + inputBox.width / 2, inputBox.y + inputBox.height / 2)
      }
      await expect(content).toHaveCount(0)
      // Background input must NOT have received focus
      const isInputActive = await bgInput.evaluate(el => el === document.activeElement)
      expect(isInputActive).toBe(false)

      // Once fully closed, background controls work normally
      await bgBtn.click()
      await expect(bgBtn).toHaveText('BG Click (2)')
      await bgInput.click()
      await bgInput.fill('hello')
      await expect(bgInput).toHaveValue('hello')
    })

    test('OV-POINTER-03: Keeps background isolated when nested modals close out of order', async ({
      page,
    }) => {
      const bgBtn = page.getByTestId('btn-nested-modal-bg-target')
      const openModalA = page.getByTestId('btn-open-modal-a')
      const modalA = page.getByTestId('modal-a-content')
      const openModalB = page.getByTestId('btn-open-modal-b')
      const modalB = page.getByTestId('modal-b-content')
      const closeModalAExternal = page.getByTestId('btn-close-modal-a-external')
      const closeModalB = page.getByTestId('btn-close-modal-b')

      // Initial click works
      await bgBtn.click()
      await expect(bgBtn).toHaveText('Nested Modal BG Target (1)')

      // Open Modal A, then Modal B
      await openModalA.click()
      await expect(modalA).toBeVisible()
      await openModalB.click()
      await expect(modalB).toBeVisible()

      // Scenario 1: Close Modal A first (parent closed while child remains)
      await closeModalAExternal.evaluate((el: HTMLElement) => el.click())
      await expect(modalA).toHaveCount(0)
      await expect(modalB).toBeVisible()

      // Background must STILL be blocked (body pointer-events: none)
      const lockedAfterAClose = await page.evaluate(() => document.body.style.pointerEvents)
      expect(lockedAfterAClose).toBe('none')

      await bgBtn.click({ force: true })
      await expect(bgBtn).toHaveText('Nested Modal BG Target (1)')

      // Now close Modal B (the final modal)
      await closeModalB.click()
      await expect(modalB).toHaveCount(0)

      // Background must now be unlocked!
      const unlocked = await page.evaluate(() => document.body.style.pointerEvents)
      expect(unlocked).not.toBe('none')
      await bgBtn.click()
      await expect(bgBtn).toHaveText('Nested Modal BG Target (2)')

      // Scenario 2: Open A and B again, this time close B first, then A
      await openModalA.click()
      await expect(modalA).toBeVisible()
      await openModalB.click()
      await expect(modalB).toBeVisible()

      await closeModalB.click()
      await expect(modalB).toHaveCount(0)
      await expect(modalA).toBeVisible()

      // Background must STILL be blocked
      const lockedAfterBClose = await page.evaluate(() => document.body.style.pointerEvents)
      expect(lockedAfterBClose).toBe('none')

      await bgBtn.click({ force: true })
      await expect(bgBtn).toHaveText('Nested Modal BG Target (2)')

      // Close A
      await page.getByTestId('btn-close-modal-a').click()
      await expect(modalA).toHaveCount(0)

      // Background unlocked exactly once
      const unlocked2 = await page.evaluate(() => document.body.style.pointerEvents)
      expect(unlocked2).not.toBe('none')
      await bgBtn.click()
      await expect(bgBtn).toHaveText('Nested Modal BG Target (3)')
    })

    test('OV-POINTER-04: Makes only top modal Content interactive when layers overlap', async ({
      page,
    }) => {
      const openLower = page.getByTestId('btn-open-overlap-lower')
      const lowerContent = page.getByTestId('overlap-lower-content')
      const topContent = page.getByTestId('overlap-top-content')
      const lowerActionBtn = page.getByTestId('btn-overlap-lower-action')
      const topActionBtn = page.getByTestId('btn-overlap-top-action')

      // Open lower modal first
      await openLower.click()
      await expect(lowerContent).toBeVisible()
      // Lower modal button works when it is the topmost modal
      await lowerActionBtn.click()
      await expect(lowerActionBtn).toHaveText('Lower Action (1)')

      // Open top modal from inside lower modal
      await page.getByTestId('btn-open-overlap-top-from-lower').click()
      await expect(topContent).toBeVisible()

      // Click top modal button -> responds normally
      await topActionBtn.click()
      await expect(topActionBtn).toHaveText('Top Action (1)')

      // Attempt to click exposed lower modal button (it has pointer-events: none)
      await lowerActionBtn.click({ force: true })

      // Lower action MUST NOT increment (it is not interactive while top modal is open)
      await expect(lowerActionBtn).toHaveText('Lower Action (1)')
      // Lower action button MUST NOT receive focus
      const isLowerFocused = await lowerActionBtn.evaluate(el => el === document.activeElement)
      expect(isLowerFocused).toBe(false)

      // Lower content must NOT dismiss both
      await expect(lowerContent).toBeVisible()

      // Close top modal
      await page.getByTestId('btn-close-overlap-top').click()
      await expect(topContent).toHaveCount(0)

      // Lower modal is now topmost again and interactive
      await lowerActionBtn.click()
      await expect(lowerActionBtn).toHaveText('Lower Action (2)')
    })

    test('OV-POINTER-05: Retains modal pointer isolation through entire animated exit until unmount', async ({
      page,
    }) => {
      const bgBtn = page.getByTestId('btn-pres-pointer-exit-bg')
      const openBtn = page.getByTestId('btn-open-pres-pointer-exit')
      const content = page.getByTestId('dialog-pres-pointer-exit-content')
      const closeBtn = page.getByTestId('btn-close-pres-pointer-exit')

      await openBtn.click()
      await expect(content).toBeVisible()

      // Start animated close (250ms duration)
      await closeBtn.click()
      await expect(content).toHaveAttribute('data-state', 'closed')

      // At 80ms into the 250ms exit: Content is still mounted
      await page.waitForTimeout(80)
      await expect(content).toBeVisible()

      // Body pointer-events must STILL be locked to none
      const lockedDuringExit = await page.evaluate(() => document.body.style.pointerEvents)
      expect(lockedDuringExit).toBe('none')

      // Attempt clicking background button during exit
      const bgBox = await bgBtn.boundingBox()
      if (bgBox) {
        await page.mouse.click(bgBox.x + bgBox.width / 2, bgBox.y + bgBox.height / 2)
      }
      await expect(bgBtn).toHaveText('Pres Pointer Exit BG (0)')

      // Wait for exit completion and unmount
      await expect(content).toHaveCount(0, { timeout: 3000 })

      // Original pointer style restored
      const restored = await page.evaluate(() => document.body.style.pointerEvents)
      expect(restored).not.toBe('none')

      // Background button is clickable again
      await bgBtn.click()
      await expect(bgBtn).toHaveText('Pres Pointer Exit BG (1)')
    })

    test('OV-POINTER-06: Cancels pointer teardown when reopening during exit', async ({
      page,
    }) => {
      const bgBtn = page.getByTestId('btn-reopen-pointer-bg')
      const openBtn = page.getByTestId('btn-open-reopen-pointer')
      const content = page.getByTestId('dialog-reopen-pointer-content')
      const quickCycleBtn = page.getByTestId('btn-reopen-pointer-quick-cycle')
      const finalCloseBtn = page.getByTestId('btn-close-reopen-pointer-final')

      await openBtn.click()
      await expect(content).toBeVisible()

      // Trigger close followed by reopen at 50ms (during 250ms exit)
      await quickCycleBtn.click()

      // At 80ms: reopening has occurred, content is open
      await page.waitForTimeout(80)
      await expect(content).toHaveAttribute('data-state', 'open')

      // Wait beyond the original 250ms exit window (e.g. 300ms total)
      // Stale exit event must NOT teardown pointer lock!
      await page.waitForTimeout(220)
      await expect(content).toBeVisible()

      const lockedAfterStaleExit = await page.evaluate(() => document.body.style.pointerEvents)
      expect(lockedAfterStaleExit).toBe('none')

      // Background button must not receive clicks
      const bgBox = await bgBtn.boundingBox()
      if (bgBox) {
        await page.mouse.click(bgBox.x + bgBox.width / 2, bgBox.y + bgBox.height / 2)
      }
      await expect(bgBtn).toHaveText('Reopen Pointer BG (0)')

      // Now perform clean final close
      await finalCloseBtn.click()
      await expect(content).toHaveCount(0, { timeout: 3000 })

      // Pointer lock finally restored
      const restored = await page.evaluate(() => document.body.style.pointerEvents)
      expect(restored).not.toBe('none')

      await bgBtn.click()
      await expect(bgBtn).toHaveText('Reopen Pointer BG (1)')
    })
  })
})

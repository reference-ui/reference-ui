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
  })
})

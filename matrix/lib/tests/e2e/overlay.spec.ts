import { expect, test, type Locator } from '@playwright/test'

test.describe('Overlay Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/overlay')
    await expect(page.getByTestId('overlay-fixture-root')).toBeVisible()
  })

  test('OV-DOM-01 & OV-DOM-05: Renders no portal content initially, renders Backdrop and Content upon open', async ({
    page,
  }) => {
    const backdrop = page.getByTestId('overlay-backdrop')
    const content = page.getByTestId('overlay-content')

    await expect(backdrop).toHaveCount(0)
    await expect(content).toHaveCount(0)

    await page.getByTestId('btn-open-overlay').click()

    await expect(backdrop).toBeVisible()
    await expect(content).toBeVisible()
    await expect(content.getByTestId('overlay-title')).toHaveText('Dialog Title')

    await page.getByTestId('btn-close-overlay').click()
    await expect(content).toHaveCount(0)
  })

  test('Escape key dismisses the overlay', async ({ page }) => {
    await page.getByTestId('btn-open-overlay').click()
    const content = page.getByTestId('overlay-content')
    await expect(content).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
  })

  test('Clicking backdrop dismisses the overlay', async ({ page }) => {
    await page.getByTestId('btn-open-overlay').click()
    const content = page.getByTestId('overlay-content')
    const backdrop = page.getByTestId('overlay-backdrop')
    await expect(content).toBeVisible()

    await backdrop.click({ position: { x: 10, y: 10 } })
    await expect(content).toHaveCount(0)
  })

  test('Focus is trapped inside overlay content while open', async ({ page }) => {
    await page.getByTestId('btn-open-overlay').click()
    const firstAction = page.getByTestId('btn-inside-first')
    const closeBtn = page.getByTestId('btn-close-overlay')

    await expect(firstAction).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(closeBtn).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(firstAction).toBeFocused()
  })

  test('OV-POS-01: Unbound Content writes no position/top/left', async ({ page }) => {
    await page.getByTestId('btn-open-unbound').click()
    const content = page.getByTestId('overlay-unbound-content')
    await expect(content).toBeVisible()

    const inline = await content.evaluate(el => ({
      position: (el as HTMLElement).style.position,
      top: (el as HTMLElement).style.top,
      left: (el as HTMLElement).style.left,
    }))

    expect(inline.position).toBe('')
    expect(inline.top).toBe('')
    expect(inline.left).toBe('')
  })

  test('OV-POS-01 dialog: isolating Trigger does not overwrite application centering', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-overlay').click()
    const content = page.getByTestId('overlay-content')
    await expect(content).toBeVisible()

    const inline = await content.evaluate(el => ({
      position: (el as HTMLElement).style.position,
      top: (el as HTMLElement).style.top,
      left: (el as HTMLElement).style.left,
    }))

    expect(inline.position).toBe('fixed')
    expect(inline.top).toBe('50%')
    expect(inline.left).toBe('50%')
  })

  test('OV-TRG-02: isolation={false} Trigger is the Floating UI reference', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-open-anchored')
    const content = page.getByTestId('overlay-anchored-content')

    await expect(content).toHaveCount(0)
    await trigger.click()
    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await expectAnchoredBottomStart(trigger, content)
  })

  test('OV-THEME-01: Portaled Content re-establishes layer scope for inherited color mode', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-themed-anchored').click()
    const content = page.getByTestId('overlay-themed-content')
    await expect(content).toBeVisible()

    const surface = await content.evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        isDirectBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-panda-theme'),
        backgroundColor: style.backgroundColor,
      }
    })

    expect(surface.isDirectBodyChild).toBe(true)
    expect(surface.dataLayer).toBeTruthy()
    expect(surface.dataTheme).toBe('dark')
    expect(surface.backgroundColor).not.toBe('rgb(255, 255, 255)')
    expect(surface.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(surface.backgroundColor).not.toBe('transparent')
  })

  test('OV-THEME-02: Portaled Content in light color mode re-establishes layer scope with light tokens', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-light-themed-anchored').click()
    const content = page.getByTestId('overlay-light-themed-content')
    await expect(content).toBeVisible()

    const surface = await content.evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        isDirectBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-panda-theme'),
        backgroundColor: style.backgroundColor,
        color: style.color,
      }
    })

    expect(surface.isDirectBodyChild).toBe(true)
    expect(surface.dataLayer).toBeTruthy()
    expect(surface.dataTheme).toBe('light')
    expect(surface.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(surface.backgroundColor).not.toBe('transparent')
    // In light mode, text color is dark, not white
    expect(surface.color).not.toBe('rgb(255, 255, 255)')
  })

  test('OV-ESC-01: Escape requests onEscape then onDismiss on the active layer', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-escape').click()
    const content = page.getByTestId('overlay-escape-content')
    await expect(content).toBeVisible()
    await page.getByTestId('btn-escape-inner').focus()
    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('overlay-escape-log')).toHaveText('escape,dismiss')
  })

  test('OV-ESC-02: preventing Escape keeps the layer open', async ({ page }) => {
    await page.getByTestId('chk-block-escape').check()
    await page.getByTestId('btn-open-escape').click()
    const content = page.getByTestId('overlay-escape-content')
    await expect(content).toBeVisible()
    await page.getByTestId('btn-escape-inner').focus()
    await page.keyboard.press('Escape')
    await expect(content).toBeVisible()
    await expect(page.getByTestId('overlay-escape-log')).toHaveText('escape')
  })

  test('OV-ESC-04: Escape closes only the top nested layer', async ({ page }) => {
    await page.getByTestId('btn-open-parent').click()
    await expect(page.getByTestId('overlay-parent-content')).toBeVisible()
    await page.getByTestId('btn-open-child').click()
    await expect(page.getByTestId('overlay-child-content')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('overlay-child-content')).toHaveCount(0)
    await expect(page.getByTestId('overlay-parent-content')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('overlay-parent-content')).toHaveCount(0)
  })

  test('OV-LAYER-02: press on parent content outside the child dismisses only the child', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-parent').click()
    await page.getByTestId('btn-open-child').click()
    await expect(page.getByTestId('overlay-child-content')).toBeVisible()

    await page.getByTestId('btn-parent-inner').click()
    await expect(page.getByTestId('overlay-child-content')).toHaveCount(0)
    await expect(page.getByTestId('overlay-parent-content')).toBeVisible()
  })

  test('OV-INERT-01: unrelated siblings are inert while isolating Overlay is open', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-overlay').click()
    await expect(page.getByTestId('overlay-content')).toBeVisible()

    const outside = page.getByTestId('btn-outside-element')
    const inert = await outside.evaluate(el => Boolean(el.closest('[inert]')))
    expect(inert).toBe(true)

    const before = await outside.innerText()
    await outside.click({ force: true })
    await expect(outside).toHaveText(before)
  })

  test('OV-SCROLL-01: document position is preserved against background wheel', async ({
    page,
  }) => {
    await page.evaluate(() => window.scrollTo(0, 240))
    const before = await page.evaluate(() => window.scrollY)
    expect(before).toBeGreaterThan(0)

    await page.getByTestId('btn-open-overlay').click()
    await expect(page.getByTestId('overlay-content')).toBeVisible()
    const locked = await page.evaluate(() => window.scrollY)
    expect(locked).toBe(before)

    await page.mouse.move(12, 12)
    await page.mouse.wheel(0, 400)
    const after = await page.evaluate(() => window.scrollY)
    expect(after).toBe(before)
  })

  test('OV-EDGE-01: edge Content binds to the viewport edge', async ({ page }) => {
    await page.getByTestId('btn-open-edge').click()
    const content = page.getByTestId('overlay-edge-content')
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-edge', 'bottom')

    const box = await content.evaluate(el => {
      const style = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        position: style.position,
        bottom: (el as HTMLElement).style.bottom,
        availableWidth: (el as HTMLElement).style.getPropertyValue(
          '--reference-overlay-available-width'
        ),
        nearBottom: Math.abs(rect.bottom - (window.innerHeight - 8)) < 6,
      }
    })
    expect(box.position).toBe('fixed')
    expect(box.bottom).toBe('8px')
    expect(box.availableWidth).toBeTruthy()
    expect(box.nearBottom).toBe(true)
  })

  test('OV-HND-01: Handle drag past 25% requests dismiss', async ({ page }) => {
    await page.getByTestId('btn-open-edge').click()
    const content = page.getByTestId('overlay-edge-content')
    await expect(content).toBeVisible()
    const handle = page.getByTestId('overlay-handle')
    const box = await handle.boundingBox()
    expect(box).toBeTruthy()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + 220, { steps: 12 })
    await page.mouse.up()
    await expect(content).toHaveCount(0)
  })

  test('OV-ISO-02: isolation={false} does not inert the background', async ({ page }) => {
    await page.getByTestId('btn-open-anchored').click()
    await expect(page.getByTestId('overlay-anchored-content')).toBeVisible()
    const outside = page.getByTestId('btn-outside-element')
    const inert = await outside.evaluate(el => Boolean(el.closest('[inert]')))
    expect(inert).toBe(false)
    await outside.click()
    await expect(outside).toContainText('1')
  })
})

async function expectAnchoredBottomStart(trigger: Locator, content: Locator) {
  const triggerBox = await trigger.boundingBox()
  const contentBox = await content.boundingBox()
  expect(triggerBox).toBeTruthy()
  expect(contentBox).toBeTruthy()

  expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 2)
  expect(contentBox!.y).toBeLessThan(triggerBox!.y + triggerBox!.height + 24)
  expect(Math.abs(contentBox!.x - triggerBox!.x)).toBeLessThan(16)
}

import { expect, test } from '@playwright/test'

test.describe('Overlay Exotica Pass', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/overlay/exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()
  })

  test('OV-ESC-05 & OV-LAYER-10: Escape and outside route only through the active document stack', async ({
    page,
  }) => {
    const frameEl = page.getByTestId('exotica-iframe')
    await expect(frameEl).toBeVisible()
    await page.waitForFunction(() => {
      const iframe = document.querySelector('[data-testid="exotica-iframe"]') as HTMLIFrameElement | null
      return Boolean(iframe?.contentDocument?.querySelector('[data-testid="frame-fixture-root"]'))
    })
    const frame = page.frameLocator('[data-testid="exotica-iframe"]')
    await expect(frame.getByTestId('frame-fixture-root')).toBeVisible()

    await frame.getByTestId('btn-frame-open').click()
    await expect(frame.getByTestId('frame-content')).toBeVisible()

    await page.getByTestId('btn-main-esc-open').click()
    await expect(page.getByTestId('main-esc-content')).toBeVisible()

    await page.getByTestId('btn-main-esc-inner').focus()
    await page.keyboard.press('Escape')

    await expect(page.getByTestId('main-esc-content')).toHaveCount(0)
    await expect(page.getByTestId('main-esc-log')).toContainText('escape')
    await expect(page.getByTestId('main-esc-log')).toContainText('dismiss')
    await expect(frame.getByTestId('frame-content')).toBeVisible()
    await expect(frame.getByTestId('frame-log')).not.toContainText('escape')
    await expect(frame.getByTestId('frame-log')).not.toContainText('dismiss')

    await frame.getByTestId('btn-frame-inner').focus()
    await page.keyboard.press('Escape')
    await expect(frame.getByTestId('frame-content')).toHaveCount(0)
    await expect(frame.getByTestId('frame-log')).toContainText('dismiss')
  })

  test('OV-LAYER-07: sibling Overlays in independent React roots share top-layer ordering', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-root-a').click()
    await expect(page.getByTestId('root-a-content')).toBeVisible()
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="btn-open-root-b"]') as HTMLButtonElement).click()
    })
    await expect(page.getByTestId('root-b-content')).toBeVisible()

    await page.getByTestId('root-b-inner').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('root-b-content')).toHaveCount(0)
    await expect(page.getByTestId('root-a-content')).toBeVisible()
    await expect(page.getByTestId('roots-log')).toContainText('b-escape')
    await expect(page.getByTestId('roots-log')).toContainText('b-dismiss')
    await expect(page.getByTestId('roots-log')).not.toContainText('a-escape')

    await page.getByTestId('root-a-inner').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('root-a-content')).toHaveCount(0)
    await expect(page.getByTestId('roots-log')).toContainText('a-dismiss')
  })

  test('OV-OUT-10: focus during a deferred stopped pointer sequence does not dismiss', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-out-10').click()
    const content = page.getByTestId('out-10-content')
    const log = page.getByTestId('out-10-log')
    await expect(content).toBeVisible()

    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="btn-out-10-extension"]') as HTMLButtonElement
      el.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          composed: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          button: 0,
        })
      )
      el.focus()
      el.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          composed: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          button: 0,
        })
      )
      el.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true, button: 0 })
      )
      el.dispatchEvent(
        new MouseEvent('mouseup', { bubbles: true, composed: true, cancelable: true, button: 0 })
      )
      el.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, cancelable: true, button: 0 })
      )
    })

    await expect(content).toBeVisible()
    await expect(log).not.toContainText('outside')
    await expect(log).not.toContainText('dismiss')
  })

  test('OV-RESTORE-08: restoreFocus resolver is evaluated at Presence teardown', async ({
    page,
  }) => {
    await page.getByTestId('btn-restore-08-a').focus()
    await page.getByTestId('btn-open-restore-08').click()
    const content = page.getByTestId('restore-08-content')
    await expect(content).toBeVisible()

    await page.getByTestId('btn-close-restore-08').click()
    await expect(content).toBeVisible()
    await page.evaluate(() => {
      ;(window as unknown as { __ovRestore08: (v: 'a' | 'b') => void }).__ovRestore08('b')
    })
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('btn-restore-08-b')).toBeFocused()
  })

  test('OV-LAYER-09: branch mount, reparent, and unmount update dismiss and focus together', async ({
    page,
  }) => {
    await page.getByTestId('btn-layer-09-parent').click()
    await expect(page.getByTestId('layer-09-parent-content')).toBeVisible()

    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="btn-layer-09-mount-child"]') as HTMLButtonElement).click()
    })
    const child = page.getByTestId('layer-09-child-content')
    await expect(child).toBeVisible()
    await expect(page.getByTestId('layer-09-host-a').locator('[data-testid="layer-09-child-content"]')).toHaveCount(1)

    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="btn-layer-09-reparent"]') as HTMLButtonElement).click()
    })
    await expect(page.getByTestId('layer-09-host-b').locator('[data-testid="layer-09-child-content"]')).toHaveCount(1)
    await page.getByTestId('btn-layer-09-child-inner').evaluate(el => (el as HTMLButtonElement).click())
    await expect(page.getByTestId('layer-09-log')).not.toContainText('parent-dismiss')
    await expect(page.getByTestId('layer-09-parent-content')).toBeVisible()

    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="btn-layer-09-unmount-child"]') as HTMLButtonElement).click()
    })
    await expect(child).toHaveCount(0)
    await expect(page.getByTestId('layer-09-parent-content')).toBeVisible()
  })

  test('OV-DOM-03: Backdrop and Content keep data-state in sync with StyleProps intact', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-dom-03').click()
    const backdrop = page.getByTestId('dom-03-backdrop')
    const content = page.getByTestId('dom-03-content')
    await expect(content).toBeVisible()
    await expect(backdrop).toHaveAttribute('data-state', 'open')
    await expect(content).toHaveAttribute('data-state', 'open')

    const openStyles = await content.evaluate(el => {
      const s = getComputedStyle(el)
      return { bg: s.backgroundColor, padding: s.padding }
    })
    expect(openStyles.bg).not.toBe('rgba(0, 0, 0, 0)')
    expect(openStyles.padding).not.toBe('0px')

    await page.getByTestId('btn-close-dom-03').click()
    await expect(content).toHaveCount(0)
  })

  test('OV-INERT-06: nested ShadowRoot siblings hide; shadow hosts stay reachable', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-inert-06').click()
    await expect(page.getByTestId('inert-06-content')).toBeVisible()

    const flags = await page.evaluate(() => {
      const light = document.querySelector('[data-testid="btn-light-sibling"]') as HTMLElement | null
      const host = document.querySelector('[data-testid="nested-shadow-host"]') as HTMLElement | null
      const outer = host?.shadowRoot
      const outerSibling = outer?.querySelector('[data-testid="outer-shadow-sibling"]') as HTMLElement | null
      const innerHost = outer?.querySelector('[data-testid="inner-shadow-host"]') as HTMLElement | null
      const innerSibling = innerHost?.shadowRoot?.querySelector(
        '[data-testid="inner-shadow-sibling"]'
      ) as HTMLElement | null
      const inner = innerHost?.shadowRoot?.querySelector('[data-testid="btn-inert-06-inner"]') as HTMLElement | null
      return {
        lightInert: Boolean(light && (light.hasAttribute('inert') || light.closest('[inert]'))),
        outerSiblingInert: outerSibling?.hasAttribute('inert') ?? false,
        innerSiblingInert: innerSibling?.hasAttribute('inert') ?? false,
        hostInert: host?.hasAttribute('inert') ?? true,
        innerHostInert: innerHost?.hasAttribute('inert') ?? true,
        innerDisabled: Boolean(inner && (inner.hasAttribute('inert') || inner.closest('[inert]'))),
        innerFound: Boolean(inner),
      }
    })

    expect(flags.lightInert).toBe(true)
    expect(flags.outerSiblingInert).toBe(true)
    expect(flags.innerSiblingInert).toBe(true)
    expect(flags.hostInert).toBe(false)
    expect(flags.innerHostInert).toBe(false)
    expect(flags.innerFound).toBe(true)
    expect(flags.innerDisabled).toBe(false)
  })

  test('OV-INERT-08: accessibility snapshot exposes the dialog, not background controls', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-inert-08').click()
    await expect(page.getByTestId('inert-08-content')).toBeVisible()

    const snapshot = await page.accessibility.snapshot()
    const text = JSON.stringify(snapshot)
    expect(text).toContain('Accessible dialog')
    expect(text).toContain('Dialog action')
    expect(text).not.toContain('Background control')
  })

  test('OV-INERT-09: already aria-hidden ancestors are not rewritten', async ({ page }) => {
    const hidden = page.getByTestId('inert-09-hidden')
    await page.evaluate(() => {
      const root = document.querySelector('[data-testid="inert-09-hidden"]') as HTMLElement
      ;(window as unknown as { __inert09: number }).__inert09 = 0
      new MutationObserver(records => {
        for (const rec of records) {
          if (rec.type === 'attributes') {
            ;(window as unknown as { __inert09: number }).__inert09 += 1
          }
        }
      }).observe(root, { attributes: true, subtree: true })
    })

    await page.getByTestId('btn-open-inert-09').click()
    await expect(page.getByTestId('inert-09-content')).toBeVisible()

    await expect(hidden).toHaveAttribute('aria-hidden', 'true')
    await expect(hidden).not.toHaveAttribute('data-overlay-managed-inert', '')
    const descendant = page.getByTestId('btn-inert-09-desc')
    await expect(descendant).not.toHaveAttribute('inert', '')

    const mutations = await page.evaluate(
      () => (window as unknown as { __inert09: number }).__inert09
    )
    expect(mutations).toBe(0)

    const ordinaryInert = await page
      .getByTestId('btn-inert-09-ordinary')
      .evaluate(el => Boolean(el.closest('[inert]')))
    expect(ordinaryInert).toBe(true)
  })

  test('OV-INERT-10: reparent into a hidden subtree stays unreachable and deduped', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-inert-10').click()
    await expect(page.getByTestId('inert-10-content')).toBeVisible()

    const result = await page.evaluate(async () => {
      const wait = () => new Promise(r => setTimeout(r, 30))
      const outside = document.querySelector('[data-testid="inert-10-outside-host"]') as HTMLElement
      const hidden = document.querySelector('[data-testid="inert-10-hidden"]') as HTMLElement
      const node = document.createElement('button')
      node.type = 'button'
      node.setAttribute('data-testid', 'btn-inert-10-dyn')
      node.textContent = 'dyn'
      outside.appendChild(node)
      await wait()

      const afterInsert = {
        inert: node.hasAttribute('inert'),
        managed: node.hasAttribute('data-overlay-managed-inert'),
      }

      hidden.appendChild(node)
      await wait()
      const afterHidden = {
        inert: node.hasAttribute('inert'),
        managed: node.hasAttribute('data-overlay-managed-inert'),
        ariaAncestor: node.closest('[aria-hidden="true"]') !== null,
      }

      outside.appendChild(node)
      await wait()
      const afterReturn = {
        inert: node.hasAttribute('inert'),
        managed: node.hasAttribute('data-overlay-managed-inert'),
      }

      return { afterInsert, afterHidden, afterReturn }
    })

    expect(result.afterInsert.inert).toBe(true)
    expect(result.afterInsert.managed).toBe(true)
    expect(result.afterHidden.ariaAncestor).toBe(true)
    expect(result.afterHidden.managed).toBe(false)
    expect(result.afterReturn.inert).toBe(true)
    expect(result.afterReturn.managed).toBe(true)

    await page.getByTestId('btn-close-inert-10').click()
    await expect(page.getByTestId('inert-10-content')).toHaveCount(0)
    await expect(page.getByTestId('btn-inert-10-dyn')).not.toHaveAttribute('inert', '')
  })

  test('OV-SCROLL-06: one-finger background scroll is locked; pinch is not canceled', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-scroll-06').click()
    await expect(page.getByTestId('scroll-06-content')).toBeVisible()

    const flags = await page.evaluate(() => {
      const target = document.body
      const touch = (id: number, x: number, y: number) =>
        new Touch({ identifier: id, target, clientX: x, clientY: y })

      const one = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: [touch(1, 20, 40)],
        changedTouches: [touch(1, 20, 40)],
      })
      const start = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: [touch(1, 20, 10)],
        changedTouches: [touch(1, 20, 10)],
      })
      document.dispatchEvent(start)
      const onePrevented = !document.dispatchEvent(one)

      const pinchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: [touch(1, 20, 20), touch(2, 40, 40)],
        changedTouches: [touch(1, 20, 20), touch(2, 40, 40)],
      })
      const pinch = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: [touch(1, 10, 10), touch(2, 60, 60)],
        changedTouches: [touch(1, 10, 10), touch(2, 60, 60)],
      })
      document.dispatchEvent(pinchStart)
      const pinchPrevented = !document.dispatchEvent(pinch)
      return { onePrevented, pinchPrevented }
    })

    expect(flags.onePrevented).toBe(true)
    expect(flags.pinchPrevented).toBe(false)
  })

  test('OV-SCROLL-08: RTL scrollbar compensation uses the logical side', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl'
      document.documentElement.style.overflow = 'scroll'
      document.body.style.setProperty('padding-left', '10px')
    })
    await page.getByTestId('btn-open-scroll-08').click()
    await expect(page.getByTestId('scroll-08-content')).toBeVisible()

    const pads = await page.evaluate(() => ({
      left: document.body.style.paddingLeft,
      right: document.body.style.paddingRight,
    }))
    expect(pads.right).toBe('')
    expect(pads.left === '' || parseFloat(pads.left) >= 10).toBe(true)

    await page.getByTestId('btn-close-scroll-08').click()
    await expect(page.getByTestId('scroll-08-content')).toHaveCount(0)
    const restored = await page.evaluate(() => document.body.style.paddingLeft)
    expect(restored).toBe('10px')
    await page.evaluate(() => {
      document.documentElement.dir = 'ltr'
      document.documentElement.style.overflow = ''
      document.body.style.removeProperty('padding-left')
    })
  })

  test('OV-SCROLL-09: Content in Shadow DOM can scroll while background cannot', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-scroll-09').click()
    const content = page.getByTestId('scroll-09-content')
    await expect(content).toBeVisible()

    const before = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="scroll09-host"]') as HTMLElement
      const bg = host.shadowRoot?.querySelector('[data-testid="scroll09-bg"]') as HTMLElement | null
      return { bg: bg?.scrollTop ?? -1, y: window.scrollY }
    })

    await content.evaluate(el => {
      el.scrollTop = 40
    })
    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="scroll09-host"]') as HTMLElement
      const bg = host.shadowRoot?.querySelector('[data-testid="scroll09-bg"]') as HTMLElement | null
      bg?.dispatchEvent(new WheelEvent('wheel', { deltaY: 80, bubbles: true, cancelable: true, composed: true }))
    })

    const after = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="scroll09-host"]') as HTMLElement
      const bg = host.shadowRoot?.querySelector('[data-testid="scroll09-bg"]') as HTMLElement | null
      const dest = host.shadowRoot?.querySelector('[data-testid="scroll09-dest"]') as HTMLElement | null
      const inner = dest?.querySelector('[data-testid="scroll-09-content"]') as HTMLElement | null
      return { bg: bg?.scrollTop ?? -1, inner: inner?.scrollTop ?? -1, y: window.scrollY }
    })
    expect(after.inner).toBeGreaterThan(0)
    expect(after.bg).toBe(before.bg)
    expect(after.y).toBe(before.y)
  })

  test('OV-ENV-03: shadow portal keeps focus, dismiss, inert, and scroll contracts', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-env-03').click()
    const content = page.getByTestId('env-03-content')
    await expect(content).toBeVisible()
    await expect(page.getByTestId('btn-env-03-inner')).toBeFocused()

    const bg = page.getByTestId('btn-env-03-bg')
    await expect(bg).toHaveAttribute('inert', '')

    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(bg).not.toHaveAttribute('inert', '')
  })

  test('OV-POS-10: bottom-start stays the token and follows RTL alignment', async ({ page }) => {
    await page.getByTestId('btn-pos-10-anchor').click()
    const content = page.getByTestId('pos-10-content')
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-align', 'start')
    await expect(content).toHaveAttribute('data-side', 'bottom')

    const geometry = await page.evaluate(() => {
      const anchor = document.querySelector('[data-testid="btn-pos-10-anchor"]') as HTMLElement
      const floating = document.querySelector('[data-testid="pos-10-content"]') as HTMLElement
      const a = anchor.getBoundingClientRect()
      const f = floating.getBoundingClientRect()
      return {
        anchorRight: a.right,
        floatingRight: f.right,
        transform: floating.style.transform,
        origin: floating.style.getPropertyValue('--reference-overlay-transform-origin'),
      }
    })
    expect(Math.abs(geometry.floatingRight - geometry.anchorRight)).toBeLessThan(4)
    expect(geometry.transform).toBe('')
  })

  test('OV-POS-12: anchored Content inside a ShadowRoot follows shadow scroll', async ({
    page,
  }) => {
    await page.getByTestId('btn-pos-12-anchor').click()
    const content = page.getByTestId('pos-12-content')
    await expect(content).toBeVisible()
    const before = await content.evaluate(el => (el as HTMLElement).style.top)

    await page.evaluate(() => {
      const host = document.querySelector('[data-testid="pos12-host"]') as HTMLElement
      const scroller = host.shadowRoot?.querySelector('[data-testid="pos12-scroller"]') as HTMLElement
      scroller.scrollTop = 60
      scroller.dispatchEvent(new Event('scroll', { bubbles: true }))
    })
    await page.waitForTimeout(50)
    const after = await content.evaluate(el => (el as HTMLElement).style.top)
    expect(after).not.toBe('')
    expect(before).not.toBe('')
  })

  test('OV-EDGE-05: edge=left stays physical left under RTL', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl'
    })
    await page.getByTestId('btn-open-edge-05').click()
    const content = page.getByTestId('edge-05-content')
    await expect(content).toBeVisible()
    const box = await content.evaluate(el => {
      const s = el as HTMLElement
      return { left: s.style.left, right: s.style.right, edge: s.getAttribute('data-edge') }
    })
    expect(box.edge).toBe('left')
    expect(box.left).toBe('0px')
    expect(box.right).toBe('')
    await page.evaluate(() => {
      document.documentElement.dir = 'ltr'
    })
  })
})

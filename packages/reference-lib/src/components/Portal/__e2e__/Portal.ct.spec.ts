import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Portal Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Portal/Portal/Fixture')
    await expect(page.getByTestId('portal-fixture-root')).toBeVisible()
  })

  test('PT-DOM-01 & PT-CONTAINER-04: Places children directly in document.body when container is omitted or null', async ({
    page,
  }) => {
    const bodyNode = page.getByTestId('body-portalled-node')
    const nullNode = page.getByTestId('explicit-null-portalled-node')

    await expect(bodyNode).toBeVisible()
    await expect(nullNode).toBeVisible()
    await snap(page, 'portal-body-and-null-resting')

    // Assert they are children of body and not inside logical-parent
    const isInLogicalParent = await page
      .getByTestId('logical-parent')
      .locator('[data-testid="body-portalled-node"]')
      .count()
    expect(isInLogicalParent).toBe(0)
  })

  test('PT-DOM-03 & PT-CONTAINER-01: Relocates children into the resolved custom destination ref', async ({
    page,
  }) => {
    const container = page.getByTestId('custom-destination-container')
    const btn = container.getByTestId('context-and-event-btn')

    await expect(btn).toBeVisible()
    await snap(page, 'portal-custom-destination')
  })

  test('PT-CONTAINER-02: Waits for late-resolved object ref without transient default body copy', async ({
    page,
  }) => {
    // Before resolving target, node should not exist in DOM
    const refNode = page.getByTestId('ref-portalled-node')
    await expect(refNode).toHaveCount(0)

    // Resolve target
    await page.getByTestId('btn-resolve-target').click()

    // Target is now mounted, child should appear inside it
    const resolvedContainer = page.getByTestId('dynamic-resolved-container')
    await expect(resolvedContainer.getByTestId('ref-portalled-node')).toBeVisible()
    await snap(page, 'portal-dynamic-resolved')
  })

  test('PT-CONTAINER-05: Moves subtree when resolved destination changes', async ({
    page,
  }) => {
    const targetA = page.getByTestId('target-a')
    const targetB = page.getByTestId('target-b')

    await expect(targetA.getByTestId('switchable-portalled-node')).toBeVisible()
    await expect(targetB.getByTestId('switchable-portalled-node')).toHaveCount(0)
    await snap(page, 'portal-destination-target-a')

    // Switch to target B
    await page.getByTestId('btn-switch-destination').click()

    await expect(targetA.getByTestId('switchable-portalled-node')).toHaveCount(0)
    await expect(targetB.getByTestId('switchable-portalled-node')).toBeVisible()
    await snap(page, 'portal-destination-target-b')
  })

  test('PT-REACT-01 & PT-REACT-02: Preserves logical context and bubbles React events to logical parent', async ({
    page,
  }) => {
    const btn = page.getByTestId('context-and-event-btn')
    await expect(btn).toHaveAttribute('data-context-val', 'logical-provider-value')

    const parentClickCount = page.getByTestId('parent-click-count')
    await expect(parentClickCount).toHaveText('0')

    await btn.click()

    // Clicking the portalled button bubbles React event to logical parent
    await expect(parentClickCount).toHaveText('1')
    await snap(page, 'portal-event-bubbled')
  })

  test('PT-THEME-01: Bare Portal under dark scope emits data-layer and data-color-mode="dark" on first primitive', async ({
    page,
  }) => {
    const node = page.getByTestId('portal-theme-dark-node')
    await expect(node).toBeVisible()

    const surface = await node.evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        isDirectBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-color-mode'),
        backgroundColor: style.backgroundColor,
        color: style.color,
      }
    })

    expect(surface.isDirectBodyChild).toBe(true)
    expect(surface.dataLayer).toBeTruthy()
    expect(surface.dataTheme).toBe('dark')
    // In dark mode: background should not be white or transparent
    expect(surface.backgroundColor).not.toBe('rgb(255, 255, 255)')
    expect(surface.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(surface.backgroundColor).not.toBe('transparent')
    await snap(page, 'portal-theme-dark')
  })

  test('PT-THEME-02: Bare Portal in light mode emits data-layer and data-color-mode="light", resolves light tokens without dark default', async ({
    page,
  }) => {
    const node = page.getByTestId('portal-theme-light-node')
    await expect(node).toBeVisible()

    const surface = await node.evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        isDirectBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-color-mode'),
        backgroundColor: style.backgroundColor,
        color: style.color,
      }
    })

    expect(surface.isDirectBodyChild).toBe(true)
    expect(surface.dataLayer).toBeTruthy()
    expect(surface.dataTheme).toBe('light')
    expect(surface.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(surface.backgroundColor).not.toBe('transparent')
    // In light mode, text color is dark, NOT white
    expect(surface.color).not.toBe('rgb(255, 255, 255)')
    await snap(page, 'portal-theme-light')
  })

  test('PT-THEME-03: Nested Portal under dark overlay inherits dark from context and re-emits data-layer', async ({
    page,
  }) => {
    const outer = page.getByTestId('portal-nested-outer')
    const inner = page.getByTestId('portal-nested-inner')

    await expect(outer).toBeVisible()
    await expect(inner).toBeVisible()

    const outerSurface = await outer.evaluate(el => ({
      isDirectBodyChild: el.parentElement === document.body,
      dataLayer: el.getAttribute('data-layer'),
      dataTheme: el.getAttribute('data-color-mode'),
    }))

    const innerSurface = await inner.evaluate(el => ({
      isDirectBodyChild: el.parentElement === document.body,
      dataLayer: el.getAttribute('data-layer'),
      dataTheme: el.getAttribute('data-color-mode'),
    }))

    expect(outerSurface.isDirectBodyChild).toBe(true)
    expect(outerSurface.dataLayer).toBeTruthy()
    expect(outerSurface.dataTheme).toBe('dark')

    expect(innerSurface.isDirectBodyChild).toBe(true)
    expect(innerSurface.dataLayer).toBeTruthy()
    expect(innerSurface.dataTheme).toBe('dark')
    await snap(page, 'portal-nested-dark')
  })

  test('PT-THEME-04: Document-only data-color-mode on ownerDocument stamps first primitive without React context', async ({
    page,
  }) => {
    // Set data-color-mode on documentElement directly (no React context override)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-color-mode', 'dark')
    })

    await page.getByTestId('btn-mount-doc-only').click()
    const node = page.getByTestId('portal-doc-only-node')
    await expect(node).toBeVisible()

    const surface = await node.evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        isDirectBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-color-mode'),
        backgroundColor: style.backgroundColor,
      }
    })

    expect(surface.isDirectBodyChild).toBe(true)
    expect(surface.dataLayer).toBeTruthy()
    expect(surface.dataTheme).toBe('dark')
    expect(surface.backgroundColor).not.toBe('rgb(255, 255, 255)')
    await snap(page, 'portal-doc-only-dark')

    // Clean up documentElement attribute
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-color-mode')
    })
  })

  test('PT-THEME-05: Island inside light app preserves dark colorMode when portaled', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-island-portal').click()
    const content = page.getByTestId('portal-island-content')
    await expect(content).toBeVisible()

    const surface = await content.evaluate(el => {
      const style = window.getComputedStyle(el)
      return {
        isDirectBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-color-mode'),
        backgroundColor: style.backgroundColor,
      }
    })

    expect(surface.isDirectBodyChild).toBe(true)
    expect(surface.dataLayer).toBeTruthy()
    expect(surface.dataTheme).toBe('dark')
    expect(surface.backgroundColor).not.toBe('rgb(255, 255, 255)')
    await snap(page, 'portal-island-dark')
  })

  test('PT-THEME-06: Root theme toggle updates portaled surface live without remounting', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-live-portal').click()
    const content = page.getByTestId('portal-live-content')
    await expect(content).toBeVisible()

    // Initially light
    expect(await content.getAttribute('data-color-mode')).toBe('light')
    await snap(page, 'portal-live-light')

    // Attach a marker attribute to ensure the node is NOT remounted when theme updates
    await content.evaluate(el => {
      el.setAttribute('data-preserved-instance', 'true')
    })

    // Toggle theme to dark on the root primitive
    await page.getByTestId('btn-toggle-live-root-theme').click()

    // Assert live update to dark without remount
    await expect(content).toHaveAttribute('data-color-mode', 'dark')
    expect(await content.getAttribute('data-preserved-instance')).toBe('true')
    await snap(page, 'portal-live-toggled-dark')
  })
})

test.describe('Portal ShadowRoot event contract (FEATURES #1, PORTAL-OWNS)', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Portal/Portal/ShadowFixture')
    await expect(page.getByTestId('portal-shadow-fixture-root')).toBeVisible()
  })

  test('PT-ENV-03: ShadowRoot destination resolves after attach with no transient body copy', async ({
    page,
  }) => {
    // Before attach: none of the portalled nodes exist anywhere — and in
    // particular no transient body copy (the fixture chrome itself lives in
    // light DOM by design, so only portalled testids are scanned).
    for (const id of ['portal-shadow-btn', 'portal-shadow-sibling', 'portal-shadow-switch-btn']) {
      await expect(page.getByTestId(id)).toHaveCount(0)
    }
    expect(
      await page.evaluate(
        () =>
          document.body.querySelectorAll(
            '[data-testid="portal-shadow-btn"],[data-testid="portal-shadow-sibling"],[data-testid="portal-shadow-switch-btn"]'
          ).length
      )
    ).toBe(0)

    await page.getByTestId('btn-shadow-attach').click()

    // After attach: exactly one copy, inside the shadow root only.
    const btn = page.getByTestId('portal-shadow-btn')
    await expect(btn).toBeVisible()
    expect(
      await page.evaluate(() => !!document.querySelector('[data-testid="portal-shadow-btn"]'))
    ).toBe(false)
    const copies = await page
      .getByTestId('portal-shadow-host')
      .evaluate(el => el.shadowRoot?.querySelectorAll('[data-testid="portal-shadow-btn"]').length ?? -1)
    expect(copies).toBe(1)
  })

  test('PT-DOM-05: Children land directly inside the open ShadowRoot destination', async ({
    page,
  }) => {
    await page.getByTestId('btn-shadow-attach').click()
    const host = page.getByTestId('portal-shadow-host')
    await expect(page.getByTestId('portal-shadow-btn')).toBeVisible()

    const placement = await host.evaluate(el => {
      const root = el.shadowRoot
      if (!root) return null
      const kids = Array.from(root.children).map(n => n.getAttribute('data-testid'))
      return {
        kids,
        btnParentIsRoot: root.querySelector('[data-testid="portal-shadow-btn"]')?.parentNode === root,
        siblingParentIsRoot:
          root.querySelector('[data-testid="portal-shadow-sibling"]')?.parentNode === root,
      }
    })
    expect(placement).not.toBeNull()
    // Direct shadow children in authored order, no wrapper.
    expect(placement!.kids).toEqual(['portal-shadow-btn', 'portal-shadow-sibling'])
    expect(placement!.btnParentIsRoot).toBe(true)
    expect(placement!.siblingParentIsRoot).toBe(true)
    expect(
      await page.evaluate(() => !!document.querySelector('[data-testid="portal-shadow-sibling"]'))
    ).toBe(false)
  })

  test('PT-COMP-03: Shadow composition preserves context and one logical React event sequence', async ({
    page,
  }) => {
    await page.getByTestId('btn-shadow-attach').click()
    const btn = page.getByTestId('portal-shadow-btn')
    const host = page.getByTestId('portal-shadow-host')

    // Logical context crosses into the shadow destination.
    await expect(btn).toHaveAttribute('data-context-val', 'logical-provider-value')

    // Content handler fires exactly once, then the logical parent. The parent
    // entry repeats: React dispatches shadow-portal events twice — once with
    // the true target at the portal-container listener, once retargeted to the
    // host at the root-container listener. Portal owns delivery (content: once,
    // in order) and documents the ancestor duplicate; it must NOT suppress the
    // composed propagation, which outside-press and Escape contracts rely on.
    await btn.click()
    await expect(page.getByTestId('portal-shadow-click-log')).toHaveText(
      'child,logical-parent,logical-parent'
    )

    // Keyboard delivery: Enter on the shadow button fires React onKeyDown once.
    await btn.focus()
    await expect
      .poll(() =>
        host.evaluate(
          el => (el.shadowRoot?.activeElement as HTMLElement | null)?.getAttribute('data-testid')
        )
      )
      .toBe('portal-shadow-btn')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('portal-shadow-key-log')).toHaveText('child-enter')

    // Removal empties the shadow root completely.
    await page.getByTestId('btn-shadow-unmount').click()
    await expect(btn).toHaveCount(0)
    expect(await host.evaluate(el => el.shadowRoot?.childElementCount ?? -1)).toBe(0)
  })

  test('PT-SHADOW-01: Switching destination into a ShadowRoot keeps React events firing', async ({
    page,
  }) => {
    await page.getByTestId('btn-shadow-attach').click()
    const switchBtn = page.getByTestId('portal-shadow-switch-btn')
    const switchLog = page.getByTestId('portal-shadow-switch-log')
    const host = page.getByTestId('portal-shadow-host-b')

    // Light-destination baseline: one child + one logical-parent call.
    await expect(
      page.getByTestId('portal-shadow-target-a').getByTestId('portal-shadow-switch-btn')
    ).toBeVisible()
    await switchBtn.click()
    await expect(switchLog).toHaveText('child,logical-parent')

    // Switch into the shadow destination.
    await page.getByTestId('btn-shadow-switch').click()
    expect(
      await host.evaluate(
        el =>
          !!el.shadowRoot
            ?.querySelector('#portal-shadow-target-b [data-testid="portal-shadow-switch-btn"]')
      )
    ).toBe(true)
    expect(
      await page.evaluate(
        () => !!document.querySelector('[data-testid="portal-shadow-switch-btn"]')
      )
    ).toBe(false)

    // The same logical event sequence survives the move into shadow.
    await switchBtn.click()
    await expect(switchLog).toHaveText('child,logical-parent,child,logical-parent')
  })
})

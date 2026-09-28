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

test.describe('Portal catalog coverage (CT re-target, no matrix on this branch)', () => {
  // Per-test page-error capture for PT-DOM-06. Listeners attach before mount
  // (addInitScript is too late: the gallery page is already open). Fresh page
  // per test, so no accumulation across specs.
  let pageErrors: string[] = []

  test.beforeEach(async ({ mount, page }) => {
    pageErrors = []
    page.on('pageerror', e => {
      pageErrors.push(`pageerror:${e.message}`)
    })
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push(`console:${msg.text()}`)
    })
    await mount('components/Portal/Portal/CoverageFixture')
    await expect(page.getByTestId('coverage-fixture-root')).toBeVisible()
  })

  test('PT-DOM-02: Mixed children keep text, nesting, and sibling order at the destination', async ({
    page,
  }) => {
    const dest = page.getByTestId('coverage-mixed-dest')
    await expect(dest.getByTestId('coverage-mixed-app')).toBeVisible()

    // Same text and element nodes, same order, only the DOM parent changed.
    const shape = await dest.evaluate(el =>
      Array.from(el.childNodes).map(n =>
        n.nodeType === 3
          ? `text:${n.textContent}`
          : `${(n as Element).tagName}:${(n as Element).getAttribute('data-testid')}`
      )
    )
    expect(shape).toEqual(['text:mixed-leading-text', 'DIV:coverage-mixed-app'])
    await expect(dest.getByTestId('coverage-mixed-descendant')).toHaveText('descendant')

    // Absent from the logical parent: no added host, no in-place copy.
    expect(
      await page
        .getByTestId('coverage-logical-parent')
        .locator('[data-testid="coverage-mixed-app"],[data-testid="coverage-mixed-descendant"]')
        .count()
    ).toBe(0)
  })

  test('PT-DOM-04: Detached fragment destination retains children, then reveals the same nodes on attach', async ({
    page,
  }) => {
    // Pre-attach: the fragment owns both children in order; the document has none.
    const pre = await page.evaluate(() => {
      const frag = (window as unknown as { __coverageDetached: DocumentFragment })
        .__coverageDetached
      return {
        kids: Array.from(frag.children).map(e => e.getAttribute('data-testid')),
        parentIsFrag:
          frag.querySelector('[data-testid="coverage-frag-a"]')?.parentNode === frag,
        inDoc: !!document.querySelector('[data-testid="coverage-frag-a"]'),
      }
    })
    expect(pre.kids).toEqual(['coverage-frag-a', 'coverage-frag-b'])
    expect(pre.parentIsFrag).toBe(true)
    expect(pre.inDoc).toBe(false)

    // Mark node A while detached: the attach must move it, never remount it.
    await page.evaluate(() => {
      const frag = (window as unknown as { __coverageDetached: DocumentFragment })
        .__coverageDetached
      frag
        .querySelector('[data-testid="coverage-frag-a"]')
        ?.setAttribute('data-same-node', 'true')
    })

    await page.getByTestId('btn-coverage-frag-attach').click()

    const host = page.getByTestId('coverage-frag-host')
    await expect(host.getByTestId('coverage-frag-a')).toBeVisible()
    const post = await host.evaluate(el => ({
      kids: Array.from(el.children).map(e => e.getAttribute('data-testid')),
      directA:
        el.querySelector('[data-testid="coverage-frag-a"]')?.parentElement === el,
      marker: el
        .querySelector('[data-testid="coverage-frag-a"]')
        ?.getAttribute('data-same-node'),
    }))
    expect(post.kids).toEqual(['coverage-frag-a', 'coverage-frag-b'])
    expect(post.directA).toBe(true)
    expect(post.marker).toBe('true')
  })

  test('PT-DOM-06: Null, false, and empty-fragment children add nothing and log no errors', async ({
    page,
  }) => {
    // Each destination keeps only its sentinel child.
    for (const id of [
      'coverage-empty-null-dest',
      'coverage-empty-false-dest',
      'coverage-empty-frag-dest',
    ]) {
      expect(await page.getByTestId(id).evaluate(el => el.childNodes.length)).toBe(1)
    }
    // No render or console error anywhere in the fixture lifecycle.
    expect(pageErrors).toEqual([])
  })

  test('PT-DOM-07: Keyed child updates in place; siblings add/remove singly; unmount leaves no orphans', async ({
    page,
  }) => {
    const dest = page.getByTestId('coverage-update-dest')
    const keyed = dest.getByTestId('coverage-update-keyed')
    await expect(keyed).toHaveText('v1')

    await keyed.evaluate(el => el.setAttribute('data-same-node', 'true'))
    await page.getByTestId('btn-coverage-update-text').click()
    await expect(keyed).toHaveText('v2')
    expect(await keyed.getAttribute('data-text')).toBe('v2')
    expect(await keyed.getAttribute('data-same-node')).toBe('true')

    await page.getByTestId('btn-coverage-add-sibling').click()
    await expect(dest.getByTestId('coverage-update-sibling')).toBeVisible()
    expect(await dest.evaluate(el => el.childElementCount)).toBe(2)

    await page.getByTestId('btn-coverage-remove-sibling').click()
    await expect(dest.getByTestId('coverage-update-sibling')).toHaveCount(0)
    expect(await dest.evaluate(el => el.childElementCount)).toBe(1)

    await page.getByTestId('btn-coverage-update-unmount').click()
    await expect(keyed).toHaveCount(0)
    expect(await dest.evaluate(el => el.childNodes.length)).toBe(0)
  })

  test('PT-COMP-01: Default-destination composition places, updates with context/events, and cleans up', async ({
    page,
  }) => {
    const ctx = page.getByTestId('coverage-comp1-ctx')
    const node = page.getByTestId('coverage-comp1-node')
    const btn = page.getByTestId('coverage-comp1-btn')
    await expect(ctx).toBeVisible()

    // Direct body placement with no wrapper, logical context intact.
    const placement = await node.evaluate(el => ({
      parentIsBody: el.parentElement === document.body,
      ctxVal: document
        .querySelector('[data-testid="coverage-comp1-ctx"]')
        ?.getAttribute('data-context-val'),
    }))
    expect(placement.parentIsBody).toBe(true)
    expect(placement.ctxVal).toBe('logical-provider-value')

    // Logical React events fire.
    await page.getByTestId('btn-coverage-comp1-update').click()
    await expect(node).toHaveText('beta')
    await expect(ctx).toHaveAttribute('data-context-val', 'logical-provider-value')
    await btn.click()
    await expect(page.getByTestId('coverage-comp1-clicks')).toHaveText('1')
    // No snap(): unstyled coverage chrome — the DOM assertions above are the proof.

    // Full cleanup: none of the three portalled nodes survives.
    await page.getByTestId('btn-coverage-comp1-unmount').click()
    for (const id of ['coverage-comp1-ctx', 'coverage-comp1-node', 'coverage-comp1-btn']) {
      await expect(page.getByTestId(id)).toHaveCount(0)
    }
  })

  test('PT-COMP-02: Scoped overlay root composition resolves late, inherits scope, and stays stable', async ({
    page,
  }) => {
    // Pre-resolve: nothing anywhere, no transient body copy.
    for (const id of ['coverage-scoped-styled', 'coverage-scoped-btn']) {
      await expect(page.getByTestId(id)).toHaveCount(0)
    }
    expect(
      await page.evaluate(
        () =>
          document.body.querySelectorAll(
            '[data-testid="coverage-scoped-styled"],[data-testid="coverage-scoped-btn"]'
          ).length
      )
    ).toBe(0)

    // Clear the COMP-01 body-level composition first: it paints over this
    // section's controls in the gallery's stacked viewports and would
    // otherwise intercept the mount click. (Control click via DOM dispatch;
    // the portalled button below keeps a real pointer click.)
    await page
      .getByTestId('btn-coverage-comp1-unmount')
      .evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('coverage-comp1-btn')).toHaveCount(0)

    await page.getByTestId('btn-coverage-scoped-mount').click()
    const root = page.getByTestId('coverage-scoped-root')
    await expect(root.getByTestId('coverage-scoped-btn')).toBeVisible()

    // One subtree in the scoped root; scoped styling inherited via DOM placement.
    expect(await root.evaluate(el => el.childElementCount)).toBe(2)
    expect(
      await page
        .getByTestId('coverage-scoped-styled')
        .evaluate(el => window.getComputedStyle(el).color)
    ).toBe('rgb(11, 22, 33)')
    await expect(page.getByTestId('coverage-scoped-styled')).toHaveAttribute(
      'data-context-val',
      'logical-provider-value'
    )

    // Logical React event bubbling.
    await page.getByTestId('coverage-scoped-btn').click()
    await expect(page.getByTestId('coverage-scoped-clicks')).toHaveText('1')
    // No snap(): unstyled coverage chrome — the DOM assertions above are the proof.

    // Unrelated parent state: stable subtree, no remount. The gallery mounts
    // in StrictMode (dev double-effects), so settle is relational — one live
    // subscription — and stability is capture-compare, not an absolute count.
    await expect
      .poll(async () => {
        const m = Number(await page.getByTestId('coverage-scoped-mounts').textContent())
        const c = Number(await page.getByTestId('coverage-scoped-cleanups').textContent())
        return m >= 1 && c === m - 1
      })
      .toBe(true)
    const mountsBefore = await page.getByTestId('coverage-scoped-mounts').textContent()
    await page
      .getByTestId('coverage-scoped-styled')
      .evaluate(el => el.setAttribute('data-same-node', 'true'))
    await page.getByTestId('btn-coverage-unrelated').click()
    await page.getByTestId('btn-coverage-unrelated').click()
    await expect(page.getByTestId('coverage-scoped-mounts')).toHaveText(mountsBefore ?? '1')
    expect(await page.getByTestId('coverage-scoped-styled').getAttribute('data-same-node')).toBe(
      'true'
    )
    expect(await root.evaluate(el => el.childElementCount)).toBe(2)
  })

  test('PT-ENV-04: Same-origin iframe destination owns placement, React events, and cleanup', async ({
    page,
  }) => {
    const frame = page.frameLocator('[data-testid="coverage-iframe"]')
    const btn = frame.getByTestId('coverage-iframe-btn')
    await expect(btn).toBeVisible()

    // Created only in the iframe target, owned by the iframe document.
    expect(
      await page.evaluate(() => !!document.querySelector('[data-testid="coverage-iframe-btn"]'))
    ).toBe(false)
    const placement = await page.evaluate(() => {
      const iframe = document.querySelector(
        '[data-testid="coverage-iframe"]'
      ) as HTMLIFrameElement
      const target = iframe.contentDocument?.getElementById('frame-target') ?? null
      return {
        parentOk:
          target?.querySelector('[data-testid="coverage-iframe-btn"]')?.parentElement ===
          target,
        ownerDocOk: target?.ownerDocument === iframe.contentDocument,
      }
    })
    expect(placement.parentOk).toBe(true)
    expect(placement.ownerDocOk).toBe(true)
    // StrictMode gallery: settle is one live subscription (cleanups = mounts - 1).
    await expect
      .poll(async () => {
        const m = Number(await page.getByTestId('coverage-iframe-mounts').textContent())
        const c = Number(await page.getByTestId('coverage-iframe-cleanups').textContent())
        return m >= 1 && c === m - 1
      })
      .toBe(true)
    const iframeMounts = Number(await page.getByTestId('coverage-iframe-mounts').textContent())

    // React bubbling reaches the outer logical ancestor exactly once.
    await btn.click()
    await expect(page.getByTestId('coverage-iframe-log')).toHaveText('child,logical-parent')

    // Unmount cleans refs/effects and DOM nodes from the iframe document.
    await page.getByTestId('btn-coverage-iframe-unmount').click()
    await expect(btn).toHaveCount(0)
    await expect(page.getByTestId('coverage-iframe-cleanups')).toHaveText(String(iframeMounts))
    expect(
      await page.evaluate(() => {
        const iframe = document.querySelector(
          '[data-testid="coverage-iframe"]'
        ) as HTMLIFrameElement
        return iframe.contentDocument?.getElementById('frame-target')?.childElementCount ?? -1
      })
    ).toBe(0)
  })
})

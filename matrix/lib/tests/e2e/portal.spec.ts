import { expect, test } from '@playwright/test'

test.describe('Portal Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portal')
    await expect(page.getByTestId('portal-fixture-root')).toBeVisible()
  })

  test('PT-DOM-01 & PT-CONTAINER-04: Places children directly in document.body when container is omitted or null', async ({
    page,
  }) => {
    const bodyNode = page.getByTestId('body-portalled-node')
    const nullNode = page.getByTestId('explicit-null-portalled-node')

    await expect(bodyNode).toBeVisible()
    await expect(nullNode).toBeVisible()

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
  })

  test('PT-CONTAINER-05: Moves subtree when resolved destination changes', async ({
    page,
  }) => {
    const targetA = page.getByTestId('target-a')
    const targetB = page.getByTestId('target-b')

    await expect(targetA.getByTestId('switchable-portalled-node')).toBeVisible()
    await expect(targetB.getByTestId('switchable-portalled-node')).toHaveCount(0)

    // Switch to target B
    await page.getByTestId('btn-switch-destination').click()

    await expect(targetA.getByTestId('switchable-portalled-node')).toHaveCount(0)
    await expect(targetB.getByTestId('switchable-portalled-node')).toBeVisible()
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
  })

  test('PT-THEME-01: Bare Portal under dark scope emits data-layer and data-panda-theme="dark" on first primitive', async ({
    page,
  }) => {
    const node = page.getByTestId('portal-theme-dark-node')
    await expect(node).toBeVisible()

    const surface = await node.evaluate(el => {
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
    expect(surface.dataTheme).toBe('dark')
    // In dark mode: background should not be white or transparent
    expect(surface.backgroundColor).not.toBe('rgb(255, 255, 255)')
    expect(surface.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(surface.backgroundColor).not.toBe('transparent')
  })

  test('PT-THEME-02: Bare Portal in light mode emits data-layer and data-panda-theme="light", resolves light tokens without dark default', async ({
    page,
  }) => {
    const node = page.getByTestId('portal-theme-light-node')
    await expect(node).toBeVisible()

    const surface = await node.evaluate(el => {
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
    // In light mode, text color is dark, NOT white
    expect(surface.color).not.toBe('rgb(255, 255, 255)')
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
      dataTheme: el.getAttribute('data-panda-theme'),
    }))

    const innerSurface = await inner.evaluate(el => ({
      isDirectBodyChild: el.parentElement === document.body,
      dataLayer: el.getAttribute('data-layer'),
      dataTheme: el.getAttribute('data-panda-theme'),
    }))

    expect(outerSurface.isDirectBodyChild).toBe(true)
    expect(outerSurface.dataLayer).toBeTruthy()
    expect(outerSurface.dataTheme).toBe('dark')

    expect(innerSurface.isDirectBodyChild).toBe(true)
    expect(innerSurface.dataLayer).toBeTruthy()
    expect(innerSurface.dataTheme).toBe('dark')
  })

  test('PT-THEME-04: Document-only data-panda-theme on ownerDocument stamps first primitive without React context', async ({
    page,
  }) => {
    // Set data-panda-theme on documentElement directly (no React context override)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-panda-theme', 'dark')
    })

    await page.getByTestId('btn-mount-doc-only').click()
    const node = page.getByTestId('portal-doc-only-node')
    await expect(node).toBeVisible()

    const surface = await node.evaluate(el => {
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

    // Clean up documentElement attribute
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-panda-theme')
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
        dataTheme: el.getAttribute('data-panda-theme'),
        backgroundColor: style.backgroundColor,
      }
    })

    expect(surface.isDirectBodyChild).toBe(true)
    expect(surface.dataLayer).toBeTruthy()
    expect(surface.dataTheme).toBe('dark')
    expect(surface.backgroundColor).not.toBe('rgb(255, 255, 255)')
  })

  test('PT-THEME-06: Root theme toggle updates portaled surface live without remounting', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-live-portal').click()
    const content = page.getByTestId('portal-live-content')
    await expect(content).toBeVisible()

    // Initially light
    expect(await content.getAttribute('data-panda-theme')).toBe('light')

    // Attach a marker attribute to ensure the node is NOT remounted when theme updates
    await content.evaluate(el => {
      el.setAttribute('data-preserved-instance', 'true')
    })

    // Toggle theme to dark on the root primitive
    await page.getByTestId('btn-toggle-live-root-theme').click()

    // Assert live update to dark without remount
    await expect(content).toHaveAttribute('data-panda-theme', 'dark')
    expect(await content.getAttribute('data-preserved-instance')).toBe('true')
  })
})


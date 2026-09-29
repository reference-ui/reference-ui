import { test, expect, snap, pressTab, isWebKit } from '../../../../playwright/ct'

test.describe('RovingFocus Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusFixture')
    await expect(page.getByTestId('roving-focus-fixture-root')).toBeVisible()
  })

  test('RF-TAB-01 & RF-TAB-02: Exposes one tabIndex=0 stop and moves in/out via Tab', async ({
    page,
  }) => {
    const outsideBefore = page.getByTestId('outside-before-btn')
    const outsideAfter = page.getByTestId('outside-after-btn')
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await outsideBefore.focus()
    await expect(outsideBefore).toBeFocused()
    await snap(page, 'outside-before-focused')

    // Tab into composite -> lands on first enabled item (Apple)
    await pressTab(page)
    await expect(apple).toBeFocused()
    await expect(apple).toHaveAttribute('tabindex', '0')
    await expect(blueberry).toHaveAttribute('tabindex', '-1')
    await expect(cherry).toHaveAttribute('tabindex', '-1')
    await snap(page, 'item-apple-focused')

    // Tab out of composite -> lands on outside after
    await pressTab(page)
    await expect(outsideAfter).toBeFocused()
    await snap(page, 'outside-after-focused')
  })

  test('RF-KEY-01 & RF-KEY-07: Moves between enabled items and skips disabled items', async ({
    page,
  }) => {
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await apple.focus()
    await expect(apple).toBeFocused()

    // ArrowRight -> skips disabled Banana -> focuses Blueberry
    await page.keyboard.press('ArrowRight')
    await expect(blueberry).toBeFocused()
    await expect(blueberry).toHaveAttribute('tabindex', '0')
    await expect(apple).toHaveAttribute('tabindex', '-1')
    await snap(page, 'item-blueberry-focused')

    // ArrowRight -> focuses Cherry
    await page.keyboard.press('ArrowRight')
    await expect(cherry).toBeFocused()
    await snap(page, 'item-cherry-focused')
  })

  test('RF-KEY-06: Loops around boundary when loop=true', async ({ page }) => {
    const apple = page.getByTestId('item-apple')
    const cherry = page.getByTestId('item-cherry')

    await cherry.focus()
    await expect(cherry).toBeFocused()

    // ArrowRight on last item -> wraps to first enabled item (Apple)
    await page.keyboard.press('ArrowRight')
    await expect(apple).toBeFocused()
    await snap(page, 'looped-forward-apple-focused')

    // ArrowLeft on first item -> wraps to last enabled item (Cherry)
    await page.keyboard.press('ArrowLeft')
    await expect(cherry).toBeFocused()
    await snap(page, 'looped-backward-cherry-focused')
  })

  test('RF-KEY-04: Home and End navigate to first and last enabled items', async ({
    page,
  }) => {
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await blueberry.focus()
    await expect(blueberry).toBeFocused()

    await page.keyboard.press('Home')
    await expect(apple).toBeFocused()
    await snap(page, 'home-key-apple-focused')

    await page.keyboard.press('End')
    await expect(cherry).toBeFocused()
    await snap(page, 'end-key-cherry-focused')
  })

  test('RF-TAB-04: Pointer press sets current without stealing focus; Tab re-enters on pressed item', async ({
    page,
  }) => {
    const outsideAfter = page.getByTestId('outside-after-btn')
    const apple = page.getByTestId('item-apple')
    const banana = page.getByTestId('item-banana')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await apple.focus()
    await expect(apple).toBeFocused()

    // Real click: browser moves focus AND currentness follows.
    await cherry.click()
    await expect(cherry).toBeFocused()
    await expect(cherry).toHaveAttribute('tabindex', '0')
    await expect(apple).toHaveAttribute('tabindex', '-1')

    // Pointer press that never moves DOM focus (touch / Safari-tap shape):
    // currentness-only, focus stays where it was.
    await blueberry.dispatchEvent('pointerdown')
    await expect(blueberry).toHaveAttribute('tabindex', '0')
    await expect(cherry).toHaveAttribute('tabindex', '-1')
    await expect(cherry).toBeFocused()

    // Disabled items never become current via press.
    await banana.dispatchEvent('pointerdown')
    await expect(banana).toHaveAttribute('tabindex', '-1')
    await expect(blueberry).toHaveAttribute('tabindex', '0')

    // Non-primary presses (right-click) never move the stop.
    await apple.dispatchEvent('pointerdown', { button: 2 })
    await expect(apple).toHaveAttribute('tabindex', '-1')
    await expect(blueberry).toHaveAttribute('tabindex', '0')

    // Tab out of the composite, then back in: re-entry lands on the pressed item.
    await pressTab(page)
    await expect(outsideAfter).toBeFocused()
    await pressTab(page, 'back')
    await expect(blueberry).toBeFocused()
  })

  test('RF-TYPE-02 & RF-TYPE-03: Typeahead matches item prefix and moves focus', async ({
    page,
  }) => {
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')

    await apple.focus()
    await expect(apple).toBeFocused()

    // Type 'bl' -> matches Blueberry
    await page.keyboard.press('b')
    await page.keyboard.press('l')

    await expect(blueberry).toBeFocused()
    await snap(page, 'typeahead-blueberry-focused')
  })
})

test.describe('RovingFocus Space typeahead guard (PATCHES #1)', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSpaceFixture')
    await expect(page.getByTestId('roving-focus-space-root')).toBeVisible()
  })

  test('RF-TYPE-06: Space with a nonempty buffer matches a space-containing label and activates nothing', async ({
    page,
  }) => {
    const blueberry = page.getByTestId('space-blueberry')
    const blueBerry = page.getByTestId('space-blue-berry')
    const count = page.getByTestId('space-activation-count')

    await blueberry.focus()
    await expect(blueberry).toBeFocused()
    await expect(count).toHaveText('0')

    // "blue" still prefixes the current item, so focus holds through here.
    for (const ch of ['b', 'l', 'u', 'e']) {
      await page.keyboard.press(ch)
    }
    await expect(blueberry).toBeFocused()

    // Space continues the search: buffer "blue " matches "Blue Berry" only.
    await page.keyboard.press('Space')
    await expect(blueBerry).toBeFocused()
    await expect(blueBerry).toHaveAttribute('tabindex', '0')
    await expect(blueberry).toHaveAttribute('tabindex', '-1')

    // Neither the original nor the matched button activated. Settle first:
    // a late native click must fail this, not slip past an instant assert.
    await page.waitForTimeout(200)
    await expect(count).toHaveText('0')
  })

  test('RF-TYPE-06 complement: Space with an empty buffer keeps native button activation', async ({
    page,
  }) => {
    const blueberry = page.getByTestId('space-blueberry')
    const count = page.getByTestId('space-activation-count')

    await blueberry.focus()
    await expect(blueberry).toBeFocused()

    // No buffer: Space is not typeahead input — the button activates natively.
    await page.keyboard.press('Space')
    await expect(count).toHaveText('1')
    await expect(blueberry).toBeFocused()
  })
})

test.describe('RovingFocus visual grid (FEATURES #1)', () => {
  test('RF-GRID-01: orientation=both follows visual rows and columns in a regular grid', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusGridFixture')
    await expect(page.getByTestId('roving-focus-grid-root')).toBeVisible()
    const cell = (i: number) => page.getByTestId(`grid-${i}`)

    await snap(page, 'grid-resting')
    for (const [key, target] of [
      ['ArrowRight', 5],
      ['ArrowLeft', 3],
      ['ArrowUp', 1],
      ['ArrowDown', 7],
    ] as const) {
      await cell(4).focus()
      await page.keyboard.press(key)
      await expect(cell(target)).toBeFocused()
      await expect(cell(target)).toHaveAttribute('tabindex', '0')
    }
    await snap(page, 'grid-center-down')
  })

  test('RF-GRID-02: vertical moves choose nearest center, ties break by DOM order', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusRaggedGridFixture')
    await expect(page.getByTestId('roving-focus-ragged-root')).toBeVisible()
    const m = page.getByTestId('rag-m')
    const l = page.getByTestId('rag-l')
    const w = page.getByTestId('rag-w')

    // M is exactly equidistant from L and R: DOM order decides.
    await m.focus()
    await page.keyboard.press('ArrowDown')
    await expect(l).toBeFocused()
    await snap(page, 'ragged-tie-down')

    await w.focus()
    await page.keyboard.press('ArrowUp')
    await expect(l).toBeFocused()
  })

  test('RF-GRID-03: grid arrows skip disabled cells for valid targets on the axis', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusRaggedGridFixture')
    await expect(page.getByTestId('roving-focus-ragged-root')).toBeVisible()
    const l = page.getByTestId('rag-l')
    const r = page.getByTestId('rag-r')
    const d = page.getByTestId('rag-d')
    const m = page.getByTestId('rag-m')

    await l.focus()
    await page.keyboard.press('ArrowRight')
    await expect(r).toBeFocused()

    await r.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(l).toBeFocused()

    // D is the geometrically nearest cell below M but disabled: L wins.
    await m.focus()
    await page.keyboard.press('ArrowDown')
    await expect(l).toBeFocused()
    await expect(d).toHaveAttribute('tabindex', '-1')
  })

  test('RF-GRID-04: grid focus stays at edges without loop', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusRaggedGridFixture')
    await expect(page.getByTestId('roving-focus-ragged-root')).toBeVisible()

    for (const [id, key] of [
      ['rag-m', 'ArrowUp'],
      ['rag-l', 'ArrowLeft'],
      ['rag-r', 'ArrowRight'],
      ['rag-w', 'ArrowDown'],
    ] as const) {
      const edge = page.getByTestId(id)
      await edge.focus()
      await page.keyboard.press(key)
      await expect(edge).toBeFocused()
      await expect(edge).toHaveAttribute('tabindex', '0')
    }
  })

  test('RF-GRID-05: grid wraps within geometry with loop', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusRaggedGridFixture', { loop: true })
    await expect(page.getByTestId('roving-focus-ragged-root')).toBeVisible()
    const m = page.getByTestId('rag-m')
    const l = page.getByTestId('rag-l')
    const r = page.getByTestId('rag-r')
    const w = page.getByTestId('rag-w')

    await r.focus()
    await page.keyboard.press('ArrowRight')
    await expect(l).toBeFocused()

    await l.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(r).toBeFocused()

    await w.focus()
    await page.keyboard.press('ArrowDown')
    await expect(m).toBeFocused()

    await m.focus()
    await page.keyboard.press('ArrowUp')
    await expect(w).toBeFocused()
  })

  test('RF-GRID-06: RTL reverses only the horizontal grid axis', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusGridFixture', { dir: 'rtl' })
    await expect(page.getByTestId('roving-focus-grid-root')).toBeVisible()
    const cell = (i: number) => page.getByTestId(`grid-${i}`)

    await cell(4).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(cell(5)).toBeFocused()

    await cell(4).focus()
    await page.keyboard.press('ArrowRight')
    await expect(cell(3)).toBeFocused()

    await cell(4).focus()
    await page.keyboard.press('ArrowUp')
    await expect(cell(1)).toBeFocused()

    await cell(4).focus()
    await page.keyboard.press('ArrowDown')
    await expect(cell(7)).toBeFocused()
  })

  test('RF-GRID-07: vertical moves follow post-reflow rectangles', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusReflowFixture', { loop: false })
    await expect(page.getByTestId('roving-focus-reflow-root')).toBeVisible()
    const cell = (i: number) => page.getByTestId(`flow-${i}`)

    await cell(0).focus()
    await page.keyboard.press('ArrowDown')
    await expect(cell(3)).toBeFocused()

    // Narrow through a ref write: no collection rerender, new wrapping.
    await page.getByTestId('reflow-narrow').click()
    await cell(0).focus()
    await page.keyboard.press('ArrowDown')
    await expect(cell(2)).toBeFocused()
    await expect(cell(2)).toHaveAttribute('tabindex', '0')
    await expect(cell(3)).toHaveAttribute('tabindex', '-1')
  })

  test('RF-GRID-08 & RF-KEY-12: Home/End/PageUp/PageDown are whole-composite in grids', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusGridFixture', {
      disabledEdges: true,
    })
    await expect(page.getByTestId('roving-focus-grid-root')).toBeVisible()
    const cell = (i: number) => page.getByTestId(`grid-${i}`)

    await cell(4).focus()
    await page.keyboard.press('Home')
    await expect(cell(1)).toBeFocused()

    await page.keyboard.press('End')
    await expect(cell(7)).toBeFocused()

    await page.keyboard.press('PageUp')
    await expect(cell(1)).toBeFocused()

    await page.keyboard.press('PageDown')
    await expect(cell(7)).toBeFocused()
  })
})

test.describe('RovingFocus one-dimensional keys', () => {
  test('RF-KEY-02: horizontal arrows reverse under inherited RTL', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', { dir: 'rtl' })
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const b = page.getByTestId('keys-b')
    const d = page.getByTestId('keys-d')

    await b.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(d).toBeFocused()

    await d.focus()
    await page.keyboard.press('ArrowRight')
    await expect(b).toBeFocused()

    await b.focus()
    await page.keyboard.press('ArrowUp')
    await expect(b).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(b).toBeFocused()
  })

  test('RF-KEY-03: vertical orientation uses only vertical arrows in LTR and RTL', async ({
    mount,
    page,
  }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', {
        orientation: 'vertical',
        dir,
      })
      await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
      const a = page.getByTestId('keys-a')
      const b = page.getByTestId('keys-b')
      const d = page.getByTestId('keys-d')

      await b.focus()
      await page.keyboard.press('ArrowDown')
      await expect(d).toBeFocused()

      await d.focus()
      await page.keyboard.press('ArrowUp')
      await expect(b).toBeFocused()

      await b.focus()
      await page.keyboard.press('ArrowLeft')
      await expect(b).toBeFocused()
      await expect(a).toHaveAttribute('tabindex', '-1')
      await page.keyboard.press('ArrowRight')
      await expect(b).toBeFocused()
    }
  })

  test('RF-KEY-05: one-dimensional boundaries hold without loop', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', { loop: false })
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const a = page.getByTestId('keys-a')
    const e = page.getByTestId('keys-e')

    await a.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(a).toBeFocused()
    await expect(a).toHaveAttribute('tabindex', '0')

    await e.focus()
    await page.keyboard.press('ArrowRight')
    await expect(e).toBeFocused()
    await expect(e).toHaveAttribute('tabindex', '0')
  })

  test('RF-KEY-08: consumer prevention stops movement, propagation stopping does not', async ({
    mount,
    page,
  }) => {
    // Repeat mounts are root updates (state persists), so unmount between
    // phases for true fresh-state runs.
    const first = await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', {
      cancelMode: 'prevent',
    })
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const b = page.getByTestId('keys-b')

    await b.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('keys-cancel-flag')).toHaveText('yes')
    await expect(b).toBeFocused()
    await expect(b).toHaveAttribute('tabindex', '0')
    await first.unmount()

    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', {
      cancelMode: 'stop',
    })
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const d = page.getByTestId('keys-d')

    await b.focus()
    await page.keyboard.press('ArrowRight')
    await expect(d).toBeFocused()
    await expect(d).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('keys-ancestor-count')).toHaveText('0')
  })

  test('RF-KEY-09: modified navigation keys preserve application shortcuts', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture')
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const b = page.getByTestId('keys-b')
    const count = page.getByTestId('keys-ancestor-count')

    await b.focus()
    let seen = 0
    // WK reserves Control/Meta+Arrow for browser nav (Control+ArrowLeft unloads
    // to about:blank, D7) — untestable in-browser; Alt proves the contract on WK.
    const mods = (['Alt', 'Control', 'Meta'] as const).filter(m => m === 'Alt' || !isWebKit(page))
    for (const mod of mods) {
      for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'] as const) {
        await page.keyboard.press(`${mod}+${key}`)
        await expect(b).toBeFocused()
        await expect(b).toHaveAttribute('tabindex', '0')
        // Each combo dispatches two keydowns (modifier + key); the consumer
        // ancestor receives both while the kernel consumes neither.
        seen += 2
        await expect(count).toHaveText(String(seen))
      }
    }
  })

  test('RF-KEY-10: dir changes apply without remounting', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', { dir: 'ltr' })
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const b = page.getByTestId('keys-b')
    const d = page.getByTestId('keys-d')

    await b.focus()
    await expect(b).toBeFocused()
    await b.evaluate(el => el.setAttribute('data-marked', 'yes'))

    await page.getByTestId('keys-toggle-dir').click()
    await expect(page.getByTestId('keys-toggle-dir')).toHaveText('Dir: rtl')
    // Same node (no remount), same current item — then RTL arrows apply.
    await expect(page.locator('[data-testid="keys-b"][data-marked="yes"]')).toBeVisible()
    await expect(b).toHaveAttribute('tabindex', '0')
    await b.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(d).toBeFocused()
  })

  test('RF-KEY-11: omitted behavior props mean horizontal bounded non-typeahead', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', {})
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const a = page.getByTestId('keys-a')
    const b = page.getByTestId('keys-b')
    const d = page.getByTestId('keys-d')

    await b.focus()
    await page.keyboard.press('ArrowRight')
    await expect(d).toBeFocused()

    await a.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(a).toBeFocused()

    await b.focus()
    await page.keyboard.press('ArrowDown')
    await expect(b).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(b).toBeFocused()

    await page.keyboard.press('x')
    await expect(b).toBeFocused()
  })

  test('RF-KEY-12: PageUp and PageDown match Home and End in one dimension', async ({
    mount,
    page,
  }) => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', { orientation })
      await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
      const a = page.getByTestId('keys-a')
      const b = page.getByTestId('keys-b')
      const e = page.getByTestId('keys-e')

      await b.focus()
      await page.keyboard.press('PageUp')
      await expect(a).toBeFocused()

      await b.focus()
      await page.keyboard.press('PageDown')
      await expect(e).toBeFocused()
    }
  })
})

test.describe('RovingFocus tab stops and currentness', () => {
  test('RF-TAB-03: Shift+Tab enters and leaves through the current Item', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture')
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const before = page.getByTestId('keys-outside-before')
    const after = page.getByTestId('keys-outside-after')
    const b = page.getByTestId('keys-b')

    await b.focus()
    await expect(b).toBeFocused()

    await after.focus()
    await pressTab(page, 'back')
    await expect(b).toBeFocused()

    await pressTab(page, 'back')
    await expect(before).toBeFocused()
  })

  test('RF-TAB-05: unrelated rerenders preserve the current Item and nodes', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture')
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const d = page.getByTestId('keys-d')

    await d.focus()
    await d.evaluate(el => el.setAttribute('data-marked', 'yes'))

    // Synthetic click: rerenders the parent without moving DOM focus (a real
    // click would focus the button itself).
    await page.getByTestId('keys-rerender').dispatchEvent('click')
    await expect(page.getByTestId('keys-rerender')).toHaveText('Rerender 1')
    await expect(page.locator('[data-testid="keys-d"][data-marked="yes"]')).toBeVisible()
    await expect(d).toBeFocused()
    await expect(d).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('keys-a')).toHaveAttribute('tabindex', '-1')
    await expect(page.getByTestId('keys-b')).toHaveAttribute('tabindex', '-1')
  })

  test('RF-TAB-06: current falls next-then-previous when unavailable', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusDynamicFixture')
    await expect(page.getByTestId('roving-focus-dynamic-root')).toBeVisible()
    const before = page.getByTestId('dyn-outside-before')
    const b = page.getByTestId('dyn-b')
    const c = page.getByTestId('dyn-c')

    // Disable the current item: next sibling becomes the stop.
    await b.focus()
    await page.getByTestId('dyn-disable-b').click()
    await expect(c).toHaveAttribute('tabindex', '0')
    await expect(b).toHaveAttribute('tabindex', '-1')
    await before.focus()
    await page.keyboard.press('Tab')
    await expect(c).toBeFocused()

    // Hide the current item: same next fallback.
    await page.getByTestId('dyn-reset').click()
    await b.focus()
    await page.getByTestId('dyn-hide-b').click()
    await expect(c).toHaveAttribute('tabindex', '0')
    await before.focus()
    await page.keyboard.press('Tab')
    await expect(c).toBeFocused()

    // Remove the current item: next sibling wins, nothing stale remains.
    await page.getByTestId('dyn-reset').click()
    await b.focus()
    await page.getByTestId('dyn-remove-b').click()
    await expect(b).toHaveCount(0)
    await expect(c).toHaveAttribute('tabindex', '0')
    await before.focus()
    await page.keyboard.press('Tab')
    await expect(c).toBeFocused()

    // No next sibling: falls back to the previous item.
    await page.getByTestId('dyn-reset').click()
    await page.getByTestId('dyn-remove-c').click()
    await b.focus()
    await page.getByTestId('dyn-remove-b').click()
    await expect(page.getByTestId('dyn-a')).toHaveAttribute('tabindex', '0')
    await before.focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('dyn-a')).toBeFocused()
  })

  test('RF-TAB-07: no tab stop when every Item is unavailable', async ({ mount, page }) => {
    const errors: Error[] = []
    page.on('pageerror', err => errors.push(err))
    await mount('components/RovingFocus/RovingFocus/RovingFocusDynamicFixture')
    await expect(page.getByTestId('roving-focus-dynamic-root')).toBeVisible()
    const before = page.getByTestId('dyn-outside-before')

    await page.getByTestId('dyn-a').focus()
    await page.getByTestId('dyn-disable-all').click()
    await expect(page.locator('[data-testid^="dyn-"][tabindex="0"]')).toHaveCount(0)

    await before.focus()
    for (const key of ['ArrowRight', 'ArrowDown', 'Home', 'End', 'x'] as const) {
      await page.keyboard.press(key)
      await expect(before).toBeFocused()
    }
    await expect(page.locator('[data-testid^="dyn-"][tabindex="0"]')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('RF-TAB-08: kernel tabIndex wins over conflicting consumer values', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSlotFixture')
    await expect(page.getByTestId('roving-focus-slot-root')).toBeVisible()

    await expect(page.getByTestId('slot-toolbar')).toBeVisible()
    const stops = page.locator('[data-testid="slot-toolbar"] [tabindex="0"]')
    await expect(stops).toHaveCount(1)
    await expect(page.getByTestId('slot-bold')).toHaveAttribute('tabindex', '0')

    await page.getByTestId('slot-bold').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('slot-link')).toBeFocused()
    await expect(page.getByTestId('slot-link')).toHaveAttribute('tabindex', '0')
    await expect(stops).toHaveCount(1)
  })
})

test.describe('RovingFocus transparent DOM', () => {
  test('RF-DOM-01: Root and Item preserve authored tags with no wrappers', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSlotFixture')
    await expect(page.getByTestId('roving-focus-slot-root')).toBeVisible()
    const toolbar = page.getByTestId('slot-toolbar')

    await expect(toolbar).toHaveJSProperty('tagName', 'DIV')
    const childTags = await toolbar.evaluate(el => [...el.children].map(c => c.tagName))
    expect(childTags).toEqual(['BUTTON', 'BUTTON', 'A'])
    // The toolbar sits directly in the story root: no Root host in between.
    const parentTestId = await toolbar.evaluate(el => el.parentElement?.getAttribute('data-testid'))
    expect(parentTestId).toBe('roving-focus-slot-root')
    const boldParent = await page.getByTestId('slot-bold').evaluate(el => el.parentElement === el.closest('[data-testid="slot-toolbar"]'))
    expect(boldParent).toBe(true)
  })

  test('RF-DOM-02: Item merges css, handlers, and ref onto its single child', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSlotFixture')
    await expect(page.getByTestId('roving-focus-slot-root')).toBeVisible()
    const bold = page.getByTestId('slot-bold')
    const toolbar = page.getByTestId('slot-toolbar')

    await expect(bold).toHaveClass(/reference-ui__/)
    await expect(bold).toHaveClass(/item-part-class/)
    await expect(bold).toHaveClass(/bold-child-class/)
    await expect(toolbar).toHaveClass(/root-part-class/)
    await expect(toolbar).toHaveClass(/toolbar-child-class/)
    await expect(toolbar).toHaveAttribute('data-root-part', 'yes')
    await expect(page.getByTestId('slot-ref-state')).toHaveText('BUTTON')

    // Move roving focus to it and activate: child (+10) and part (+1) fire.
    await bold.focus()
    await expect(bold).toHaveAttribute('tabindex', '0')
    await bold.click()
    await expect(page.getByTestId('slot-click-count')).toHaveText('11')
    await expect(bold).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('slot-link')).toBeFocused()
    await snap(page, 'slot-link-focused')
  })

  test('RF-DOM-03: empty composite renders safely and captures nothing', async ({
    mount,
    page,
  }) => {
    const errors: Error[] = []
    page.on('pageerror', err => errors.push(err))
    await mount('components/RovingFocus/RovingFocus/RovingFocusEmptyFixture')
    await expect(page.getByTestId('roving-focus-empty-root')).toBeVisible()
    const container = page.getByTestId('empty-container')
    const beforeHtml = await container.evaluate(el => el.innerHTML)

    await page.getByTestId('empty-before').focus()
    for (const key of ['ArrowRight', 'ArrowDown', 'Home', 'End'] as const) {
      await page.keyboard.press(key)
      await expect(page.getByTestId('empty-before')).toBeFocused()
    }
    await pressTab(page)
    await expect(page.getByTestId('empty-after')).toBeFocused()

    await expect(container.locator('[tabindex]')).toHaveCount(0)
    await expect(container).toHaveJSProperty('childElementCount', 0)
    const afterHtml = await container.evaluate(el => el.innerHTML)
    expect(afterHtml).toBe(beforeHtml)
    expect(errors).toEqual([])
  })

  test('RF-DOM-04: navigation tracks insert, reorder, and remove in DOM order', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusDynamicFixture')
    await expect(page.getByTestId('roving-focus-dynamic-root')).toBeVisible()
    const item = (id: string) => page.getByTestId(`dyn-${id}`)

    await item('a').focus()
    await page.keyboard.press('ArrowRight')
    await expect(item('b')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(item('c')).toBeFocused()

    await page.getByTestId('dyn-insert').click()
    await item('a').focus()
    for (const id of ['b', 'd', 'c'] as const) {
      await page.keyboard.press('ArrowRight')
      await expect(item(id)).toBeFocused()
    }

    await page.getByTestId('dyn-reorder').click()
    await item('c').focus()
    for (const id of ['d', 'b', 'a'] as const) {
      await page.keyboard.press('ArrowRight')
      await expect(item(id)).toBeFocused()
    }

    await page.getByTestId('dyn-remove-b').click()
    await expect(item('b')).toHaveCount(0)
    await item('c').focus()
    await page.keyboard.press('ArrowRight')
    await expect(item('d')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(item('a')).toBeFocused()
  })

  test('RF-DOM-05: StrictMode plus ref rerenders register once with one stop', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusStrictRefFixture')
    await expect(page.getByTestId('roving-focus-strict-root')).toBeVisible()

    const rendersText = await page.getByTestId('strict-renders').textContent()
    expect(Number(rendersText)).toBeLessThan(30)
    await expect(page.locator('[data-testid="strict-composite"] [tabindex="0"]')).toHaveCount(1)

    await page.getByTestId('strict-Apple').focus()
    for (const label of ['Banana', 'Cherry', 'Date'] as const) {
      await page.keyboard.press('ArrowRight')
      await expect(page.getByTestId(`strict-${label}`)).toBeFocused()
    }
    await expect(page.locator('[data-testid="strict-composite"] [tabindex="0"]')).toHaveCount(1)
    const settledText = await page.getByTestId('strict-renders').textContent()
    expect(Number(settledText)).toBeLessThan(30)
  })
})

test.describe('RovingFocus typeahead browser behavior', () => {
  test('RF-TYPE-01: typeahead off leaves printable keys and Space untouched', async ({
    mount,
    page,
  }) => {
    const variants = [{}, { typeahead: false }] as const
    for (let i = 0; i < variants.length; i++) {
      const component = await mount(
        'components/RovingFocus/RovingFocus/RovingFocusLabelsFixture',
        variants[i]
      )
      await expect(page.getByTestId('roving-focus-labels-root')).toBeVisible()
      const bravo = page.getByTestId('labels-bravo')

      await bravo.focus()
      await page.keyboard.press('b')
      await expect(bravo).toBeFocused()
      await expect(bravo).toHaveAttribute('tabindex', '0')

      await page.keyboard.press('Space')
      await expect(page.getByTestId('labels-activation-count')).toHaveText('1')
      await expect(bravo).toBeFocused()
      if (i < variants.length - 1) await component.unmount()
    }
  })

  test('RF-TYPE-09: searches use textValue, aria-label, then rendered text live', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', {
      typeahead: true,
    })
    await expect(page.getByTestId('roving-focus-labels-root')).toBeVisible()

    await page.getByTestId('labels-bravo').focus()
    await page.keyboard.press('x')
    await expect(page.getByTestId('labels-x')).toBeFocused()
    await first.unmount()

    const second = await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', {
      typeahead: true,
    })
    await page.getByTestId('labels-drop-textvalue').click()
    await page.getByTestId('labels-bravo').focus()
    await page.keyboard.press('x')
    await expect(page.getByTestId('labels-bravo')).toBeFocused()
    await page.waitForTimeout(1100)
    await page.keyboard.press('y')
    await expect(page.getByTestId('labels-x')).toBeFocused()
    await second.unmount()

    await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', { typeahead: true })
    await page.getByTestId('labels-drop-textvalue').click()
    await page.getByTestId('labels-drop-aria').click()
    await page.getByTestId('labels-bravo').focus()
    await page.keyboard.press('z')
    await expect(page.getByTestId('labels-x')).toBeFocused()
  })

  test('RF-TYPE-10: typeahead ignores editable targets and modified shortcuts', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', { typeahead: true })
    await expect(page.getByTestId('roving-focus-labels-root')).toBeVisible()
    const input = page.getByTestId('labels-input')

    // Focus entry legitimately makes the input's item current (RF-TAB-04);
    // the typing itself must change nothing further.
    await input.focus()
    await expect(page.getByTestId('labels-input-item')).toHaveAttribute('tabindex', '0')
    await page.keyboard.type('ab')
    await expect(input).toHaveValue('ab')
    await expect(input).toBeFocused()
    await expect(page.getByTestId('labels-input-item')).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('labels-x')).toHaveAttribute('tabindex', '-1')

    const bravo = page.getByTestId('labels-bravo')
    await bravo.focus()
    await page.keyboard.press('Alt+a')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('Control+ArrowDown')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('Meta+ArrowUp')
    await expect(bravo).toBeFocused()
    await expect(bravo).toHaveAttribute('tabindex', '0')
  })

  test('RF-TYPE-11: buffered search skips newly disabled or unmounted matches', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', {
      typeahead: true,
    })
    await expect(page.getByTestId('roving-focus-labels-root')).toBeVisible()

    // Disabling the focused control drops DOM focus to the body, so re-enter
    // through X (buffer 'b' persists — it is time-based, not focus-based)
    // and continue typing: 'br' must skip Bravo for Bread.
    await page.getByTestId('labels-x').focus()
    await page.keyboard.press('b')
    await expect(page.getByTestId('labels-bravo')).toBeFocused()
    await page.getByTestId('labels-disable-bravo').click()
    await page.getByTestId('labels-x').focus()
    await page.keyboard.press('r')
    await expect(page.getByTestId('labels-bread')).toBeFocused()
    await expect(page.getByTestId('labels-bravo')).toHaveAttribute('tabindex', '-1')
    await first.unmount()

    await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', { typeahead: true })
    await page.getByTestId('labels-x').focus()
    await page.keyboard.press('b')
    await expect(page.getByTestId('labels-bravo')).toBeFocused()
    await page.getByTestId('labels-remove-bravo').click()
    await expect(page.getByTestId('labels-bravo')).toHaveCount(0)
    await page.getByTestId('labels-x').focus()
    await page.keyboard.press('r')
    await expect(page.getByTestId('labels-bread')).toBeFocused()
  })

  test('RF-TYPE-12: searchable text skips decorative glyphs and collapses whitespace', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', {
      typeahead: true,
    })
    await expect(page.getByTestId('roving-focus-labels-root')).toBeVisible()

    await page.getByTestId('labels-x').focus()
    await page.keyboard.type('spaced out')
    await expect(page.getByTestId('labels-decor')).toBeFocused()
    await expect(page.getByTestId('labels-decor')).toHaveAttribute('tabindex', '0')
    await first.unmount()

    await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', { typeahead: true })
    await page.getByTestId('labels-x').focus()
    // Dispatched (not typed): type() would skip the keydown for ★ and prove
    // nothing — the kernel must receive it and find no match.
    await page.getByTestId('labels-x').dispatchEvent('keydown', { key: '★' })
    await expect(page.getByTestId('labels-x')).toBeFocused()
  })
})

test.describe('RovingFocus nesting', () => {
  test('RF-NEST-01: nested composite handles supported keys alone', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusNestedFixture')
    await expect(page.getByTestId('roving-focus-nested-root')).toBeVisible()
    const y = page.getByTestId('nested-y')
    const z = page.getByTestId('nested-z')

    await y.focus()
    await expect(page.getByTestId('nested-b')).toHaveAttribute('tabindex', '0')
    await expect(y).toHaveAttribute('tabindex', '0')

    await page.keyboard.press('ArrowRight')
    await expect(z).toBeFocused()
    await expect(z).toHaveAttribute('tabindex', '0')
    await expect(y).toHaveAttribute('tabindex', '-1')
    await expect(page.getByTestId('nested-b')).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('nested-a')).toHaveAttribute('tabindex', '-1')
    await expect(page.getByTestId('nested-c')).toHaveAttribute('tabindex', '-1')
    await snap(page, 'nested-inner-focused')
  })

  test('RF-NEST-02: unsupported inner keys bubble to the outer composite', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusNestedFixture')
    await expect(page.getByTestId('roving-focus-nested-root')).toBeVisible()
    const y = page.getByTestId('nested-y')
    const c = page.getByTestId('nested-c')

    await y.focus()
    await page.keyboard.press('ArrowDown')
    await expect(c).toBeFocused()
    await expect(c).toHaveAttribute('tabindex', '0')
    await expect(y).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('nested-x')).toHaveAttribute('tabindex', '-1')
    await expect(page.getByTestId('nested-z')).toHaveAttribute('tabindex', '-1')
  })
})

test.describe('RovingFocus composition gates', () => {
  test('RF-COMP-01: looping toolbar with a disabled control', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSlotFixture', { loop: true })
    await expect(page.getByTestId('roving-focus-slot-root')).toBeVisible()
    const bold = page.getByTestId('slot-bold')
    const link = page.getByTestId('slot-link')

    await page.getByTestId('slot-outside-before').focus()
    await pressTab(page)
    await expect(bold).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(link).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(bold).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(link).toBeFocused()

    await pressTab(page)
    await expect(page.getByTestId('slot-outside-after')).toBeFocused()

    await bold.click()
    await expect(page.getByTestId('slot-click-count')).toHaveText('11')
  })

  test('RF-COMP-02: bounded vertical tag list with current removal', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusDynamicFixture', {
      orientation: 'vertical',
    })
    await expect(page.getByTestId('roving-focus-dynamic-root')).toBeVisible()
    const item = (id: string) => page.getByTestId(`dyn-${id}`)

    await item('a').focus()
    await page.keyboard.press('ArrowDown')
    await expect(item('b')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(item('c')).toBeFocused()

    await page.keyboard.press('Home')
    await expect(item('a')).toBeFocused()
    await page.keyboard.press('End')
    await expect(item('c')).toBeFocused()

    await item('b').focus()
    await page.getByTestId('dyn-remove-b').click()
    await expect(item('c')).toHaveAttribute('tabindex', '0')

    await item('a').focus()
    await page.keyboard.press('ArrowUp')
    await expect(item('a')).toBeFocused()
    await item('c').focus()
    await page.keyboard.press('ArrowDown')
    await expect(item('c')).toBeFocused()
  })

  test('RF-COMP-03: responsive picker grid combines geometry, RTL, and typeahead', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusReflowFixture', {
      loop: false,
      typeahead: true,
    })
    await expect(page.getByTestId('roving-focus-reflow-root')).toBeVisible()
    const cell = (i: number) => page.getByTestId(`flow-${i}`)

    await cell(0).focus()
    // keyboard.type routes non-ASCII through insertText (no keydown), so
    // dispatch a real bubbling keydown: the kernel path stays genuine.
    await cell(0).dispatchEvent('keydown', { key: 'é' })
    await expect(cell(4)).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(cell(5)).toBeFocused()

    await page.getByTestId('reflow-narrow').click()
    await cell(1).focus()
    await page.keyboard.press('ArrowDown')
    await expect(cell(3)).toBeFocused()

    // LTR control: row head holds, then RTL reverses the horizontal axis.
    await cell(2).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(cell(2)).toBeFocused()

    await page.getByTestId('reflow-toggle-dir').click()
    await cell(2).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(cell(3)).toBeFocused()

    await cell(1).focus()
    await page.keyboard.press('ArrowDown')
    await expect(cell(3)).toBeFocused()
    await expect(page.locator('[data-testid="reflow-composite"] [tabindex="0"]')).toHaveCount(1)
  })
})

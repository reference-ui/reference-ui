/**
 * Menu browser proofs: composition gates plus the root-level parity
 * re-targets across DOM, focus, typeahead, and action rows. Mounts the
 * story fixtures and asserts levels, roving, and one-selection
 * discipline in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

async function centerOf(locator: {
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>
}) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('expected a bounding box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.describe('Menu ShadowRoot ownership', () => {
  test('MN-ENV-03: Menu preserves composed-path ownership and submenu behavior from a ShadowRoot', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Shadow')
    const host = page.getByTestId('menu-shadow-host')
    const trigger = page.getByTestId('btn-shadow-trigger')
    const content = page.getByTestId('menu-shadow-content')
    const shadowActiveTestId = () =>
      host.evaluate(
        el => (el.shadowRoot?.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null
      )

    // Root opens with menu semantics from the shadow trigger.
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await trigger.click()
    await expect(content).toBeVisible()

    // Documented destination: the trigger's shadow root, not document.body.
    expect(
      await host.evaluate(el => !!el.shadowRoot?.querySelector('[data-testid="menu-shadow-content"]'))
    ).toBe(true)
    expect(await page.evaluate(() => !!document.querySelector('[data-testid="menu-shadow-content"]'))).toBe(
      false
    )

    // Focus uses the owning root: pointer opening focuses the menu itself.
    await expect.poll(shadowActiveTestId).toBe('menu-shadow-content')

    // Typeahead search resolves in the owning root.
    const itemEdit = page.getByTestId('menu-shadow-item-edit')
    await itemEdit.focus()
    await page.keyboard.press('z')
    await expect(page.getByTestId('menu-shadow-item-duplicate')).toBeFocused()

    // The nested submenu inherits the shadow destination as its child layer.
    const subTrigger = page.getByTestId('menu-shadow-sub-trigger')
    await subTrigger.focus()
    await page.keyboard.press('Enter')
    const subContent = page.getByTestId('menu-shadow-sub-content')
    await expect(subContent).toBeVisible()
    await expect(page.getByTestId('menu-shadow-sub-item-email')).toBeFocused()
    expect(
      await host.evaluate(el => !!el.shadowRoot?.querySelector('[data-testid="menu-shadow-sub-content"]'))
    ).toBe(true)
    expect(
      await page.evaluate(() => !!document.querySelector('[data-testid="menu-shadow-sub-content"]'))
    ).toBe(false)
    await expect(page.getByTestId('menu-shadow-sub-logs')).toHaveText('Sub Logs: share:onOpen')

    // Composed inside press on the open submenu trigger dismisses nothing.
    await subTrigger.click()
    await expect(subContent).toBeVisible()
    await expect(content).toBeVisible()
    await expect(page.getByTestId('menu-shadow-sub-logs')).toHaveText('Sub Logs: share:onOpen')

    // Composed inside press on the inert pad closes only the submenu level.
    await page.getByTestId('menu-shadow-pad').click()
    await expect(subContent).toHaveCount(0)
    await expect(content).toBeVisible()
    await expect(page.getByTestId('menu-shadow-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,share:onDismiss'
    )

    // Level-local close restores the submenu trigger in the owning root.
    await subTrigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-shadow-sub-item-email')).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(subContent).toHaveCount(0)
    await expect(subTrigger).toBeFocused()

    // A true outside path unwinds every open level deepest-first, exactly once.
    await page.keyboard.press('Enter')
    await expect(subContent).toBeVisible()
    await page.getByTestId('btn-shadow-outside').click()
    // WebKit click-focus never lands on buttons, so
    // re-deliver the Chromium focus state; the unwind + no-steal assertions
    // below then test the outside path on every engine.
    if (engineOf() === 'webkit') await page.getByTestId('btn-shadow-outside').focus()
    await expect(subContent).toHaveCount(0)
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('menu-shadow-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,share:onDismiss,share:onOpen,share:onDismiss,share:onOpen,share:onDismiss'
    )
    await expect(page.getByTestId('menu-shadow-root-logs')).toHaveText('Sub Root Logs: true,false')
    await expect(page.getByTestId('btn-shadow-outside')).toBeFocused()

    // Branches/layers cleaned up: no menu nodes linger in either root.
    expect(
      await host.evaluate(el => el.shadowRoot?.querySelectorAll('[data-reference-menu-content]').length ?? -1)
    ).toBe(0)
    expect(await page.evaluate(() => document.querySelectorAll('[data-reference-menu-content]').length)).toBe(0)

    // Reopen is clean: one selection, one action, one dismiss.
    await trigger.click()
    await expect(content).toBeVisible()
    await itemEdit.click()
    await expect(page.getByTestId('menu-shadow-action')).toHaveText('Shadow Action: Edit')
    await expect(content).toHaveCount(0)
    await expect(page.getByTestId('menu-shadow-root-logs')).toHaveText(
      'Sub Root Logs: true,false,true,false'
    )
  })
})

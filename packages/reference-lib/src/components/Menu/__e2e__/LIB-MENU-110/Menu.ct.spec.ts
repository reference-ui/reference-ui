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

test.describe('Menu composition gates', () => {

  test('MN-COMP-02: ContextMenu composes a virtual anchor with Menu and no trigger markup', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/ContextMenu')
    const target = page.getByTestId('ctx-target')
    const logs = page.getByTestId('menu-ctx-logs')

    // Primary click never opens; the target carries no MenuButton markup.
    await target.click()
    await expect(page.getByTestId('menu-ctx-root')).toHaveCount(0)
    expect(await target.getAttribute('aria-expanded')).toBeNull()
    expect(await target.getAttribute('aria-controls')).toBeNull()
    expect(await target.getAttribute('aria-haspopup')).toBeNull()

    // Right press opens at the pointer anchor with entry on the first item.
    const targetBox = await target.boundingBox()
    if (!targetBox) throw new Error('expected context target box')
    const at = { x: targetBox.x + 40, y: targetBox.y + 20 }
    await page.mouse.click(at.x, at.y, { button: 'right' })
    const root = page.getByTestId('menu-ctx-root')
    await expect(root).toBeVisible()
    await expect(page.getByTestId('menu-ctx-item-edit')).toBeFocused()
    const rootBox = await root.boundingBox()
    if (!rootBox) throw new Error('expected context menu box')
    expect(Math.abs(rootBox.x - at.x)).toBeLessThan(80)
    expect(Math.abs(rootBox.y - at.y)).toBeLessThan(80)

    // Internal context presses stay inside without dismissing.
    await page.getByTestId('menu-ctx-item-edit').click({ button: 'right' })
    await expect(logs).not.toContainText('root:onDismiss')
    await expect(root).toBeVisible()

    // Keyboard gesture opens with the same entry focus.
    await page.keyboard.press('Escape')
    await expect(root).toHaveCount(0)
    await target.focus()
    await page.keyboard.press('Shift+F10')
    await expect(root).toBeVisible()
    await expect(page.getByTestId('menu-ctx-item-edit')).toBeFocused()

    // A repeated source gesture closes stale submenus and reopens only root.
    const ctxTrigger = page.getByTestId('menu-ctx-trigger')
    await ctxTrigger.focus()
    await expect(ctxTrigger).toBeFocused()
    await ctxTrigger.press('ArrowRight')
    await expect(page.getByTestId('menu-ctx-content')).toBeVisible()
    await target.evaluate(el => {
      const rect = el.getBoundingClientRect()
      el.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 10,
          clientY: rect.top + 10,
        })
      )
    })
    await expect(page.getByTestId('menu-ctx-content')).toHaveCount(0)
    await expect(root).toBeVisible()
    await expect(logs).toContainText('share:onDismiss')

    // Outside right press dismisses once with native behavior unprevented.
    const prevented = await page.getByTestId('ctx-outside').evaluate(el => {
      let observed: boolean | null = null
      el.addEventListener(
        'contextmenu',
        e => {
          observed = e.defaultPrevented
        },
        { once: true }
      )
      el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
      return observed
    })
    expect(prevented).toBe(false)
    await expect(root).toHaveCount(0)
    const text = await logs.textContent()
    const dismisses = text?.split('root:onDismiss').length ?? 0
    // One for the Escape leg, one for the repeated gesture, one for outside.
    expect(dismisses).toBe(4)
  })
})

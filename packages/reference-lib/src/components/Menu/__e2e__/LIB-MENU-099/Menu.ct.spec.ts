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

test.describe('Menu pointer submenu intent', () => {

  test('MN-INTENT-08: Touch starts no hover timers and activates the trigger once', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()
    const trigger = page.getByTestId('menu-sub-trigger')
    const logs = page.getByTestId('menu-sub-logs')

    // Touch hover trajectory: enter/move/leave past every intent delay.
    await trigger.evaluate(el => {
      const target = el as HTMLElement
      target.dispatchEvent(
        new PointerEvent('pointerover', { bubbles: true, pointerType: 'touch' })
      )
      target.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch' })
      )
      target.dispatchEvent(
        new PointerEvent('pointerout', { bubbles: true, pointerType: 'touch' })
      )
    })
    await page.waitForTimeout(450)
    await expect(logs).toHaveText('Sub Logs: ')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)

    // Tap-equivalent activation opens exactly once.
    await trigger.click()
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(logs).toHaveText('Sub Logs: share:onOpen')
  })
})

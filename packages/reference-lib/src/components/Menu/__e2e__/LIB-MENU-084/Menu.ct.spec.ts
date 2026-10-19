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

test.describe('Menu controlled submenu keyboard completions', () => {

  test('MN-SUBKEY-07: Consumer key cancellation wins before submenu and roving defaults', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-cancel-trigger').click()
    await expect(page.getByTestId('menu-probe-cancel-root')).toBeFocused()
    const logs = page.getByTestId('menu-probe-cancel-logs')
    const trigger = page.getByTestId('probe-cancel-trigger')

    // Open keys cancelled at the trigger: consumer log first, no request.
    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    await expect(logs).toHaveText('Cancel Logs: trigger:cancelled')
    await expect(page.getByTestId('probe-cancel-content')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(logs).toHaveText('Cancel Logs: trigger:cancelled,trigger:cancelled')
    await expect(page.getByTestId('probe-cancel-content')).toHaveCount(0)

    // Pointer open is not a key path: content mounts for the close/roving legs.
    await trigger.click()
    await expect(page.getByTestId('probe-cancel-content')).toBeVisible()

    // Close + roving keys cancelled at the item: no close, no focus movement.
    const item = page.getByTestId('probe-cancel-item')
    await item.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(logs).toContainText('item:cancelled')
    await expect(page.getByTestId('probe-cancel-content')).toBeVisible()
    await expect(item).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('probe-cancel-content')).toBeVisible()
    await expect(item).toBeFocused()
    await expect(logs).not.toContainText('cancel:onDismiss')
  })
})

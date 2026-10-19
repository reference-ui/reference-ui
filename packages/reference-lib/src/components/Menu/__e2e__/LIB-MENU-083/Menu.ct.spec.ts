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

  test('MN-SUBKEY-06: Rejected submenu open and close requests stay visibly controlled', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-reject-trigger').click()
    await expect(page.getByTestId('menu-probe-reject-root')).toBeFocused()
    const logs = page.getByTestId('menu-probe-reject-logs')

    // Rejected open: one request, closed ARIA/DOM/focus persist.
    const openTrigger = page.getByTestId('probe-reject-open-trigger')
    await openTrigger.focus()
    await page.keyboard.press('ArrowRight')
    await expect(logs).toHaveText('Reject Logs: reject-open:onOpen')
    await expect(openTrigger).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('probe-reject-open-content')).toHaveCount(0)
    await expect(openTrigger).toBeFocused()

    // Rejected close: one request, open ARIA/DOM/focus persist.
    const closeItem = page.getByTestId('probe-reject-close-item')
    await expect(page.getByTestId('probe-reject-close-content')).toBeVisible()
    await closeItem.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(logs).toHaveText('Reject Logs: reject-open:onOpen,reject-close:onDismiss')
    await expect(page.getByTestId('probe-reject-close-content')).toBeVisible()
    await expect(closeItem).toBeFocused()
    await expect(page.getByTestId('probe-reject-close-trigger')).toHaveAttribute(
      'aria-expanded',
      'true'
    )

    await page.keyboard.press('Escape')
    await expect(logs).toHaveText(
      'Reject Logs: reject-open:onOpen,reject-close:onDismiss,reject-close:onDismiss'
    )
    await expect(page.getByTestId('probe-reject-close-content')).toBeVisible()
  })
})

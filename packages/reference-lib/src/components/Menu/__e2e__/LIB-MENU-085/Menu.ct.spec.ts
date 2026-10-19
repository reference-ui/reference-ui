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

  test('MN-SUBKEY-08: Disabled triggers stay inert even when externally open', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-disabled-trigger').click()
    await expect(page.getByTestId('menu-probe-disabled-root')).toBeFocused()
    const logs = page.getByTestId('menu-probe-disabled-logs')
    const trigger = page.getByTestId('probe-disabled-trigger')

    await expect(trigger).toHaveAttribute('aria-disabled', 'true')

    // Roving skips both disabled triggers.
    await page.getByTestId('probe-disabled-sibling').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('probe-disabled-sibling')).toBeFocused()

    // Keyboard open on the closed disabled trigger: no request.
    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await expect(logs).toHaveText('Disabled Logs: ')
    await expect(page.getByTestId('probe-disabled-content')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    // Hovering the disabled entry closes the open level exactly once
    // (INTENT-05); the disabled submenu itself still requests nothing.
    await trigger.hover()
    await expect(logs).toHaveText('Disabled Logs: ext:onDismiss', { timeout: 3000 })
    await page.waitForTimeout(450)
    await expect(logs).toHaveText('Disabled Logs: ext:onDismiss')
    await expect(page.getByTestId('probe-disabled-content')).toHaveCount(0)

    // A press on the sibling is a second deliberate gesture: the submenu
    // layer reads it as outside and requests once more (each gesture
    // requests, as with rejected key presses in SUBKEY-06).
    await trigger.click({ force: true })
    await expect(logs).toHaveText('Disabled Logs: ext:onDismiss,ext:onDismiss')

    // Externally open content stays represented but noninteractive.
    const extTrigger = page.getByTestId('probe-disabled-ext-trigger')
    await expect(page.getByTestId('probe-disabled-ext-content')).toBeVisible()
    await expect(extTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('probe-disabled-ext-item')).not.toBeFocused()
    await expect(extTrigger).not.toBeFocused()

    await extTrigger.focus()
    await page.keyboard.press('ArrowLeft')
    await extTrigger.click({ force: true })
    await expect(logs).toHaveText('Disabled Logs: ext:onDismiss,ext:onDismiss')
    await expect(page.getByTestId('probe-disabled-ext-content')).toBeVisible()
  })
})

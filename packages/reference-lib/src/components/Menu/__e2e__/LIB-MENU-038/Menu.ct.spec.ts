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

test.describe('Menu parity (root-level re-targets)', () => {

  test('MN-TYPE-04: Menu integrates timed, Unicode, disabled, no-match, and descendant typeahead edges', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-type-trigger').click()
    const apple = page.getByTestId('menu-item-apple')
    const anchor = page.getByTestId('menu-item-anchor')
    const banana = page.getByTestId('menu-item-banana')
    const eclair = page.getByTestId('menu-item-eclair')
    await apple.focus()

    await page.keyboard.press('a')
    await page.keyboard.press('n')
    await expect(anchor).toBeFocused()

    await page.waitForTimeout(1500)
    await page.keyboard.press('b')
    await expect(banana).toBeFocused()

    await page.waitForTimeout(1500)
    // keyboard.type emits no keydown for non-layout chars in Chromium (text
    // insertion path), so drive the real handler with a synthetic keydown.
    await banana.dispatchEvent('keydown', { key: 'é' })
    await expect(eclair).toBeFocused()

    await page.keyboard.type('zzz')
    await expect(eclair).toBeFocused()
    await expect(page.getByTestId('menu-content-type')).toBeVisible()

    const input = page.getByTestId('menu-type-input')
    await input.focus()
    await page.keyboard.type('hi')
    await expect(input).toHaveValue('hi')
    await expect(input).toBeFocused()
    await expect(page.getByTestId('menu-content-type')).toBeVisible()
  })
})

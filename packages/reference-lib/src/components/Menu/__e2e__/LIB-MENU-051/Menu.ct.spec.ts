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

  test('MN-DYNAMIC-03: Menu uses current labels and disabled state on the next interaction', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-dynamic-trigger').click()
    await page.getByTestId('btn-mutate-items').click()
    await page.getByTestId('btn-rename-items').click()

    const bravo = page.getByTestId('dynamic-item-bravo')
    await expect(bravo).toHaveText('bravo!')
    await expect(bravo).toHaveAttribute('aria-disabled', 'true')

    await page.getByTestId('dynamic-item-charlie').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('dynamic-item-delta')).toBeFocused()

    await page.getByTestId('dynamic-item-charlie').focus()
    await page.keyboard.press('d')
    await expect(page.getByTestId('dynamic-item-delta')).toBeFocused()

    await page.waitForTimeout(1500)
    await page.getByTestId('dynamic-item-charlie').focus()
    await page.keyboard.type('bravo')
    await expect(page.getByTestId('dynamic-item-charlie')).toBeFocused()
  })
})

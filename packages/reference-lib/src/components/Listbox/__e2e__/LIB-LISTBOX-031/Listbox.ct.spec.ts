/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-POINTER-01: Listbox should issue one request for a primary mouse press without duplicating it on release', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await bravo.scrollIntoViewIfNeeded()
    const box = await bravo.boundingBox()
    if (!box) throw new Error('Missing bounding box')

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await expect(calls).toContainText('"bravo"')

    await page.mouse.move(box.x + box.width + 100, box.y + box.height + 100)
    await page.mouse.up()

    const callCount = (await calls.textContent()) || ''
    expect((callCount.match(/bravo/g) || []).length).toBe(1)
  })
});

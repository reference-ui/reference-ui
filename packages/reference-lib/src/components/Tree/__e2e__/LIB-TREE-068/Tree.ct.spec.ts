/**
 * Tree composition gates and browser proofs. Pins hierarchy rendering,
 * controlled selection and expansion with deterministic emission, APG
 * keyboard traversal with RTL mirroring, typeahead over the visible set,
 * dynamic recovery, Combobox bridge commits and virtual focus, ShadowRoot
 * traversal, and an accessibility-clean sweep.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function cbReadLog(page: Page, testid: string): Promise<string[]> {
  return JSON.parse((await page.getByTestId(testid).textContent()) ?? '[]')
}

async function cbExpectLogSoon(page: Page, testid: string, expected: string[]) {
  await expect.poll(async () => cbReadLog(page, testid)).toEqual(expected)
}

function cbCaptureDiagnostics(page: Page, marker: string) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && msg.text().includes(marker)) {
      errors.push(msg.text())
    }
  })
  return errors
}

test.describe('Tree Combobox Bridge (TR-CB / TR-COMP-03)', () => {
  test('TR-CB-04 invalid: a nested Tree onChange diagnoses and never double-updates', async ({
    mount,
    page,
  }) => {
    const treeErrors = cbCaptureDiagnostics(page, '[reference-ui] Tree')
    const comboErrors = cbCaptureDiagnostics(page, '[reference-ui] Combobox')
    await mount('components/Tree/Tree/ComboboxTreeInvalid')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()
    expect(comboErrors.some((text) => text.includes('must not carry its own onChange'))).toBe(true)

    const input = page.getByTestId('cbi-input')
    await input.click()
    await expect(page.getByTestId('cbi-popover')).toBeVisible()
    // The nested Tree renders (and diagnoses) once the popover mounts it.
    expect(treeErrors.some((text) => text.includes('nested onChange'))).toBe(true)
    await page.getByTestId('cbi-item-readme').click()
    await cbExpectLogSoon(page, 'cbi-log', ['open', 'change:ci-readme', 'dismiss'])
    expect((await cbReadLog(page, 'cbi-log')).filter((entry) => entry.startsWith('tree:'))).toEqual(
      []
    )
  })
});

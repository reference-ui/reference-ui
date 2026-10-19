/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function readLog(page: Page, testid: string): Promise<string[]> {
  const text = await page.getByTestId(testid).textContent()
  return JSON.parse(text ?? '[]')
}

async function focusedTestId(page: Page) {
  return page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid')
  )
}

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox reconciliation CT', () => {
  test('CB-SELECT-05: select-only escape/tab/blur mirror with zero text callbacks', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyTabOrder')

    const trigger = page.getByTestId('sel-tab-trigger')
    // WebKit click never focuses
    // the trigger, so every click-open below is followed by a
    // programmatic focus (it lands fine) to replicate the focused
    // state Chromium gets from the click — including the blur leg,
    // which needs focus inside the trigger for the blur to exist.
    const isWebKit = browserName === 'webkit'
    const openTrigger = async () => {
      await trigger.click()
      if (isWebKit) await trigger.focus()
    }
    const logIsTextFree = async () => {
      const log = await readLog(page, 'sel-tab-log')
      expect(log.filter(e => e.startsWith('input:'))).toEqual([])
      return log
    }

    // Escape: no commit, one close, cleared active, trigger keeps focus.
    await openTrigger()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).not.toHaveAttribute('aria-activedescendant', /.+/)
    await expect(trigger).toBeFocused()
    expect(await logIsTextFree()).toEqual(['open', 'dismiss'])

    // Tab with keyboard-derived active commits and traverses natively.
    await openTrigger()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    // Wait for content mount + selection resolution before arrowing.
    await expectActiveDescendant(trigger, page.getByTestId('sel-tab-opt-alpha'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(trigger, page.getByTestId('sel-tab-opt-bravo'))
    await page.keyboard.press('Tab')
    if (isWebKit) {
      // Commit + dismiss proven below; native traversal skips the
      // Tab past the button lands on body.
      expect(await focusedTestId(page)).toBeNull()
    } else {
      await expect(page.getByTestId('sel-tab-after')).toBeFocused()
    }
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(await logIsTextFree()).toEqual(['open', 'dismiss', 'open', 'change:bravo', 'dismiss'])

    // Blur outside closes with no commit.
    await openTrigger()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.getByTestId('sel-tab-after').focus()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(await logIsTextFree()).toEqual([
      'open',
      'dismiss',
      'open',
      'change:bravo',
      'dismiss',
      'open',
      'dismiss',
    ])
  })
});

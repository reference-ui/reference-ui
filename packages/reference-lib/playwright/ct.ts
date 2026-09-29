import { test as base, expect, type Locator, type Page } from '@playwright/test'
import { defaultMajor, isDefaultMajor } from './runtimes'

export type MountResult = Locator & {
  update: (newProps: Record<string, unknown>) => Promise<void>
  unmount: () => Promise<void>
}

export type MountFn = (story: string, props?: any) => Promise<MountResult>

async function resetViewportState(page: Page) {
  await page.mouse.move(0, 0)
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollLeft = 0
    document.documentElement.scrollTop = 0
    document.body.scrollLeft = 0
    document.body.scrollTop = 0
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollTop) el.scrollTop = 0
      if (el.scrollLeft) el.scrollLeft = 0
    })
  }).catch(() => {})
  await page.waitForFunction(() => window.scrollX === 0 && window.scrollY === 0)
}

async function gotoGallery(page: Page) {
  await page.goto('/playwright/index.html')
  await page.waitForFunction(() => typeof window.mount === 'function')
  await resetViewportState(page)
}

async function callMount(page: Page, story: string, props?: Record<string, unknown>) {
  try {
    await page.evaluate(async ({ story, props }) => {
      await window.mount({ story, props })
    }, { story, props })
  } catch (err: any) {
    if (err?.message?.includes('Execution context was destroyed')) {
      await page.waitForFunction(() => typeof window.mount === 'function')
      await page.evaluate(async ({ story, props }) => {
        await window.mount({ story, props })
      }, { story, props })
      return
    }
    throw err
  }
}

async function callUnmount(page: Page) {
  await page.evaluate(async () => {
    await window.unmount()
  })
}

function asMountResult(page: Page, story: string, root: Locator): MountResult {
  return Object.assign(root, {
    update: async (newProps: Record<string, unknown>) => {
      await callMount(page, story, newProps)
    },
    unmount: async () => {
      await callUnmount(page)
    },
  })
}

function createMount(page: Page): MountFn {
  return async (story, props) => {
    await callMount(page, story, props)
    return asMountResult(page, story, page.locator('#root'))
  }
}

async function galleryReactVersion(page: Page) {
  return page.evaluate(
    () => document.documentElement.getAttribute('data-react-version') || '',
  )
}

async function isReact19Gallery(page: Page) {
  const version = await galleryReactVersion(page)
  return version ? version.startsWith(defaultMajor) : isDefaultMajor()
}

function snapshotFileName(name: string) {
  return /\.(png|webp)$/i.test(name) ? name : `${name}.png`
}

export const test = base.extend<{ mount: MountFn }>({
  mount: async ({ page }, use) => {
    await gotoGallery(page)
    await use(createMount(page))
    await callUnmount(page).catch(() => {})
    await resetViewportState(page)
  },
})

test.beforeEach(async ({ page }) => {
  await resetViewportState(page)
})

export { expect }

/**
 * Engine-aware sequential keyboard traversal (FINISH-02F-WK vehicle).
 *
 * Playwright WebKit (= Safari defaults, full keyboard access off) skips
 * natively-tabbable implicit controls (buttons/links) on plain Tab: focus
 * leaves the document (document.hasFocus() === false) instead of landing on
 * the next button. Destinations with an explicit tabindex=0 ARE reached.
 * Option+Tab is Safari's traverse-all-controls chord and reaches implicit
 * destinations in both directions (proven D8/D8b/D8c, r17+r18 WK).
 * Non-WebKit engines keep the honest plain Tab.
 */
export async function pressTab(page: Page, direction: 'forward' | 'back' = 'forward'): Promise<void> {
  const name = page.context().browser()?.browserType().name()
  if (name === 'webkit') {
    await page.keyboard.press(direction === 'back' ? 'Alt+Shift+Tab' : 'Alt+Tab')
  } else if (direction === 'back') {
    await page.keyboard.press('Shift+Tab')
  } else {
    await page.keyboard.press('Tab')
  }
}

/** True when the page runs under Playwright WebKit (Safari-default traversal). */
export function isWebKit(page: Page): boolean {
  return page.context().browser()?.browserType().name() === 'webkit'
}

/** Settled visual snapshot of the CT viewport or targeted locator. Motion is covered by video, not this. */
export async function snap(
  target: Page | Locator,
  name: string,
  options?: Parameters<ReturnType<typeof expect>['toHaveScreenshot']>[1]
) {
  const page = 'page' in target && typeof (target as Locator).page === 'function'
    ? (target as Locator).page()
    : (target as Page)
  if (!(await isReact19Gallery(page))) return
  await expect(target as any).toHaveScreenshot(snapshotFileName(name), {
    ...options,
  })
}

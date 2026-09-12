import { test as base, expect, type Locator, type Page } from '@playwright/test'
import { defaultMajor, isDefaultMajor } from './runtimes'

export type MountResult = Locator & {
  update: (newProps: Record<string, unknown>) => Promise<void>
  unmount: () => Promise<void>
}

export type MountFn = (story: string, props?: Record<string, unknown>) => Promise<MountResult>

async function gotoGallery(page: Page) {
  await page.goto('/playwright/index.html')
  await page.waitForFunction(() => typeof window.mount === 'function')
}

async function callMount(page: Page, story: string, props?: Record<string, unknown>) {
  await page.evaluate(async ({ story, props }) => {
    await window.mount({ story, props })
  }, { story, props })
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
  },
})

export { expect }

/** Settled visual snapshot of the CT viewport. Motion is covered by video, not this. */
export async function snap(page: Page, name: string) {
  if (!(await isReact19Gallery(page))) return
  await expect(page).toHaveScreenshot(snapshotFileName(name), { fullPage: false })
}

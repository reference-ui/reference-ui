import { test as base, expect, type Locator, type Page } from '@playwright/test'

export type MountResult = Locator & {
  update: (newProps: Record<string, unknown>) => Promise<void>
  unmount: () => Promise<void>
}

export type MountFn = (story: string, props?: Record<string, unknown>) => Promise<MountResult>

async function gotoGallery(page: Page) {
  await page.goto('/playwright/index.html')
  await page.waitForFunction(() => typeof window.mount === 'function')
}

export const test = base.extend<{ mount: MountFn }>({
  mount: async ({ page }, use) => {
    await gotoGallery(page)

    const mount: MountFn = async (story, props) => {
      await page.evaluate(async ({ story, props }) => {
        await window.mount({ story, props })
      }, { story, props })

      const root = page.locator('#root')
      return Object.assign(root, {
        update: async (newProps: Record<string, unknown>) => {
          await page.evaluate(async ({ story, props }) => {
            await window.mount({ story, props })
          }, { story, props: newProps })
        },
        unmount: async () => {
          await page.evaluate(async () => {
            await window.unmount()
          })
        },
      })
    }

    await use(mount)
    await page.evaluate(async () => {
      await window.unmount()
    }).catch(() => {})
  },
})

export { expect }

/** Settled visual snapshot of the CT viewport. Motion is covered by video, not this. */
export async function snap(page: Page, name: string) {
  const file = /\.(png|webp)$/i.test(name) ? name : `${name}.png`
  await expect(page).toHaveScreenshot(file, { fullPage: false })
}

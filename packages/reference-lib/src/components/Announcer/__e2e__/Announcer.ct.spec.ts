import type { Page } from '@playwright/test'
import { test, expect } from '../../../../playwright/ct'

// No snap(): the host is visually hidden by contract; behavior asserts only.

const PROBE = 'components/Announcer/Announcer/AnnouncerProbe'
const LIFECYCLE = 'components/Announcer/Announcer/AnnouncerLifecycle'
const STRICT = 'components/Announcer/Announcer/AnnouncerStrictLifecycle'
const OVERLAY_FIXTURE = 'components/Announcer/Announcer/AnnouncerOverlayFixture'
const ELECTION = 'components/Announcer/Announcer/AnnouncerElection'
const MULTIDOC = 'components/Announcer/Announcer/AnnouncerMultiDoc'

/** AT-observable mutation log recorded by useAnnouncerLog in the story. */
async function annLog(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { __annLog?: string[] }).__annLog ?? []
  )
}

test('announcer story announces polite and assertive into independent live regions', async ({
  mount,
  page,
}) => {
  await mount('components/Announcer/Announcer/AnnouncerFixture')
  await expect(page.getByTestId('announcer-fixture-root')).toBeVisible()

  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)

  await page.getByTestId('btn-announce-polite').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Polite message #1')
  await expect(page.getByTestId('readout-polite')).toHaveText('Polite message #1')

  await page.getByTestId('btn-announce-assertive').click()
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText(
    'Assertive message #1'
  )
  await expect(page.getByTestId('readout-assertive')).toHaveText('Assertive message #1')

  // Independent channels: assertive traffic leaves polite untouched.
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Polite message #1')

  // Every insertion was an observable DOM mutation.
  const mutations = await page.getByTestId('readout-mutations').textContent()
  expect(Number(mutations)).toBeGreaterThan(0)
})

test('ANN-API-02 / ANN-LIVE-01 / TO-ANN-01: omitted politeness inserts one polite message and no toast', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()
  const polite = page.locator('[data-reference-announcer="polite"]')
  const assertive = page.locator('[data-reference-announcer="assertive"]')

  await page.getByTestId('btn-ann-polite').click()
  await expect(polite).toHaveText('Saved')
  await expect(assertive).toHaveText('')
  await expect(page.locator('[data-reference-toast-id]')).toHaveCount(0)
  expect(await annLog(page)).toContain('polite:Saved')
})

test('ANN-API-04: untargeted announce with one host inserts under that host only', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  // announce('Saved') omits both politeness and document.
  await page.getByTestId('btn-ann-polite').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Saved')
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)

  const placement = await page.evaluate(() => {
    const host = document.querySelector('[data-reference-announcer-host]')
    const root = document.getElementById('root')
    return {
      inRoot: Boolean(host && root && root.contains(host)),
      directBodyChild: Boolean(document.querySelector('body > [data-reference-announcer-host]')),
    }
  })
  expect(placement).toEqual({ inRoot: true, directBodyChild: false })
})

test('ANN-API-03: explicit document writes only the targeted document', async ({
  mount,
  page,
}) => {
  await mount(MULTIDOC)
  await expect(page.getByTestId('md-ready')).toHaveText('ready')
  const frame = page.frameLocator('[data-testid="md-frame"]')
  const topPolite = page.locator('#root [data-reference-announcer="polite"]')
  const framePolite = frame.locator('[data-reference-announcer="polite"]')

  await page.getByTestId('btn-md-top').click()
  await expect(topPolite).toHaveText('Top')
  await expect(framePolite).toHaveText('')

  await page.getByTestId('btn-md-frame').click()
  await expect(framePolite).toHaveText('Frame')
  await expect(topPolite).toHaveText('Top')

  const docs = await page.evaluate(() => {
    const top = document.querySelector('#root [data-reference-announcer="polite"]')
    const frameEl = document.querySelector('[data-testid="md-frame"]') as HTMLIFrameElement | null
    const frameRegion = frameEl?.contentDocument?.querySelector(
      '[data-reference-announcer="polite"]'
    )
    return {
      topOwnerIsTop: top?.ownerDocument === document,
      frameOwnerIsFrame:
        Boolean(frameRegion) && frameRegion?.ownerDocument === frameEl?.contentDocument,
      adopted: Boolean(frameRegion) && frameRegion?.ownerDocument === document,
    }
  })
  expect(docs).toEqual({ topOwnerIsTop: true, frameOwnerIsFrame: true, adopted: false })
})

test('ANN-API-05: ambiguous untargeted call no-ops with one dev diagnostic (RL-ROOT-08 freeze)', async ({
  mount,
  page,
}) => {
  // Story modules load lazily at mount; a dev-like process global must exist
  // before Announcer.tsx first evaluates its NODE_ENV gate.
  await page.evaluate(() => {
    ;(globalThis as unknown as { process?: unknown }).process = { env: { NODE_ENV: 'test' } }
  })
  const warnings: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'warning') warnings.push(msg.text())
  })

  await mount(MULTIDOC)
  await expect(page.getByTestId('md-ready')).toHaveText('ready')
  const frame = page.frameLocator('[data-testid="md-frame"]')
  const topPolite = page.locator('[data-reference-announcer="polite"]')
  const framePolite = frame.locator('[data-reference-announcer="polite"]')

  await page.getByTestId('btn-md-top').click()
  await expect(topPolite).toHaveText('Top')
  await page.getByTestId('btn-md-frame').click()
  await expect(framePolite).toHaveText('Frame')

  await page.getByTestId('btn-md-untargeted').click()
  await page.getByTestId('btn-md-untargeted').click()
  await page.waitForTimeout(300)
  await expect(topPolite).toHaveText('Top')
  await expect(framePolite).toHaveText('Frame')

  expect(warnings.filter(w => w.includes('ambiguous untargeted call'))).toHaveLength(1)
})

test('ANN-DOM-01 + PATCHES#1: one host with two contract live regions, no testids, outside the toast host', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()
  const host = page.locator('[data-reference-announcer-host]')
  await expect(host).toHaveCount(1)
  await expect(host).toHaveAttribute('data-reference-overlay-ignore', '')

  const polite = page.locator('[data-reference-announcer="polite"]')
  const assertive = page.locator('[data-reference-announcer="assertive"]')
  await expect(polite).toHaveAttribute('role', 'status')
  await expect(polite).toHaveAttribute('aria-live', 'polite')
  await expect(polite).toHaveAttribute('aria-atomic', 'true')
  await expect(assertive).toHaveAttribute('role', 'alert')
  await expect(assertive).toHaveAttribute('aria-live', 'assertive')
  await expect(assertive).toHaveAttribute('aria-atomic', 'true')
  await expect(host.locator('[data-reference-announcer="polite"]')).toHaveCount(1)
  await expect(host.locator('[data-reference-announcer="assertive"]')).toHaveCount(1)
  await expect(
    page.locator('[data-reference-toast-host] [data-reference-announcer-host]')
  ).toHaveCount(0)

  // PATCHES#1: contract selectors are the only selectors in host output.
  await expect(host).not.toHaveAttribute('data-testid')
  await expect(host.locator('[data-testid]')).toHaveCount(0)
})

test('ANN-DOM-02: host is clipped 1x1 without aria-hidden; AT visibility is the live attributes', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  const dom = await page.evaluate(() => {
    const host = document.querySelector('[data-reference-announcer-host]') as HTMLElement | null
    const regions = [...document.querySelectorAll('[data-reference-announcer]')] as HTMLElement[]
    const style = host ? getComputedStyle(host) : null
    return {
      hostStyle: style
        ? {
            position: style.position,
            width: style.width,
            height: style.height,
            overflow: style.overflow,
            clip: style.clip,
          }
        : null,
      ariaHidden: [host, ...regions].map(el => el?.getAttribute('aria-hidden') ?? null),
    }
  })
  expect(dom.hostStyle).toMatchObject({
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
  })
  expect(dom.hostStyle?.clip.startsWith('rect(')).toBe(true)
  expect(dom.ariaHidden).toEqual([null, null, null])

  // The proof is the live attributes, not a Playwright visibility bounding box.
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveAttribute(
    'aria-live',
    'polite'
  )
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveAttribute(
    'aria-live',
    'assertive'
  )
})

test('ANN-DOM-03: live regions stay out of the tab order', async ({ mount, page, browserName }) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  const tabIndexes = await page.evaluate(() =>
    [...document.querySelectorAll('[data-reference-announcer-host], [data-reference-announcer]')].map(
      el => (el as HTMLElement).tabIndex
    )
  )
  expect(tabIndexes).toEqual([-1, -1, -1])

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.())
  const hits: string[] = []
  for (let i = 0; i < 16; i += 1) {
    await page.keyboard.press('Tab')
    hits.push(
      await page.evaluate(() => {
        const active = document.activeElement
        if (!active || active === document.body) return 'body'
        if (
          (active as HTMLElement).closest?.(
            '[data-reference-announcer-host], [data-reference-announcer]'
          )
        ) {
          return 'ANNOUNCER'
        }
        return (active as HTMLElement).getAttribute('data-testid') ?? active.tagName
      })
    )
  }
  expect(hits).not.toContain('ANNOUNCER')
  // DIAG D1 (landing-sequence/DIAG.md): WebKit/Safari skips buttons in
  // sequential Tab (keyboard navigation off by default) and this probe's
  // tabbables are buttons, so the walk legitimately never leaves body.
  // The contract (regions unreachable via Tab) is proven above by the
  // tabIndex -1s + zero ANNOUNCER hits; the traversal-sanity leg is
  // Chromium/Firefox-only, and WebKit pins the platform walk instead.
  if (browserName === 'webkit') {
    expect(hits.every(h => h === 'body')).toBe(true)
  } else {
    expect(hits.filter(h => h !== 'body').length).toBeGreaterThan(0)
  }
})

test('ANN-DOM-04: markup in the message is text, not HTML', async ({ mount, page }) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-markup').click()
  const polite = page.locator('[data-reference-announcer="polite"]')
  await expect(polite).toHaveText('<b>Saved</b>')
  await expect(polite.locator('b')).toHaveCount(0)
  expect(await polite.evaluate(el => el.textContent)).toBe('<b>Saved</b>')
})

test('ANN-DOM-06 / ANN-COMP-02 / TO-ANN-04: silent toast has no live semantics; Saved lives only in the polite region', async ({
  mount,
  page,
}) => {
  await mount(OVERLAY_FIXTURE)
  await expect(page.getByTestId('announcer-overlay-root')).toBeVisible()

  await page.getByTestId('btn-ov-toast-silent').click()
  const item = page.locator('[data-reference-toast-id="silent"]')
  await expect(item).toBeVisible()
  await expect(item).toContainText('Payment failed')
  await expect(item).not.toHaveAttribute('aria-live')
  const role = await item.getAttribute('role')
  expect(['status', 'alert']).not.toContain(role)

  await page.getByTestId('btn-ov-announce-polite').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Saved')
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('')
  expect(await item.evaluate(el => el.textContent ?? '')).not.toContain('Saved')
  expect((await annLog(page)).some(e => e.includes('Payment failed'))).toBe(false)
})

test('ANN-LIVE-02 / TO-ANN-02: same-turn polite and assertive are both preserved', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-both').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText(
    'Background sync complete'
  )
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('Session expired')
  const log = await annLog(page)
  expect(log).toContain('polite:Background sync complete')
  expect(log).toContain('assertive:Session expired')
})

test('ANN-LIVE-03 / TO-ANN-05: same message twice produces two observable insertions', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-repeat').click()
  await page.waitForFunction(
    () =>
      ((window as unknown as { __annLog?: string[] }).__annLog ?? []).filter(
        e => e === 'polite:Saved'
      ).length >= 2,
    { timeout: 5000 }
  )
  const entries = (await annLog(page)).filter(e => e === 'polite:Saved' || e === 'polite:')
  const first = entries.indexOf('polite:Saved')
  const last = entries.lastIndexOf('polite:Saved')
  expect(first).toBeGreaterThanOrEqual(0)
  expect(last).toBeGreaterThan(first)
  expect(entries.slice(first, last)).toContain('polite:')
})

test('ANN-LIVE-04 / TO-ANN-07: blanks ignored; text survives the safe interval then recycles silently', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-blanks').click()
  await page.waitForTimeout(200)
  const afterBlanks = await annLog(page)
  expect(
    afterBlanks.every(e => e.startsWith('added-') || e === 'polite:' || e === 'assertive:')
  ).toBe(true)

  await page.getByTestId('btn-ann-complete').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Complete')
  await page.waitForTimeout(3000)
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Complete')
  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 15000 }
  )

  // The clear is not a second message: nothing non-empty follows it.
  const mark = (await annLog(page)).length
  await page.waitForTimeout(500)
  expect(
    (await annLog(page)).slice(mark).filter(e => e !== 'polite:' && e !== 'assertive:')
  ).toEqual([])
})

test('ANN-LIVE-05: same-channel burst settles on the latest message', async ({ mount, page }) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-burst').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Second')
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('')
  const log = await annLog(page)
  expect(log).toContain('polite:Second')
  expect(log).not.toContain('polite:First')
})

test('ANN-LIVE-06: channels recycle on independent deadlines', async ({ mount, page }) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-stagger-a').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('A')
  await page.waitForTimeout(3500)
  await page.getByTestId('btn-ann-stagger-b').click()
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('B')

  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 10000 }
  )
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('B')
  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="assertive"]')?.textContent === '',
    { timeout: 10000 }
  )
})

test('ANN-LIVE-07: recycle clear is not a message; repeat after clear inserts fresh', async ({
  mount,
  page,
}) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-complete').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Complete')
  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 15000 }
  )

  await page.getByTestId('btn-ann-snapshot').click()
  const snap = await page.evaluate(
    () => (window as unknown as { __annSnap?: unknown }).__annSnap
  )
  expect(snap).toMatchObject({ polite: '', assertive: '', pending: [] })

  const mark = (await annLog(page)).length
  await page.getByTestId('btn-ann-complete').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Complete')
  await page.waitForFunction(
    markLength =>
      ((window as unknown as { __annLog?: string[] }).__annLog ?? []).length > (markLength ?? 0),
    mark,
    { timeout: 5000 }
  )
  expect((await annLog(page)).slice(mark)).toContain('polite:Complete')
})

test('ANN-LIFE-01 / TO-ANN-08 / RL-LIFE-02: pre-mount speech stays off-DOM then replays in order', async ({
  mount,
  page,
}) => {
  await mount(LIFECYCLE)
  await expect(page.getByTestId('announcer-lifecycle-root')).toBeVisible()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(0)

  await page.getByTestId('btn-life-queue').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(0)
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveCount(0)

  await page.getByTestId('btn-life-mount').click()
  await expect(page.getByTestId('readout-life-mounted')).toHaveText('mounted')
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Ready')

  const ordered = (await annLog(page)).filter(
    e => e.startsWith('polite:') && e !== 'polite:' && !e.startsWith('added-')
  )
  expect(ordered).toEqual(['polite:Saved', 'polite:Ready'])
})

test('ANN-LIFE-02: pending replay inserts into an already-mounted empty region', async ({
  mount,
  page,
}) => {
  await mount(LIFECYCLE)
  await expect(page.getByTestId('announcer-lifecycle-root')).toBeVisible()

  await page.getByTestId('btn-life-queue').click()
  await page.getByTestId('btn-life-mount').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Ready')

  const log = await annLog(page)
  expect(log.filter(e => e.startsWith('added-polite:'))).toEqual(['added-polite:'])
  expect(log.indexOf('added-polite:')).toBeLessThan(log.indexOf('polite:Saved'))
  expect(log).toContain('polite:Ready')
})

test('ANN-LIFE-03: StrictMode mount replay speaks pending work once', async ({ mount, page }) => {
  await mount(STRICT)
  await expect(page.getByTestId('announcer-strict-root')).toBeVisible()

  await page.getByTestId('btn-strict-queue').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(0)
  await page.getByTestId('btn-strict-mount').click()

  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Ready')
  expect((await annLog(page)).filter(e => e === 'polite:Ready')).toHaveLength(1)
})

test('ANN-LIFE-04: hostless work after unmount re-queues and inserts as a mutation (sticky-activation defect)', async ({
  mount,
  page,
}) => {
  await mount(LIFECYCLE)
  await expect(page.getByTestId('announcer-lifecycle-root')).toBeVisible()

  await page.getByTestId('btn-life-mount').click()
  await page.getByTestId('btn-life-before').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Before')

  await page.getByTestId('btn-life-unmount').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(0)
  await expect(page.getByTestId('readout-life-mounted')).toHaveText('hostless')

  await page.getByTestId('btn-life-after').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(0)

  await page.getByTestId('btn-life-mount').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('After')

  // Sticky `activated` would paint After (or Before) as initial region text.
  const log = await annLog(page)
  const added = log.filter(e => e.startsWith('added-polite:'))
  expect(added[added.length - 1]).toBe('added-polite:')
  expect(log.lastIndexOf('polite:After')).toBeGreaterThan(log.lastIndexOf('added-polite:'))
})

test('ANN-LIFE-05 / RL-LIFE-05: hostless announce across a failover gap is not lost', async ({
  mount,
  page,
}) => {
  await mount(LIFECYCLE)
  await expect(page.getByTestId('announcer-lifecycle-root')).toBeVisible()

  await page.getByTestId('btn-life-mount').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)
  await page.getByTestId('btn-life-unmount').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(0)

  await page.getByTestId('btn-life-restored').click()
  await page.getByTestId('btn-life-mount').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Connection restored')
  expect(
    (await annLog(page)).filter(e => e === 'polite:Connection restored')
  ).toHaveLength(1)
})

test('ANN-LIFE-06: cleared text is not re-spoken when a host mounts after the recycle delay', async ({
  mount,
  page,
}) => {
  await mount(LIFECYCLE)
  await expect(page.getByTestId('announcer-lifecycle-root')).toBeVisible()

  await page.getByTestId('btn-life-mount').click()
  await page.getByTestId('btn-life-old').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Old')
  await page.getByTestId('btn-life-unmount').click()

  await page.waitForTimeout(8000)
  await page.getByTestId('btn-life-mount').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('')

  const log = await annLog(page)
  const tail = log.slice(log.lastIndexOf('added-polite:'))
  expect(tail[0]).toBe('added-polite:')
  expect(tail.filter(e => e === 'polite:Old')).toEqual([])
})

test('ANN-LIFE-07: fifty queued messages replay ordered and settle on the last', async ({
  mount,
  page,
}) => {
  await mount(LIFECYCLE)
  await expect(page.getByTestId('announcer-lifecycle-root')).toBeVisible()

  await page.getByTestId('btn-life-queue50').click()
  await page.getByTestId('btn-life-mount').click()
  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="polite"]')?.textContent === 'msg-49',
    { timeout: 30000 }
  )

  const expected = Array.from(
    { length: 50 },
    (_, i) => `polite:msg-${String(i).padStart(2, '0')}`
  )
  expect((await annLog(page)).filter(e => e.startsWith('polite:msg-'))).toEqual(expected)
})

test('ANN-OV-01: announcer stays non-inert under an isolating Overlay', async ({ mount, page }) => {
  await mount(OVERLAY_FIXTURE)
  await expect(page.getByTestId('announcer-overlay-root')).toBeVisible()

  await page.getByTestId('btn-ov-open').click()
  await expect(page.getByTestId('ov-modal')).toBeVisible()
  await page.getByTestId('btn-ovm-announce-polite').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Saved')

  const isolation = await page.evaluate(() => {
    const flags = (el: Element | null) => ({
      inert: el?.hasAttribute('inert') ?? false,
      managed: el?.hasAttribute('data-overlay-managed-inert') ?? false,
      ariaHidden: el?.getAttribute('aria-hidden') ?? null,
    })
    // inert is inherited: a node under an inert ancestor is isolated too.
    const inertAncestor = (el: Element | null) => {
      let parent = el?.parentElement ?? null
      while (parent) {
        if (parent.hasAttribute('inert')) return true
        parent = parent.parentElement
      }
      return false
    }
    const host = document.querySelector('[data-reference-announcer-host]')
    const regions = [...document.querySelectorAll('[data-reference-announcer]')]
    const sibling = document.querySelector('[data-testid="ov-sibling"]')
    return {
      host: { ...flags(host), inertAncestor: inertAncestor(host) },
      regions: regions.map(el => ({ ...flags(el), inertAncestor: inertAncestor(el) })),
      sibling: { ...flags(sibling), inertAncestor: inertAncestor(sibling) },
    }
  })
  expect(isolation.host).toEqual({ inert: false, managed: false, ariaHidden: null, inertAncestor: false })
  expect(isolation.regions).toEqual([
    { inert: false, managed: false, ariaHidden: null, inertAncestor: false },
    { inert: false, managed: false, ariaHidden: null, inertAncestor: false },
  ])
  expect(
    isolation.sibling.inert || isolation.sibling.managed || isolation.sibling.inertAncestor
  ).toBe(true)
})

test('ANN-OV-02: live regions still receive mutations while hide-outside runs', async ({
  mount,
  page,
}) => {
  await mount(OVERLAY_FIXTURE)
  await expect(page.getByTestId('announcer-overlay-root')).toBeVisible()

  await page.getByTestId('btn-ov-open').click()
  await expect(page.getByTestId('ov-modal')).toBeVisible()

  await page.getByTestId('btn-ovm-announce-polite').click()
  await page.getByTestId('btn-ovm-announce-assertive').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Saved')
  await expect(page.locator('[data-reference-announcer="assertive"]')).toHaveText('Urgent')
})

test('ANN-OV-03: pointer sequence on the announcer host is not an outside press', async ({
  mount,
  page,
}) => {
  await mount(OVERLAY_FIXTURE)
  await expect(page.getByTestId('announcer-overlay-root')).toBeVisible()

  await page.getByTestId('btn-ov-open').click()
  await expect(page.getByTestId('ov-modal')).toBeVisible()

  const dispatchSequence = (selector: string) =>
    page.evaluate(sel => {
      const target = document.querySelector(sel) as HTMLElement
      const pointer = {
        bubbles: true,
        cancelable: true,
        composed: true,
        isPrimary: true,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
      }
      const mouse = { bubbles: true, cancelable: true, composed: true, button: 0 }
      target.dispatchEvent(new PointerEvent('pointerdown', pointer))
      target.dispatchEvent(new MouseEvent('mousedown', mouse))
      target.dispatchEvent(new PointerEvent('pointerup', pointer))
      target.dispatchEvent(new MouseEvent('mouseup', mouse))
      target.dispatchEvent(new MouseEvent('click', mouse))
    }, selector)

  await dispatchSequence('[data-reference-announcer-host]')
  await page.waitForTimeout(300)
  expect(
    await page.evaluate(() => (window as unknown as { __ovLog?: string[] }).__ovLog ?? [])
  ).toEqual([])
  await expect(page.getByTestId('ov-modal')).toBeVisible()

  // Control: the same sequence on an ordinary sibling is an outside press.
  await dispatchSequence('[data-testid="ov-sibling"]')
  await expect
    .poll(
      async () =>
        page.evaluate(() => (window as unknown as { __ovLog?: string[] }).__ovLog ?? []),
      { timeout: 5000 }
    )
    .toContain('outside')
})

test('ANN-OV-04: toast host and announcer host stay distinct overlay-ignored siblings', async ({
  mount,
  page,
}) => {
  await mount(OVERLAY_FIXTURE)
  await expect(page.getByTestId('announcer-overlay-root')).toBeVisible()

  await page.getByTestId('btn-ov-open').click()
  await expect(page.getByTestId('ov-modal')).toBeVisible()
  await page.getByTestId('btn-ovm-toast-silent').click()
  await page.getByTestId('btn-ovm-announce-polite').click()

  await expect(page.locator('[data-reference-toast-host]')).toHaveCount(1)
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)
  await expect(
    page.locator('[data-reference-toast-host] [data-reference-announcer-host]')
  ).toHaveCount(0)
  await expect(page.locator('[data-reference-toast-host]')).toHaveAttribute(
    'data-reference-overlay-ignore',
    ''
  )
  await expect(page.locator('[data-reference-announcer-host]')).toHaveAttribute(
    'data-reference-overlay-ignore',
    ''
  )
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Saved')
  expect(
    await page.locator('[data-reference-toast-id="silent"]').evaluate(el => el.textContent ?? '')
  ).not.toContain('Saved')
})

test('ANN-HOST-01 / RL-ROOT-01 / RL-ROOT-02: announcer renders under the elected root only', async ({
  mount,
  page,
}) => {
  await mount(ELECTION)
  await expect(page.getByTestId('root-primary')).toBeVisible()
  await expect(page.getByTestId('root-standby')).toBeVisible()

  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)
  await expect(
    page.getByTestId('root-primary').locator('[data-reference-announcer-host]')
  ).toHaveCount(1)
  await expect(
    page.getByTestId('root-standby').locator('[data-reference-announcer-host]')
  ).toHaveCount(0)

  await page.getByTestId('btn-el-announce').click()
  await expect(
    page.getByTestId('root-primary').locator('[data-reference-announcer="polite"]')
  ).toHaveText('Once')
  await expect(
    page.getByTestId('root-standby').locator('[data-reference-announcer="polite"]')
  ).toHaveCount(0)
})

test('ANN-HOST-02 / RL-ROOT-03: announcer fails over with the standby root', async ({
  mount,
  page,
}) => {
  await mount(ELECTION)
  await expect(page.getByTestId('root-primary')).toBeVisible()

  await page.getByTestId('btn-el-announce').click()
  await expect(
    page.getByTestId('root-primary').locator('[data-reference-announcer="polite"]')
  ).toHaveText('Once')

  await page.getByTestId('btn-el-unmount-primary').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)
  await expect(
    page.getByTestId('root-standby').locator('[data-reference-announcer-host]')
  ).toHaveCount(1)

  await page.getByTestId('btn-el-handoff').click()
  await expect(
    page.getByTestId('root-standby').locator('[data-reference-announcer="polite"]')
  ).toHaveText('Handoff')
  expect((await annLog(page)).filter(e => e === 'polite:Handoff')).toHaveLength(1)
})

test('ANN-HOST-03 / RL-ROOT-06: host DOM stays inside the winning ShadowRoot', async ({
  mount,
  page,
}) => {
  // FINISH-02F-SL (F30): SCOPED on the r18 gallery — React 18.3.1 drops the
  // nested createRoot().render() that HardenShadow schedules inside the outer
  // host's flushSync (DIAG-A1: the shadow root holds only the empty 43-char
  // mount div on r18 FF + WK + Chromium alike; r17 sync-legacy and r19 commit
  // fine, so this is r18-major, NOT engine-specific). No product defect: the
  // store, pending-replay, and election are sound (r19 36/36 green). Real fix
  // (Toast lane): flushSync the inner root.render in Toast.story.tsx
  // renderInto, mirroring playwright/runtimes/react-18/host.ts — then unskip.
  // Handoff: follow-up crew owns Toast/ (F13 NEST-06 skip is the precedent).
  await mount('components/Toast/Toast/HardenShadow')
  await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
  const galleryMajor = await page.evaluate(
    () => document.documentElement.getAttribute('data-react-version') ?? ''
  )
  test.skip(
    galleryMajor.startsWith('18'),
    'r18 gallery drops nested-root shadow render (F30; unskip after Toast.story flushSync)'
  )

  await page.getByTestId('btn-shadow-announce').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Shadow ready')

  const shadow = await page.evaluate(() => {
    const shadowHost = document.querySelector('[data-testid="shadow-host"]')
    const inShadow = Boolean(
      shadowHost?.shadowRoot?.querySelector('[data-reference-announcer-host]')
    )
    const lightCount = [...document.querySelectorAll('[data-reference-announcer-host]')].filter(
      n => !shadowHost?.shadowRoot?.contains(n)
    ).length
    return { inShadow, lightCount }
  })
  expect(shadow).toEqual({ inShadow: true, lightCount: 0 })
})

test('ANN-HOST-04: an accidental second host never produces a second copy', async ({
  mount,
  page,
}) => {
  await mount(ELECTION)
  await expect(page.getByTestId('root-primary')).toBeVisible()

  await page.getByTestId('btn-el-rogue').click()
  await page.getByTestId('btn-el-announce').click()
  await expect(
    page.locator('[data-reference-announcer="polite"]', { hasText: 'Once' })
  ).toHaveCount(1)

  const texts = await page.evaluate(() =>
    [...document.querySelectorAll('[data-reference-announcer="polite"]')].map(
      el => el.textContent ?? ''
    )
  )
  expect(texts.filter(t => t === 'Once')).toHaveLength(1)
  expect(texts.every(t => t === 'Once' || t === '')).toBe(true)
})

test('ANN-COMP-04: microfrontend host exchange speaks once per call, never doubled', async ({
  mount,
  page,
}) => {
  await mount(ELECTION)
  await expect(page.getByTestId('root-primary')).toBeVisible()

  await page.getByTestId('btn-el-announce').click()
  await expect(
    page.locator('[data-reference-announcer="polite"]', { hasText: 'Once' })
  ).toHaveCount(1)
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)

  await page.getByTestId('btn-el-unmount-primary').click()
  await expect(page.locator('[data-reference-announcer-host]')).toHaveCount(1)

  await page.getByTestId('btn-el-two').click()
  await expect(
    page.getByTestId('root-standby').locator('[data-reference-announcer="polite"]')
  ).toHaveText('Two')
  await expect(page.locator('[data-reference-announcer="polite"]', { hasText: 'Two' })).toHaveCount(
    1
  )
})

test('ANN-ENV-03: per-document stores recycle independently', async ({ mount, page }) => {
  await mount(MULTIDOC)
  await expect(page.getByTestId('md-ready')).toHaveText('ready')
  const frame = page.frameLocator('[data-testid="md-frame"]')

  await page.getByTestId('btn-md-top').click()
  await expect(page.locator('#root [data-reference-announcer="polite"]')).toHaveText('Top')
  await page.waitForTimeout(3500)
  await page.getByTestId('btn-md-frame').click()
  await expect(frame.locator('[data-reference-announcer="polite"]')).toHaveText('Frame')

  await page.waitForFunction(
    () =>
      document.querySelector('#root [data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 10000 }
  )
  await expect(frame.locator('[data-reference-announcer="polite"]')).toHaveText('Frame')
  await page.waitForFunction(
    () =>
      (
        document.querySelector('[data-testid="md-frame"]') as HTMLIFrameElement | null
      )?.contentDocument?.querySelector('[data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 10000 }
  )
})

test('ANN-ENV-06: recycle ignores visibilitychange', async ({ mount, page }) => {
  await mount(PROBE)
  await expect(page.getByTestId('announcer-probe-root')).toBeVisible()

  await page.getByTestId('btn-ann-complete').click()
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Complete')
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await page.waitForTimeout(3000)
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Complete')
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await page.waitForFunction(
    () => document.querySelector('[data-reference-announcer="polite"]')?.textContent === '',
    { timeout: 15000 }
  )
})

test('ANN-COMP-01 / TO-ANN-03: toast announce option speaks through the polite region', async ({
  mount,
  page,
}) => {
  await mount(OVERLAY_FIXTURE)
  await expect(page.getByTestId('announcer-overlay-root')).toBeVisible()

  await page.getByTestId('btn-ov-toast-announced').click()
  const item = page.locator('[data-reference-toast-id="announced"]')
  await expect(item).toBeVisible()
  await expect(item).toContainText('Draft visual')
  await expect(page.locator('[data-reference-announcer="polite"]')).toHaveText('Draft was saved')
})

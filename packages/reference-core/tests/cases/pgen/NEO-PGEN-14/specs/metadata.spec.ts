// metadata.spec.ts — spec for NEO-PGEN-14, the metadata case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing stamp, the DOM prop that never landed, the handler or ref that
// never fired, the unpainted style path, or the leaked key on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The runner hands specs the real Playwright page, whose click member the
// narrow SpecPage shape omits; this interface names just that member.
interface ClickPage {
  click(selector: string): Promise<void>;
}

// The three metadata probes: the variant twin, the dark island, and the
// passthrough probe. The leak sweep below walks exactly these ids.
const PROBE_IDS = ['meta-accent', 'meta-dark', 'meta-dom'] as const;

// Styling and metadata keys that must never land as bare attributes on
// any probe: the sweep fails naming the probe plus the key it caught.
const FORBIDDEN_ATTRS = ['color', 'p', 'css', 'variant', 'colorMode', '_hover'] as const;

interface LeakHit {
  id: string;
  attr: string;
}

// Two utilities: the passthrough probe's sibling color plus its css
// spacing. The metadata twins mint nothing.
function assertSheet(worldDir: string): void {
  const styles = fs.readFileSync(
    path.join(worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const utilityCount = styles.match(/\.neo-pgen14__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);
}

// Variant stamps data-variant and the tag recipe paints the twin; the
// island stamps data-color-mode plus the system layer.
async function assertStamps(page: SpecPage): Promise<void> {
  const accent = page.locator('#meta-accent');
  await accent.waitFor();
  assert.equal(
    await accent.evaluate((el) => el.getAttribute('data-variant')),
    'accent',
    'variant stamps data-variant',
  );
  const accentClass = await accent.evaluate((el) => el.getAttribute('class'));
  assert.ok(accentClass?.includes('ref-div'), `recipe marker class lands, got ${accentClass}`);
  assert.equal(
    await accent.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'tag recipe paints the variant twin',
  );

  const dark = page.locator('#meta-dark');
  await dark.waitFor();
  assert.equal(
    await dark.evaluate((el) => el.getAttribute('data-color-mode')),
    'dark',
    'colorMode stamps data-color-mode',
  );
  assert.equal(
    await dark.evaluate((el) => el.getAttribute('data-layer')),
    'neo-pgen14',
    'island stamps the system layer',
  );
}

// Every DOM prop, the click handler, and the ref reach the host while
// both style paths paint.
async function assertPassthrough(page: SpecPage): Promise<void> {
  const dom = page.locator('#meta-dom');
  await dom.waitFor();
  assert.equal(
    await dom.evaluate((el) => el.getAttribute('aria-label')),
    'meta target',
    'aria lands',
  );
  assert.equal(
    await dom.evaluate((el) => el.getAttribute('data-testid')),
    'meta-dom',
    'data lands',
  );
  assert.equal(await dom.evaluate((el) => el.getAttribute('title')), 'hi', 'title lands');
  assert.equal(
    await dom.evaluate((el) => el.getAttribute('data-ref')),
    'seen',
    'ref callback receives the host element',
  );
  assert.equal(
    await dom.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'sibling color paints',
  );
  assert.equal(
    await dom.evaluate((el) => getComputedStyle(el).paddingTop),
    '8px',
    'css spacing paints',
  );
  const clicks = page.locator('#clicks');
  await clicks.waitFor();
  const clickPage = page as unknown as ClickPage;
  await clickPage.click('#meta-dom');
  assert.equal(
    await clicks.evaluate((el) => el.textContent),
    'clicked',
    'click handler fires through the primitive',
  );
}

// One DOM read over the probes asserts no forbidden key landed anywhere.
// The sweep's inline lists must equal the pinned tables above: dual
// lists drift, so the spec fails itself when they diverge.
async function assertSweep(page: SpecPage): Promise<void> {
  const root = page.locator('#meta-root');
  await root.waitFor();
  const hits = await root.evaluate((el): LeakHit[] => {
    const host = el as HTMLElement;
    const found: LeakHit[] = [];
    for (const id of ['meta-accent', 'meta-dark', 'meta-dom']) {
      const probe = host.querySelector(`#${id}`);
      if (!probe) continue;
      for (const attr of ['color', 'p', 'css', 'variant', 'colorMode', '_hover']) {
        if (probe.hasAttribute(attr)) found.push({ id, attr });
      }
    }
    return found;
  });
  assert.deepEqual(hits, [], `leak sweep stays empty, got ${JSON.stringify(hits)}`);
  assert.deepEqual(
    ['meta-accent', 'meta-dark', 'meta-dom'],
    [...PROBE_IDS],
    'sweep covers every probe id',
  );
  assert.deepEqual(
    ['color', 'p', 'css', 'variant', 'colorMode', '_hover'],
    [...FORBIDDEN_ATTRS],
    'sweep covers every forbidden attr',
  );
}

// Stamps first, passthrough second, leak sweep last.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assertSheet(c.worldDir);
  await assertStamps(page);
  await assertPassthrough(page);
  await assertSweep(page);
}

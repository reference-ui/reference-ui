// media.spec.ts — spec for NEO-PGEN-05, the html-media case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the tag
// whose probe is missing, misnamed, unpainted, unmarked, or leaking, the
// native attr that never landed, or the void probe carrying children.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Probe id plus dom tag for every media probe: 10 family members with the
// picture's inner image pinned individually. The spec asserts each probe's
// element name, paint, marker, layer stamp, and styling-key absence before
// proving the native surface.
const EXPECTED_PROBES: Array<readonly [string, string]> = [
  ['media-audio', 'audio'],
  ['media-canvas', 'canvas'],
  ['media-embed', 'embed'],
  ['media-iframe', 'iframe'],
  ['media-img', 'img'],
  ['media-picture', 'picture'],
  ['media-source', 'source'],
  ['media-img2', 'img'],
  ['media-svg', 'svg'],
  ['media-track', 'track'],
  ['media-video', 'video'],
];

// All probes share one class, so the sheet carries exactly the brand
// utility. Width and height stay out of this world deliberately: both
// names are style props, so the splitter resolves them to utilities
// instead of passing them through as native dimension attrs.
function assertSheet(worldDir: string): void {
  const styles = fs.readFileSync(
    path.join(worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-pgen5__c_brand'), 'sheet carries the brand utility');
  const utilityCount = styles.match(/\.neo-pgen5__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the wanted utilities, got ${utilityCount}`);
}

// One locator read per pinned probe: element name, brand paint, marker,
// layer stamp, and styling-key absence.
async function assertIdentity(page: SpecPage): Promise<void> {
  // One visibility wait establishes the render; the per-probe reads use
  // evaluate alone because source, track, and embed never become visible
  // yet still resolve, paint, stamp, and report their native attrs.
  const root = page.locator('#media-root');
  await root.waitFor();
  const first = page.locator('#media-img');
  await first.waitFor();
  for (const [id, tag] of EXPECTED_PROBES) {
    const probe = page.locator(`#${id}`);
    assert.equal(
      (await probe.evaluate((el) => el.tagName)).toLowerCase(),
      tag,
      `probe ${id} renders its own element`,
    );
    const className = await probe.evaluate((el) => el.getAttribute('class'));
    assert.ok(className?.includes(`ref-${tag}`), `marker class names the ${tag} tag, got ${className}`);
    assert.equal(
      await probe.evaluate((el) => el.getAttribute('data-layer')),
      'neo-pgen5',
      `probe ${id} stamps the system layer`,
    );
    assert.equal(
      await probe.evaluate((el) => el.getAttribute('color')),
      null,
      `color stays off the ${id} element`,
    );
    assert.equal(
      await probe.evaluate((el) => getComputedStyle(el).color),
      'rgb(124, 58, 237)',
      `probe ${id} paints brand`,
    );
  }
}

// Media attrs land on their probes, and the source nests inside its
// picture.
async function assertAttrs(page: SpecPage): Promise<void> {
  const audio = page.locator('#media-audio');
  assert.equal(
    await audio.evaluate((el) => el.hasAttribute('controls')),
    true,
    'audio controls land',
  );
  const img = page.locator('#media-img');
  assert.equal(
    await img.evaluate((el) => el.getAttribute('alt')),
    'pixel',
    'image alt lands',
  );
  assert.ok(
    (await img.evaluate((el) => el.getAttribute('src')))?.startsWith('data:image/gif'),
    'image src lands',
  );
  const iframe = page.locator('#media-iframe');
  assert.equal(
    await iframe.evaluate((el) => el.getAttribute('title')),
    'frame',
    'iframe title lands',
  );
  const source = page.locator('#media-source');
  assert.equal(
    await source.evaluate((el) => el.getAttribute('media')),
    '(min-width: 1px)',
    'source media lands',
  );
  assert.equal(
    await source.evaluate((el) => el.parentElement?.id ?? null),
    'media-picture',
    'source nests inside its picture',
  );
  const track = page.locator('#media-track');
  assert.equal(
    await track.evaluate((el) => el.getAttribute('kind')),
    'captions',
    'track kind lands',
  );
  const video = page.locator('#media-video');
  assert.equal(
    await video.evaluate((el) => el.hasAttribute('controls')),
    true,
    'video controls land',
  );
}

// Style classes land on the svg host while its child stays a native
// circle, and the void probes render childless.
async function assertSvgAndVoids(page: SpecPage): Promise<void> {
  const svg = page.locator('#media-svg');
  const svgClass = await svg.evaluate((el) => el.getAttribute('class'));
  assert.ok(
    svgClass?.includes('ref-svg') && svgClass.includes('neo-pgen5__c_brand'),
    `style classes land on the svg host, got ${svgClass}`,
  );
  assert.equal(
    await svg.evaluate((el) => el.childNodes.length),
    1,
    'svg host carries its native child',
  );
  assert.equal(
    await svg.evaluate((el) => (el.firstChild as Element | null)?.tagName ?? null),
    'circle',
    'everything beneath the svg host stays native SVG',
  );

  for (const id of ['media-img', 'media-img2', 'media-embed', 'media-source', 'media-track']) {
    const probe = page.locator(`#${id}`);
    assert.equal(
      await probe.evaluate((el) => el.childNodes.length),
      0,
      `void probe ${id} renders childless`,
    );
  }
}

// Identity, paint, markers, and silence first; native surface second.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assertSheet(c.worldDir);
  await assertIdentity(page);
  await assertAttrs(page);
  await assertSvgAndVoids(page);
}

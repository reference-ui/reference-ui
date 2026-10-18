// text.spec.ts — spec for NEO-PGEN-02, the html-text case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the tag
// whose probe is missing, misnamed, unpainted, unmarked, or leaking a
// styling key, or the holed array probe that mispaints, on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The 22 html-text dom tags plus the 7 single-letter specials, in render
// order: the spec asserts each probe's element name, paint, marker, layer
// stamp, and styling-key absence in one pass.
const EXPECTED_TAGS = [
  'abbr',
  'bdi',
  'bdo',
  'cite',
  'code',
  'data',
  'del',
  'dfn',
  'em',
  'ins',
  'kbd',
  'mark',
  'rp',
  'rt',
  'ruby',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'a',
  'b',
  'i',
  'p',
  'q',
  's',
  'u',
] as const;

interface TextEntry {
  id: string;
  tag: string;
  className: string;
  layer: string | null;
  colorAttr: string | null;
  color: string;
}

async function paddingOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).paddingTop);
}

// One DOM read over the text root's children: 29 probes, each reporting
// its identity, paint, marker, stamp, and styling-key absence. The holed
// array probes keep 1r through the sm range and jump to 4r at md; the hole
// mints no rule, so the utility count stays at three.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-pgen2__c_brand'), 'sheet carries the brand utility');
  assert.ok(styles.includes('@container (min-width: 768px)'), 'sheet carries the md container rule');
  assert.ok(styles.includes('--spacing-root: 0.25rem'), 'sheet carries the rhythm root');
  const utilityCount = styles.match(/\.neo-pgen2__/g)?.length ?? 0;
  assert.equal(utilityCount, 3, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const root = page.locator('#text-root');
  await root.waitFor();
  const probes = await root.evaluate((el): TextEntry[] =>
    [...el.children].map((child) => {
      const host = child as HTMLElement;
      return {
        id: host.id,
        tag: host.tagName,
        className: host.getAttribute('class') ?? '',
        layer: host.getAttribute('data-layer'),
        colorAttr: host.getAttribute('color'),
        color: getComputedStyle(host).color,
      };
    }),
  );
  assert.equal(
    probes.length,
    EXPECTED_TAGS.length,
    `text root carries one probe per tag, got ${probes.length}`,
  );
  const byId = new Map(probes.map((entry) => [entry.id, entry]));
  for (const tag of EXPECTED_TAGS) {
    const probe = byId.get(`text-${tag}`);
    assert.ok(probe !== undefined, `probe renders for tag ${tag}`);
    assert.equal(
      probe.tag.toLowerCase(),
      tag,
      `tag ${tag} renders its own element, got ${probe.tag}`,
    );
    assert.ok(
      probe.className.includes(`ref-${tag}`),
      `marker class names the ${tag} tag, got ${probe.className}`,
    );
    assert.equal(probe.layer, 'neo-pgen2', `tag ${tag} stamps the system layer`);
    assert.equal(probe.colorAttr, null, `color stays off the ${tag} element`);
    assert.equal(
      probe.color,
      'rgb(124, 58, 237)',
      `tag ${tag} paints brand, got ${probe.color}`,
    );
  }

  assert.equal(await paddingOf(page, 'hole-sm-probe'), '4px', 'holed probe keeps 1r through the sm range');
  assert.equal(await paddingOf(page, 'hole-md-probe'), '16px', 'holed probe paints 4r at md');
  const holed = page.locator('#hole-sm-probe');
  await holed.waitFor();
  assert.equal(
    await holed.evaluate((el) => el.getAttribute('p')),
    null,
    'array style props stay off the element',
  );
}

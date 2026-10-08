// flow.spec.ts — spec for NEO-PGEN-01, the html-flow case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the tag
// whose probe is missing, misnamed, unpainted, unmarked, or leaking a
// styling key on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The 27 html-flow dom tags in render order, pinned against the E1
// vocabulary's html-flow family: the spec asserts each probe's element
// name, paint, marker, layer stamp, and styling-key absence in one pass.
const EXPECTED_TAGS = [
  'address',
  'article',
  'aside',
  'blockquote',
  'dd',
  'div',
  'dl',
  'dt',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'li',
  'main',
  'nav',
  'ol',
  'pre',
  'search',
  'section',
  'ul',
] as const;

interface FlowEntry {
  id: string;
  tag: string;
  className: string;
  layer: string | null;
  colorAttr: string | null;
  cssAttr: string | null;
  color: string;
  background: string;
}

// One DOM read over the flow root's children: 27 probes, each reporting
// its identity, paint, marker, stamp, and styling-key absence. The Article
// probe's css background paints ink while every probe's sibling color
// paints brand; utilities stay at two because all probes share one class.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  assert.ok(
    fs.existsSync(path.join(outDir, 'react/react.mjs')),
    'synced folder carries react/react.mjs',
  );
  assert.ok(
    fs.existsSync(path.join(outDir, 'react/react.d.mts')),
    'synced folder carries react/react.d.mts',
  );

  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('.neo-pgen1__c_brand'), 'sheet carries the brand utility');
  const utilityCount = styles.match(/\.neo-pgen1__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const root = page.locator('#flow-root');
  await root.waitFor();
  const probes = await root.evaluate((el): FlowEntry[] =>
    [...el.children].map((child) => {
      const host = child as HTMLElement;
      const computed = getComputedStyle(host);
      return {
        id: host.id,
        tag: host.tagName,
        className: host.getAttribute('class') ?? '',
        layer: host.getAttribute('data-layer'),
        colorAttr: host.getAttribute('color'),
        cssAttr: host.getAttribute('css'),
        color: computed.color,
        background: computed.backgroundColor,
      };
    }),
  );
  assert.equal(
    probes.length,
    EXPECTED_TAGS.length,
    `flow root carries one probe per tag, got ${probes.length}`,
  );
  const byId = new Map(probes.map((entry) => [entry.id, entry]));
  for (const tag of EXPECTED_TAGS) {
    const probe = byId.get(`flow-${tag}`);
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
    assert.equal(probe.layer, 'neo-pgen1', `tag ${tag} stamps the system layer`);
    assert.equal(probe.colorAttr, null, `color stays off the ${tag} element`);
    assert.equal(probe.cssAttr, null, `css stays off the ${tag} element`);
    assert.equal(
      probe.color,
      'rgb(124, 58, 237)',
      `tag ${tag} paints brand, got ${probe.color}`,
    );
  }
  const article = byId.get('flow-article');
  assert.equal(
    article?.background,
    'rgb(17, 17, 17)',
    `article css background paints ink, got ${article?.background}`,
  );
}

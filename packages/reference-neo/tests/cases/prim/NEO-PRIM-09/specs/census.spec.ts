// census.spec.ts — spec for NEO-PRIM-09, the tag census case. Takes
// { page } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// tag whose probe is missing or whose element name mismatches on failure.
// It also anchors the pinned table to the vendored E1 vocabulary, failing
// on any drift between the census oracle and the shelf.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The 101 platform tags, pinned against the core tag set ([core]
// system/primitives/tags.ts): the world renders one probe per tag and
// this table asserts each probe's element name in a single census read.
const EXPECTED_TAGS = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'bdi',
  'bdo',
  'blockquote',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'main',
  'map',
  'mark',
  'menu',
  'meter',
  'nav',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'search',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'svg',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
] as const;

interface CensusEntry {
  id: string;
  tag: string;
}

// The E1 re-anchor: the pinned tag table must equal the vendored vocabulary's
// dom set at 101. The behavioral census below stays the oracle for rendering;
// this ties the oracle to the shelf so the two can never drift apart.
function assertVocabularyAnchor(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const shelf = path.resolve(here, '..', '..', '..', '..', '..', 'src', 'native', 'generated', 'primitives', 'vocabulary.json');
  const vocab = JSON.parse(fs.readFileSync(shelf, 'utf8')) as { elements: Array<{ dom: string }> };
  const dom = vocab.elements.map((el) => el.dom).sort();
  assert.equal(dom.length, 101, `E1 carries 101 elements, got ${dom.length}`);
  assert.deepEqual(dom, [...EXPECTED_TAGS].sort(), 'census table equals the E1 dom set');
}

// One DOM read over the census root's children: 101 hosts, each tagged
// with its own id, each reporting its own element name. Lowercased tag
// names absorb the SVG case split (svg reports 'svg', HTML reports upper).
export default async function run({ page }: SpecInput): Promise<void> {
  assertVocabularyAnchor();
  const root = page.locator('#census-root');
  await root.waitFor();
  const census = await root.evaluate((el): CensusEntry[] =>
    [...el.children].map((child) => ({ id: child.id, tag: child.tagName })),
  );
  assert.equal(
    census.length,
    EXPECTED_TAGS.length,
    `census root carries one probe per tag, got ${census.length}`,
  );
  const byId = new Map(census.map((entry) => [entry.id, entry.tag]));
  for (const tag of EXPECTED_TAGS) {
    const actual = byId.get(`tag-${tag}`);
    assert.ok(actual !== undefined, `probe renders for tag ${tag}`);
    assert.equal(
      actual.toLowerCase(),
      tag,
      `tag ${tag} renders its own element, got ${actual}`,
    );
  }
}

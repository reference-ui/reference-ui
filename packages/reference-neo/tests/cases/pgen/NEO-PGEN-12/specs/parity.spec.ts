// parity.spec.ts — spec for NEO-PGEN-12, the roster set-parity case. Takes
// { case } from the runner and asserts node-side: the live E2 roster, the
// vendored E1 elements, and canon's live HTML partition carry the same 101
// names, with no SVG-namespace children anywhere. Emits nothing on success;
// throws naming the drifted member, then proves the diff itself by tripping
// it with corrupted copies, so a silent gate can never pass this case.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import {
  assertDetectsDrift,
  assertSetsEqual,
  parseElementsTable,
  parseRustStringBlock,
  readCanonSource,
  readShelfVocabulary,
  rustPackageDir,
} from '../../shared/parity.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The pinned census: 101 HTML hosts under the namespace law (HQ Final §3.9),
// the Svg host itself included, SVG-namespace children never. This number
// lives in E1; the spec pins it here so a quiet roster shrink fails loud.
const PINNED_COUNT = 101;

// E2's seven non-component exports: the runtime trio's contexts plus the
// hook, React's own re-exports, and the per-system bind seam. Pinned exactly
// so E2 gaining or losing a helper export fails as drift, not silence.
const EXPECTED_HELPERS = [
  'ColorModeContext',
  'DocumentContext',
  'Fragment',
  'LayerScopeContext',
  'configurePrimitives',
  'createElement',
  'useColorMode',
];

// The 24 dropped SVG-namespace children (PGEN-07..10 + PGEN-21, retired by
// the namespace law): their absence from every leg is the tripwire that the
// SVG wave never silently folds back into the vocabulary.
const SVG_CHILDREN = [
  'Circle',
  'ClipPath',
  'Defs',
  'Ellipse',
  'ForeignObject',
  'G',
  'Image',
  'Line',
  'LinearGradient',
  'Marker',
  'Mask',
  'Path',
  'Pattern',
  'Polygon',
  'Polyline',
  'RadialGradient',
  'Rect',
  'Stop',
  'Switch',
  'Symbol',
  'Text',
  'Tspan',
  'Use',
  'View',
];

// Live E2 roster: every export minus the seven pinned helpers. The module
// resolves live from the workspace package, so this leg moves the moment
// the RS build does — that is the freshness the case gates.
async function readLiveRoster(): Promise<string[]> {
  const entry = (await import('@reference-ui/rust/primitives')) as unknown as Record<string, unknown>;
  const keys = Object.keys(entry);
  const helpers = keys.filter((key) => EXPECTED_HELPERS.includes(key));
  assertSetsEqual('E2 helper exports', EXPECTED_HELPERS, helpers);
  return keys.filter((key) => !EXPECTED_HELPERS.includes(key));
}

// Canon's tables carry 125 rows (101 HTML + 24 SVG); the namespace partition
// lives in the TS overlay, split by its marker comment. The spec replays the
// generator's own partition read so the HTML leg below is live canon, not a
// second pinned list.
const SVG_MARKER = 'Curated SVG host child elements styled by authors';

function parseOverlayPartition(overlayText: string): { html: string[]; svg: string[] } {
  const lines = overlayText.split('\n');
  const markers = lines.filter((line) => line.includes(SVG_MARKER));
  assert.equal(markers.length, 1, `overlay carries one SVG marker line, got ${markers.length}`);
  const at = lines.findIndex((line) => line.includes(SVG_MARKER));
  const html: string[] = [];
  const svg: string[] = [];
  lines.forEach((line, index) => {
    const target = index < at ? html : svg;
    for (const match of line.matchAll(/'([^']+)'/g)) target.push(match[1]);
  });
  return { html, svg };
}

// Live canon: ELEMENTS plus PRIMITIVE_JSX parsed from the current Rust
// sources with the generator's own block discipline, partitioned by the live
// overlay into the 101 HTML tags this station pins and the 24 retired SVG
// children. Canon has no napi export, so source import is the live read.
async function readLiveCanon(): Promise<{ htmlDom: string[]; htmlJsx: string[]; svgJsx: string[] }> {
  const htmlRs = readCanonSource('html.rs');
  const elements = parseElementsTable(htmlRs);
  const jsx = parseRustStringBlock(htmlRs, 'html.rs', 'pub const PRIMITIVE_JSX');
  assert.equal(elements.length, 125, `canon ELEMENTS carries 125, got ${elements.length}`);
  assert.equal(jsx.length, 125, `canon PRIMITIVE_JSX carries 125, got ${jsx.length}`);
  const jsxFromElements = [...new Set(elements.map((row) => row.jsx))].sort();
  assertSetsEqual('canon ELEMENTS jsx column vs PRIMITIVE_JSX', jsx, jsxFromElements);

  const overlayPath = path.join(rustPackageDir(), 'modules', 'canon', 'generate', 'overlay', 'primitives.ts');
  const overlayText = fs.readFileSync(overlayPath, 'utf8');
  const partition = parseOverlayPartition(overlayText);
  assert.equal(partition.html.length, 101, `overlay HTML partition carries 101, got ${partition.html.length}`);
  assert.equal(partition.svg.length, 24, `overlay SVG partition carries 24, got ${partition.svg.length}`);
  const overlayModule = (await import(pathToFileURL(overlayPath).href)) as unknown as {
    PRIMITIVE_TAGS: readonly string[];
  };
  assert.deepEqual(
    [...partition.html, ...partition.svg],
    [...overlayModule.PRIMITIVE_TAGS],
    'parsed partition equals the imported overlay array',
  );

  const domToJsx = new Map(elements.map((row) => [row.dom, row.jsx] as const));
  const svgLower = partition.svg.map((tag) => tag.toLowerCase());
  const allowed = new Set([...partition.html, ...svgLower]);
  for (const row of elements) {
    if (!allowed.has(row.dom)) throw new Error(`[pgen] ELEMENTS carries <${row.dom}> outside both partitions`);
  }
  const toJsx = (dom: string, lower: boolean): string => {
    const name = domToJsx.get(lower ? dom.toLowerCase() : dom);
    if (!name) throw new Error(`[pgen] overlay tag ${dom} has no ELEMENTS row`);
    return name;
  };
  for (const tag of partition.html) {
    if (tag !== tag.toLowerCase()) throw new Error(`[pgen] <${tag}> needs a React spelling column`);
  }
  return {
    htmlDom: partition.html,
    htmlJsx: partition.html.map((tag) => toJsx(tag, false)),
    svgJsx: partition.svg.map((tag) => toJsx(tag, true)),
  };
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  assert.equal(c.id, 'NEO-PGEN-12', 'spec runs under its own case id');
  assert.equal(SVG_CHILDREN.length, 24, 'the retired SVG list carries all 24 children');
  const shelf = readShelfVocabulary();
  const roster = await readLiveRoster();
  const canon = await readLiveCanon();
  const shelfJsx = shelf.elements.map((el) => el.jsx);
  const shelfDom = shelf.elements.map((el) => el.dom);

  assert.equal(roster.length, PINNED_COUNT, `live E2 roster carries ${PINNED_COUNT}, got ${roster.length}`);
  assert.equal(shelf.elements.length, PINNED_COUNT, `E1 carries ${PINNED_COUNT}, got ${shelf.elements.length}`);
  assert.equal(canon.htmlJsx.length, PINNED_COUNT, `canon HTML partition carries ${PINNED_COUNT}`);

  assertSetsEqual('roster jsx vs E1 elements', shelfJsx, roster);
  assertSetsEqual('E1 elements vs canon HTML partition', canon.htmlJsx, shelfJsx);
  assertSetsEqual('E1 dom vs canon HTML dom', canon.htmlDom, shelfDom);

  assertSetsEqual('retired SVG list vs canon SVG partition', canon.svgJsx, [...SVG_CHILDREN].sort());
  for (const leg of [roster, shelfJsx, canon.htmlJsx]) {
    const leaked = leg.filter((name) => SVG_CHILDREN.includes(name));
    assert.equal(leaked.length, 0, `no SVG-namespace children in the roster, got ${leaked.join(', ')}`);
  }

  assertDetectsDrift(
    'roster-vs-E1',
    shelfJsx,
    roster.filter((name) => name !== 'Div'),
    'Div',
  );
  assertDetectsDrift('E1-vs-canon', canon.htmlJsx, [...shelfJsx, 'Box'], 'Box');
}

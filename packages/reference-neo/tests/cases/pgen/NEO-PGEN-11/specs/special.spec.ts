// special.spec.ts — spec for NEO-PGEN-11, the special-cased roster case.
// Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws
// naming the special whose probe is missing, misnamed, unpainted,
// unmarked, or leaking, the override ref that missed its host interface,
// or the unexpected bundle export on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Probe id plus dom tag for every special probe: the Obj/Var/Map renders
// with native wiring, the three voids, the caption and menu override
// pair, and the caption's table. The spec asserts each probe's element
// name, paint, marker, layer stamp, and styling-key absence.
const EXPECTED_PROBES: Array<readonly [string, string]> = [
  ['sp-obj', 'object'],
  ['sp-var', 'var'],
  ['sp-map', 'map'],
  ['sp-br', 'br'],
  ['sp-hr', 'hr'],
  ['sp-wbr', 'wbr'],
  ['sp-table', 'table'],
  ['sp-caption', 'caption'],
  ['sp-menu', 'menu'],
];

// The 6 value helpers the bound entry re-exports beside the roster: the
// export census pins the bundle to exactly these plus the 101 roster
// names plus css and recipe, with no pattern pack beside them.
const VALUE_HELPERS = [
  'ColorModeContext',
  'DocumentContext',
  'Fragment',
  'LayerScopeContext',
  'createElement',
  'useColorMode',
];

// Known pattern-pack names that must never appear in the bound bundle's
// exports: the exact-set census below already excludes them, and this
// list names the fear explicitly.
const PATTERN_NAMES = [
  'Box',
  'Stack',
  'HStack',
  'VStack',
  'Grid',
  'Wrap',
  'Container',
  'Center',
  'Flex',
];

// The bundle's export block maps minified locals onto public names; this
// returns the public side. The entry shape is the S1 bound contract: one
// trailing export statement over the E2-bound roster.
function bundleExportNames(bundle: string): string[] {
  const block = bundle.match(/export\{([^}]*)\};/);
  assert.ok(block?.[1] !== undefined, 'bound bundle carries one export block');
  return block[1].split(',').map((entry) => {
    const halves = entry.split(' as ');
    return halves.length > 1 ? (halves[1] as string) : (halves[0] as string);
  });
}

// One utility on the sheet; the bound bundle exports exactly the 101
// roster names plus the 6 value helpers plus css and recipe, with the
// pattern names absent and the types bundle pattern-free.
function assertSheetAndCensus(worldDir: string, specsDir: string): void {
  const outDir = path.join(worldDir, '.reference-ui');
  const bundle = fs.readFileSync(path.join(outDir, 'react/react.mjs'), 'utf8');
  const declarations = fs.readFileSync(path.join(outDir, 'react/react.d.mts'), 'utf8');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('.neo-pgen11__c_brand'), 'sheet carries the brand utility');
  const utilityCount = styles.match(/\.neo-pgen11__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  const shelf = path.resolve(
    specsDir,
    '..',
    '..',
    '..',
    '..',
    '..',
    'src',
    'native',
    'generated',
    'primitives',
    'vocabulary.json',
  );
  const vocab = JSON.parse(fs.readFileSync(shelf, 'utf8')) as {
    elements: Array<{ jsx: string }>;
  };
  const expected = [...vocab.elements.map((el) => el.jsx), ...VALUE_HELPERS, 'css', 'recipe'].sort();
  assert.equal(expected.length, 109, `census expects 109 exports, got ${expected.length}`);
  const names = bundleExportNames(bundle).sort();
  assert.deepEqual(
    names,
    expected,
    'bound bundle exports exactly the roster plus helpers plus css and recipe',
  );
  for (const name of PATTERN_NAMES) {
    assert.equal(
      names.includes(name),
      false,
      `pattern pack stays out of the bundle: no ${name}`,
    );
  }
  assert.equal(
    declarations.match(/pattern/gi)?.length ?? 0,
    0,
    'the types bundle names no pattern surface',
  );
}

// One locator read per pinned probe: element name, brand paint, marker,
// layer stamp, and styling-key absence.
async function assertIdentity(page: SpecPage): Promise<void> {
  // One visibility wait establishes the render; the per-probe reads use
  // evaluate alone because the voids never become visible yet still
  // resolve, paint, stamp, and report their childless hosts.
  const root = page.locator('#special-root');
  await root.waitFor();
  const first = page.locator('#sp-var');
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
      'neo-pgen11',
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

// Native attrs land, voids render childless, and the caption and menu
// ref callbacks record their override host interfaces.
async function assertNativeAndRefs(page: SpecPage): Promise<void> {
  const obj = page.locator('#sp-obj');
  assert.equal(
    await obj.evaluate((el) => el.getAttribute('data')),
    'about:blank',
    'object data lands',
  );
  assert.equal(
    await obj.evaluate((el) => el.getAttribute('type')),
    'text/html',
    'object type lands',
  );
  const map = page.locator('#sp-map');
  assert.equal(
    await map.evaluate((el) => el.getAttribute('name')),
    'pgen11',
    'map name lands',
  );
  for (const id of ['sp-br', 'sp-hr', 'sp-wbr']) {
    const probe = page.locator(`#${id}`);
    assert.equal(
      await probe.evaluate((el) => el.childNodes.length),
      0,
      `void probe ${id} renders childless`,
    );
  }

  const caption = page.locator('#sp-caption');
  assert.equal(
    await caption.evaluate((el) => el.getAttribute('data-override')),
    'caption',
    'caption ref receives the HTMLTableCaptionElement override',
  );
  const menu = page.locator('#sp-menu');
  assert.equal(
    await menu.evaluate((el) => el.getAttribute('data-override')),
    'menu',
    'menu ref receives the HTMLMenuElement override',
  );
}

// Identity, paint, markers, silence, and census first; native surface
// and override refs second.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  assertSheetAndCensus(c.worldDir, c.specsDir);
  await assertIdentity(page);
  await assertNativeAndRefs(page);
}

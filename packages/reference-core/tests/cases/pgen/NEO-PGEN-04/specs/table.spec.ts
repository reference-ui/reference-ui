// table.spec.ts — spec for NEO-PGEN-04, the html-table case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the tag
// whose probe is missing, misnamed, unpainted, unmarked, leaking, or
// nested outside its table on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Probe id plus dom tag for every table probe: 9 family members with the
// three rows and two body cells pinned individually, plus the Caption
// guest. The spec asserts each probe's element name, paint, marker, layer
// stamp, and styling-key absence before proving the nesting is real.
const EXPECTED_PROBES: Array<readonly [string, string]> = [
  ['tbl-table', 'table'],
  ['tbl-caption', 'caption'],
  ['tbl-colgroup', 'colgroup'],
  ['tbl-col', 'col'],
  ['tbl-thead', 'thead'],
  ['tbl-tr-head', 'tr'],
  ['tbl-th', 'th'],
  ['tbl-tbody', 'tbody'],
  ['tbl-tr-body', 'tr'],
  ['tbl-td', 'td'],
  ['tbl-tfoot', 'tfoot'],
  ['tbl-tr-foot', 'tr'],
  ['tbl-td-foot', 'td'],
];

// Identity, paint, markers, and silence first: one locator read per
// pinned probe. Real-table nesting second: sections parent the table,
// cells resolve their table ancestor, the col renders childless, and the
// caption paints brand. All probes share one class, so the count stays 1.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-pgen4__c_brand'), 'sheet carries the brand utility');
  const utilityCount = styles.match(/\.neo-pgen4__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the wanted utilities, got ${utilityCount}`);

  // One visibility wait establishes the render; the per-probe reads use
  // evaluate alone because the col never becomes visible yet still
  // resolves, stamps, and reports its childless void.
  const table = page.locator('#tbl-table');
  await table.waitFor();
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
      'neo-pgen4',
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

  for (const section of ['tbl-thead', 'tbl-tbody', 'tbl-tfoot']) {
    const node = page.locator(`#${section}`);
    assert.equal(
      await node.evaluate((el) => el.parentElement?.id ?? null),
      'tbl-table',
      `section ${section} parents the table directly`,
    );
  }
  const cell = page.locator('#tbl-td-foot');
  assert.equal(
    await cell.evaluate((el) => el.closest('table')?.id ?? null),
    'tbl-table',
    'foot cell resolves its table ancestor',
  );
  assert.equal(
    await cell.evaluate((el) => el.closest('tr')?.id ?? null),
    'tbl-tr-foot',
    'foot cell nests inside its own row',
  );
  const col = page.locator('#tbl-col');
  assert.equal(
    await col.evaluate((el) => el.childNodes.length),
    0,
    'the void col renders childless',
  );
  const caption = page.locator('#tbl-caption');
  assert.equal(
    await caption.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'caption paints brand',
  );
}

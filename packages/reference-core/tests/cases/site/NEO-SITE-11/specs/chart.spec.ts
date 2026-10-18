// chart.spec.ts — spec for NEO-SITE-11, the configured-host case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing host entry, the missing utility, or the unpainted chart.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface JsxElementsArtifact {
  merged: string[];
}

// The config list reaches the compile request: the jsx artifact carries
// Chart, the sheet carries the single p_1r utility only the Chart site
// could mint (the Div spread is dynamic and yields nothing), and the
// forwarded node paints the padding.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const jsx = JSON.parse(
    fs.readFileSync(path.join(outDir, 'system/jsx-elements.json'), 'utf8'),
  ) as JsxElementsArtifact;
  assert.ok(jsx.merged.includes('Chart'), 'the jsx artifact carries the Chart host');

  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(styles.includes('.neo-site-11__p_1r {'), 'sheet carries the Chart padding utility');
  const utilityCount = styles.match(/\.neo-site-11__/g)?.length ?? 0;
  assert.equal(utilityCount, 1, `sheet carries exactly the Chart utility, got ${utilityCount}`);

  const chart = page.locator('#chart');
  await chart.waitFor();
  assert.ok(
    (await chart.evaluate((el) => (el as HTMLElement).className)).split(' ').includes('neo-site-11__p_1r'),
    'the forwarded node carries the Chart class',
  );
  assert.equal(
    await chart.evaluate((el) => getComputedStyle(el).paddingTop),
    '4px',
    'the forwarded node paints the Chart padding',
  );
}

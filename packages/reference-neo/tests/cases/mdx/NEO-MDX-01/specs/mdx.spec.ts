// mdx.spec.ts — spec for NEO-MDX-01, the native MDX fragment case.
// Takes { page, case } with the world freshly synced. Emits nothing on success;
// throws naming the missing face, the unpainted family, or the collected decoy
// on failure. The decisive decoy proof is scan-level
// (src/collect/lib/scan/mdx.test.ts) because a compiled fence is inert; this
// spec additionally pins that the fence-only decoy contributes no sheet face.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css'),
    'utf8',
  );

  // The real top-level MDX import is collected: the font fragment prints its
  // @font-face and mints the `.ref-display` family rule.
  assert.ok(styles.includes('@font-face'), 'sheet carries the MDX font face');
  assert.ok(styles.includes('Playfair Display'), 'face names the MDX family');
  assert.ok(styles.includes('url(/fonts/playfair.woff2)'), 'face keeps the MDX src');
  assert.ok(styles.includes('.ref-display'), 'sheet mints the ref-display class');
  assert.ok(styles.includes('var(--fonts-display)'), 'ref-display resolves the family token');

  // The fence-only decoy is never collected: no face, no family, no class.
  assert.ok(!styles.includes('decoyface'), 'sheet carries no decoy face');
  assert.ok(!styles.includes('fenceface'), 'sheet carries no in-doc fence face');
  assert.ok(!styles.includes('.ref-decoyface'), 'sheet mints no decoy class');

  // Browser: the probe paints the family and the face is registered.
  const probe = page.locator('#display');
  await probe.waitFor();
  const family = await probe.evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(family.includes('Playfair Display'), `probe paints the family, got ${family}`);

  const listed = await probe.evaluate(() =>
    Array.from(document.fonts).map((face) => face.family.replaceAll('"', '')),
  );
  assert.ok(listed.includes('Playfair Display'), `document.fonts lists the family, got ${listed}`);
  assert.ok(!listed.includes('decoyface'), `document.fonts omits the decoy, got ${listed}`);
}

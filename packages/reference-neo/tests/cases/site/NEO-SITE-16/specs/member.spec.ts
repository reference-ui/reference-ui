// member.spec.ts — spec for NEO-SITE-16, the member-host case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing member utility, the leaked twin utility, or the unpainted probe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The NS.Panel member tag matches the NSPanel host: the sheet carries
// exactly its two utilities and the member paints both. The unhosted
// Other.Panel twin emits no utility and renders with a transparent back.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('.neo-site-16__c_brand'), 'sheet carries member color');
  assert.ok(styles.includes('.neo-site-16__p_sm'), 'sheet carries member spacing');
  assert.ok(!styles.includes('bg_paper'), 'sheet carries no twin utility');
  const utilityCount = styles.match(/\.neo-site-16__/g)?.length ?? 0;
  assert.equal(utilityCount, 2, `sheet carries exactly the member utilities, got ${utilityCount}`);

  const member = page.locator('#member');
  await member.waitFor();
  assert.equal(
    await member.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'member paints brand',
  );
  assert.equal(
    await member.evaluate((el) => getComputedStyle(el).paddingTop),
    '8px',
    'member paints spacing',
  );

  const twin = page.locator('#twin');
  await twin.waitFor();
  assert.equal(
    await twin.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgba(0, 0, 0, 0)',
    'twin renders with no backdrop',
  );
}

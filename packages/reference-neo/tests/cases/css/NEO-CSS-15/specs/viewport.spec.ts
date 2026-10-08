// viewport.spec.ts — spec for NEO-CSS-15, the viewport media probes case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// missing 840px rule or the width that mispainted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function paint(page: SpecPage): Promise<{ padding: string; background: string; color: string }> {
  const probe = page.locator('#probe');
  await probe.waitFor();
  return probe.evaluate((el) => {
    const style = getComputedStyle(el);
    return { padding: style.paddingTop, background: style.backgroundColor, color: style.color };
  });
}

// The 840px block wraps the queried rule — never a selector fragment — and
// the viewport gates it: 760px paints the base branch, 960px paints the
// media branch.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('@media (min-width: 840px)'), 'sheet carries the 840px media block');
  assert.ok(styles.includes('padding-top: 20px'), 'sheet carries the queried padding');

  await page.setViewportSize({ width: 760, height: 900 });
  const narrow = await paint(page);
  assert.equal(narrow.padding, '0px', 'below the threshold the base padding paints');
  assert.equal(narrow.background, 'rgba(0, 0, 0, 0)', 'below the threshold the base background paints');

  await page.setViewportSize({ width: 960, height: 900 });
  const wide = await paint(page);
  assert.equal(wide.padding, '20px', 'above the threshold the queried padding paints');
  assert.equal(wide.background, 'rgb(124, 58, 237)', 'above the threshold the queried background paints');
  assert.equal(wide.color, 'rgb(255, 255, 255)', 'above the threshold the queried foreground paints');
}

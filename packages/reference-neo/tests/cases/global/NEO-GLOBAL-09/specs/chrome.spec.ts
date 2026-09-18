// chrome.spec.ts — spec for NEO-GLOBAL-09, the no-panda-chrome case.
// Takes { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the leaked
// chrome, the vacuous layer, or the stray global.css file on failure.
import assert from 'node:assert/strict';
import fs, { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The world authors one token-coloured rule, so the global layer is compiled
// and non-empty. The sheet must carry no Panda signature and none of the
// universal transform/filter var dump; the styled folder must contain no
// global.css file; the witness rule must still paint its token colour, which
// proves the negative was checked against a real compiled layer.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styledDir = path.join(c.worldDir, '.reference-ui/styled');
  const styles = fs.readFileSync(path.join(styledDir, 'styles.css'), 'utf8');

  assert.ok(!styles.includes('--made-with-panda'), 'sheet carries no Panda signature');
  for (const marker of ['--blur:', '--scale-y:', '--translate-x:', '*,::before']) {
    assert.ok(!styles.includes(marker), `sheet carries no var-dump marker ${marker}`);
  }

  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  assert.ok(
    styles.slice(globalOpen).includes('color: var(--colors-ui-plain-ink)'),
    'global layer carries the witness rule, so the negative is not vacuous',
  );

  assert.equal(
    existsSync(path.join(styledDir, 'global.css')),
    false,
    'styled folder contains no global.css file',
  );
  assert.ok(
    !readdirSync(styledDir).includes('global.css'),
    `styled listing omits global.css, got ${readdirSync(styledDir)}`,
  );

  const probe = page.locator('#probe');
  await probe.waitFor();
  const color = await probe.evaluate((el) => getComputedStyle(el).color);
  assert.equal(color, 'rgb(124, 58, 237)', `witness paints the token colour, got ${color}`);
}

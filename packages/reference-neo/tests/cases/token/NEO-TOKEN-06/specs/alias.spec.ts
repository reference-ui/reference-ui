// alias.spec.ts — spec for NEO-TOKEN-06, the semantic-alias case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the probe
// whose computed background missed the direct token on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function backgroundOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => getComputedStyle(el).backgroundColor);
}

// Each alias link must print as a var() pointing at the next link, never an
// inlined hex, and the utility must consume the chain head by var. Both
// probes resolve through the chain to the same red by construction.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(
    styles.includes('--colors-danger: var(--colors-red-500)'),
    'sheet keeps the first alias link as a var()',
  );
  assert.ok(
    styles.includes('--colors-critical: var(--colors-danger)'),
    'sheet keeps the chained alias link as a var()',
  );
  assert.ok(
    !styles.includes('--colors-danger: #ef4444'),
    'sheet never inlines the leaf hex into the alias',
  );
  assert.ok(
    !styles.includes('--colors-critical: #ef4444'),
    'sheet never inlines the leaf hex into the chain head',
  );
  assert.ok(
    styles.includes('background-color: var(--colors-critical)'),
    'the utility consumes the chain head by var()',
  );

  const probe = await backgroundOf(page, 'probe');
  const direct = await backgroundOf(page, 'direct');
  assert.equal(probe, direct, `alias chain computes like the direct token, got ${probe} vs ${direct}`);
  assert.equal(probe, 'rgb(239, 68, 68)', 'the chain resolves to the token red');
}

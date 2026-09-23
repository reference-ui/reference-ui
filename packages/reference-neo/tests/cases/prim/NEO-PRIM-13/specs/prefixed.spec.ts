// prefixed.spec.ts — spec for NEO-PRIM-13, the category-prefixed values
// case. Takes { page, case } from the runner with the world freshly synced
// and the page already navigated to it. Emits nothing on success; throws
// naming the mispainted probe, the missing var, or the leaked raw path.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

async function paint(page: SpecPage, id: string): Promise<{ color: string; background: string; border: string }> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => {
    const style = getComputedStyle(el);
    return { color: style.color, background: style.backgroundColor, border: style.borderColor };
  });
}

// Both spellings paint the token colours, and the sheet routes every rule
// through the token var — the raw `colors.*` path never appears as a
// declaration value.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('var(--colors-red-600)'), 'sheet resolves red.600 through the token var');
  assert.ok(styles.includes('var(--colors-yellow-100)'), 'sheet resolves yellow.100 through the token var');
  assert.ok(styles.includes('var(--colors-blue-600)'), 'sheet resolves blue.600 through the token var');
  assert.ok(
    !/:\s*colors\.[a-z0-9.]+/i.test(styles),
    'no raw colors.* path leaks into a declaration value',
  );

  const prefixed = await paint(page, 'prefixed');
  assert.equal(prefixed.color, 'rgb(220, 38, 38)', 'prefixed color paints red.600');
  assert.equal(prefixed.background, 'rgb(254, 243, 199)', 'prefixed background paints yellow.100');
  assert.equal(prefixed.border, 'rgb(37, 99, 235)', 'prefixed border paints blue.600');

  const bare = await paint(page, 'bare');
  assert.equal(bare.color, prefixed.color, 'bare color paints identically');
  assert.equal(bare.background, prefixed.background, 'bare background paints identically');
  assert.equal(bare.border, prefixed.border, 'bare border paints identically');
}

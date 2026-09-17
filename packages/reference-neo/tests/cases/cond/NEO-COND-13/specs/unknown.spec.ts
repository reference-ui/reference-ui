// unknown.spec.ts — spec for NEO-COND-13, the unknown-condition case.
// Takes { page, case } from the runner with the world freshly synced and
// the page already navigated to it. Emits nothing on success; throws
// naming the stray utility, the ghost class, or the sibling that fails
// to paint on failure. A green run proves sync succeeded past the warning.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// One utility, one class, one paint. The sheet carries exactly the base
// sibling utility with no hovr anywhere, the paragraph's class string
// holds the single compiled class with no ghost, and the paragraph
// paints the sibling ink — while reaching this spec at all proves the
// sync hook succeeded despite the engine's unknown-condition warning.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const hits = styles.match(/\.neo-cond-13__[^{\s,]*/g) ?? [];
  assert.equal(new Set(hits).size, 1, `sheet mints only the sibling class, got ${new Set(hits).size}`);
  assert.ok(!styles.includes('hovr'), 'sheet carries no trace of the unknown arm');

  const sibling = page.locator('#sibling');
  await sibling.waitFor();
  const className = await sibling.evaluate((el) => el.className);
  assert.equal(typeof className, 'string', 'paragraph carries a class string');
  assert.equal(className.split(/\s+/).length, 1, `one class and no ghost, got ${className}`);
  assert.ok(!className.includes('hovr'), 'class string carries no ghost of the unknown arm');

  const painted = await sibling.evaluate((el) => getComputedStyle(el).color);
  assert.equal(painted, 'rgb(17, 17, 17)', `sibling paints ink, got ${painted}`);
}

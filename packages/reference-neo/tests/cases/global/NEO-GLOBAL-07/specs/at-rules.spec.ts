// at-rules.spec.ts — spec for NEO-GLOBAL-07, the nested at-rule case.
// Takes { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the unwrapped
// at-rule, the unguarded viewport, or the mis-gated paint on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// Slice the balanced `{…}` block starting at the given `{` offset. The sheet
// nests at-rules, so a bare indexOf('}') would stop at the inner rule close.
function blockOf(text: string, openBrace: number): string {
  let depth = 0;
  for (let i = openBrace; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(openBrace, i + 1);
    }
  }
  throw new Error('unbalanced block in sheet');
}

async function computedColor(page: SpecPage, selector: string): Promise<string> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate((el) => getComputedStyle(el).color);
}

// The world nested two viewport queries and one container query inside
// globalCss rules. The sheet wraps each rule in its at-rule inside @layer
// global with the token var resolved, and the browser gates the paint: the
// matching query repaints, the far one holds base, and the chip flips across
// narrow, wide, and live-resized containers.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const globalOpen = styles.indexOf('@layer global {');
  assert.ok(globalOpen !== -1, 'sheet carries @layer global');
  const globalLayer = styles.slice(globalOpen);

  for (const [query, selector, decl] of [
    ['@media (min-width: 100px)', '.ref-note', 'color: var(--colors-ui-note-match)'],
    ['@media (min-width: 5000px)', '.ref-far', 'color: var(--colors-ui-note-far)'],
    ['@container (min-width: 400px)', '.ref-chip', 'color: var(--colors-ui-note-wide)'],
  ]) {
    const atOpen = globalLayer.indexOf(query);
    assert.ok(atOpen !== -1, `global layer carries ${query}`);
    const block = blockOf(globalLayer, globalLayer.indexOf('{', atOpen));
    assert.ok(block.includes(selector), `${query} wraps ${selector}, got ${block}`);
    assert.ok(block.includes(decl), `${query} resolves the token var, got ${block}`);
  }

  const viewport = page.viewportSize();
  assert.ok(viewport !== null, 'page reports a viewport');
  assert.ok(
    viewport.width > 100 && viewport.width < 5000,
    `viewport sits between the two queries, got ${viewport.width}`,
  );

  assert.equal(
    await computedColor(page, '#note'),
    'rgb(124, 58, 237)',
    'matching media query paints the token colour',
  );
  assert.equal(
    await computedColor(page, '#far'),
    'rgb(17, 17, 17)',
    'never-matching media query holds the base colour',
  );
  assert.equal(
    await computedColor(page, '#narrow-chip'),
    'rgb(17, 17, 17)',
    'narrow container holds the base colour',
  );
  assert.equal(
    await computedColor(page, '#wide-chip'),
    'rgb(59, 130, 246)',
    'wide container paints the gated colour',
  );

  const live = page.locator('#live');
  await live.waitFor();
  assert.equal(await computedColor(page, '#live-chip'), 'rgb(17, 17, 17)', 'live container starts narrow');
  await live.evaluate((el) => {
    el.style.width = '500px';
  });
  assert.equal(
    await computedColor(page, '#live-chip'),
    'rgb(59, 130, 246)',
    'widening the container paints the gated colour',
  );
  await live.evaluate((el) => {
    el.style.width = '300px';
  });
  assert.equal(
    await computedColor(page, '#live-chip'),
    'rgb(17, 17, 17)',
    'narrowing the container restores the base colour',
  );
}

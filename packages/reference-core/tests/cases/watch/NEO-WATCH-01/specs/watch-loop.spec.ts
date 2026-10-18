// watch-loop.spec.ts — spec for NEO-WATCH-01, the live-edit→paint loop port
// of the matrix watch contract. Takes { page, url, case } with the world
// freshly synced and asserts four watched mutations repaint the browser: a
// css() rewrite flips the probe color, a token-value edit flips it again, a
// new fragment file paints its variable, and deleting the fragment unpaints
// it. Emits nothing on success; throws naming the mutation the watcher missed
// or the paint that failed to follow on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { buildWorld } from '../../../../shared/build.ts';
import { sync } from '../../../../../src/sync/index.ts';
import { watchSync } from '../../../../../src/lib/watch/index.ts';

interface SpecInput {
  page: SpecPage;
  url: string;
  case: NeoCase;
}

// Canonical spellings, byte-identical to the committed world sources. The
// changed spellings derive by single-line replacement, so only the intended
// line can ever differ between a mutation and its restore.
const APP_START = `// app.ts — the NEO-WATCH-01 paint entry. It takes the probe node plus the
// generated css() runtime and emits one color class onto #paint. The spec
// rewrites this file mid-run between two color spellings to prove a watched
// edit repaints the browser, then restores the brand spelling in a finally.
import { css } from '@reference-ui/react'

function el(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error(\`missing #\${id}\`)
  return node
}

el('paint').className = css({
  color: 'brand',
})
`;
const APP_CHANGED = APP_START.replace("color: 'brand'", "color: 'ink'");
const TOKENS_START = `// tokens.ts — the NEO-WATCH-01 token fragment. It takes the author tokens()
// collector and emits the brand and ink colors the paint legs flip between.
// The spec edits ink's value mid-run to prove a token change repaints, then
// restores the canonical spelling in a finally.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { value: '#7c3aed' },
    ink: { value: '#1a1a2e' },
  },
})
`;
const TOKENS_CHANGED = TOKENS_START.replace('#1a1a2e', '#0e5c3f');
const FRAGMENT_ADDED = `// fragment.ts — the NEO-WATCH-01 token fragment. It takes the author tokens()
// collector and emits one namespaced color token. The spec adds this file
// mid-run to prove a discovered fragment paints its variable, then deletes
// it to prove the variable unpaints.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    'watch-fragment': {
      primary: { value: '#3f6212' },
    },
  },
})
`;

const BRAND_PAINT = 'rgb(124, 58, 237)';
const INK_PAINT = 'rgb(26, 26, 46)';
const INK_NEW_PAINT = 'rgb(14, 92, 63)';
const FRAGMENT_VALUE = '#3f6212';

const BRAND_RULE = /color\s*:\s*var\(--colors-brand\)/;
const INK_RULE = /(?<!-)color\s*:\s*var\(--colors-ink\)/;

// Poll until cond holds or the budget burns; resyncs cost a full native
// compile, so the budget is generous and the failure names the wait.
async function waitFor(cond: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + 90000;
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Rebuilds the page entry from the current sources. The harness builds once
// pre-serve, so a mid-run call-site edit needs this re-run before its reload
// — the dev-loop order of edit → resync + rebuild → reload → paint.
async function rebuild(worldDir: string): Promise<void> {
  const built = await buildWorld(worldDir);
  if ('error' in built) throw new Error(`world rebuild failed: ${built.error}`);
}

async function openLeg(page: SpecPage, url: string, leg: number): Promise<void> {
  await page.goto(`${url}?leg=${leg}`, { waitUntil: 'load' });
  await page.locator('#paint').waitFor();
}

// Polls the probe's computed color until it settles on the expected paint.
// The reload lands before the sheet applies, so the assert polls instead of
// reading once; the failure names the paint that never arrived.
async function pollPaint(page: SpecPage, expected: string, label: string): Promise<void> {
  const deadline = Date.now() + 10000;
  let actual = '';
  while (Date.now() < deadline) {
    actual = await page.locator('#paint').evaluate((el) => getComputedStyle(el).color);
    if (actual === expected) return;
    await sleep(100);
  }
  assert.equal(actual, expected, `timed out waiting for ${label}`);
}

// Polls the fragment token variable as computed on the probe (inherited from
// the token root). Empty before the fragment exists and after its deletion;
// the authored value while the fragment lives.
async function pollFragmentVar(page: SpecPage, expected: string, label: string): Promise<void> {
  const deadline = Date.now() + 10000;
  let actual = '';
  while (Date.now() < deadline) {
    actual = await page
      .locator('#paint')
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--colors-watch-fragment-primary').trim().toLowerCase());
    if (actual === expected) return;
    await sleep(100);
  }
  assert.equal(actual, expected, `timed out waiting for ${label}`);
}

// The runner synced this world once before serving: normalize the edited
// sources, then start the watcher and prove four mutations each end in
// paint — a css() rewrite, a token-value edit, a fragment add, and a
// fragment delete. Resync waits count deltas, never absolutes, so a
// coalesced burst cannot skip a wait. The watcher stops and the world
// restores in a finally, so no outcome leaves the tree dirty.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const app = path.join(c.worldDir, 'src', 'app.ts');
  const tokensFile = path.join(c.worldDir, 'src', 'tokens.ts');
  const fragment = path.join(c.worldDir, 'src', 'fragment.ts');
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css');
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8');

  fs.writeFileSync(app, APP_START);
  fs.writeFileSync(tokensFile, TOKENS_START);
  fs.rmSync(fragment, { force: true });
  await sync(c.worldDir);
  await rebuild(c.worldDir);
  await openLeg(page, url, 0);
  await pollPaint(page, BRAND_PAINT, 'baseline brand paint');
  assert.ok(!sheet().includes('--colors-watch-fragment-primary'), 'baseline sheet has no fragment variable yet');
  await pollFragmentVar(page, '', 'empty fragment variable at baseline');

  let resyncs = 0;
  const handle = await watchSync(c.worldDir, {
    onResync: () => {
      resyncs += 1;
    },
  });
  try {
    // Let the subscriptions go fully live before the first mutation, so
    // no pre-watch write backfills as a surprise event mid-proof.
    await sleep(500);

    let before = resyncs;
    fs.writeFileSync(app, APP_CHANGED);
    await waitFor(() => resyncs > before, 'resync after the css edit');
    assert.match(sheet(), INK_RULE, 'edited call site aligns the ink utility');
    assert.doesNotMatch(sheet(), BRAND_RULE, 'edited call site drops the brand utility');
    await rebuild(c.worldDir);
    await openLeg(page, url, 1);
    await pollPaint(page, INK_PAINT, 'repaint after the css edit');

    before = resyncs;
    fs.writeFileSync(tokensFile, TOKENS_CHANGED);
    await waitFor(() => resyncs > before, 'resync after the token edit');
    assert.ok(sheet().toLowerCase().includes('#0e5c3f'), 'edited token value lands in the sheet');
    await openLeg(page, url, 2);
    await pollPaint(page, INK_NEW_PAINT, 'repaint after the token edit');

    before = resyncs;
    fs.writeFileSync(fragment, FRAGMENT_ADDED);
    await waitFor(() => resyncs > before, 'resync after the fragment add');
    assert.ok(sheet().includes('--colors-watch-fragment-primary'), 'added fragment paints its variable into the sheet');
    assert.ok(sheet().toLowerCase().includes(FRAGMENT_VALUE), 'added fragment paints its value into the sheet');
    await openLeg(page, url, 3);
    await pollFragmentVar(page, FRAGMENT_VALUE, 'paint after the fragment add');

    before = resyncs;
    fs.rmSync(fragment);
    await waitFor(() => resyncs > before, 'resync after the fragment delete');
    assert.ok(!sheet().includes('--colors-watch-fragment-primary'), 'deleted fragment drops its variable from the sheet');
    await openLeg(page, url, 4);
    await pollFragmentVar(page, '', 'unpaint after the fragment delete');
  } finally {
    await handle.stop();
    fs.writeFileSync(app, APP_START);
    fs.writeFileSync(tokensFile, TOKENS_START);
    fs.rmSync(fragment, { force: true });
    await sync(c.worldDir);
    await rebuild(c.worldDir);
  }
}

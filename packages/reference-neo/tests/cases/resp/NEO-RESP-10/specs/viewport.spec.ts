// viewport.spec.ts — spec for NEO-RESP-10, the viewport contract case.
// Takes { page, case } from the runner with the world freshly synced and the
// page already navigated to it. Emits nothing on success; throws naming the
// contract leg whose branch state diverges from the oracle.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface BranchState {
  paddingTop: string;
  backgroundColor: string;
  borderTopWidth: string;
  borderTopColor: string;
}

async function readState(page: SpecPage, selector: string): Promise<BranchState> {
  const probe = page.locator(selector);
  await probe.waitFor();
  return probe.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      paddingTop: style.paddingTop,
      backgroundColor: style.backgroundColor,
      borderTopWidth: style.borderTopWidth,
      borderTopColor: style.borderTopColor,
    };
  });
}

async function expectMixed(
  page: SpecPage,
  selector: string,
  expected: BranchState,
  leg: string,
): Promise<void> {
  const state = await readState(page, selector);
  assert.equal(state.paddingTop, expected.paddingTop, `${leg}: padding-top`);
  assert.equal(state.backgroundColor, expected.backgroundColor, `${leg}: background`);
  assert.equal(state.borderTopWidth, expected.borderTopWidth, `${leg}: border width`);
  assert.equal(state.borderTopColor, expected.borderTopColor, `${leg}: border color`);
}

// All eight oracle legs in file order: css width below/above 800px, recipe
// height below/above 700px, then the four mixed cells. Each leg sets the
// viewport and asserts exactly its active branches.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  assert.ok(styles.includes('@media (min-width: 800px)'), 'sheet carries the 800px width block');
  assert.ok(styles.includes('@media (min-height: 700px)'), 'sheet carries the 700px height block');
  assert.ok(styles.includes('@container (min-width: 260px)'), 'sheet carries the 260px container block');

  await page.setViewportSize({ width: 720, height: 900 });
  const cssBase = await readState(page, '#css-target');
  assert.equal(cssBase.paddingTop, '0px', 'css() below the width threshold keeps the base padding');
  assert.equal(cssBase.backgroundColor, 'rgba(0, 0, 0, 0)', 'css() below the width threshold keeps the base background');

  await page.setViewportSize({ width: 920, height: 900 });
  const cssActive = await readState(page, '#css-target');
  assert.equal(cssActive.paddingTop, '24px', 'css() above the threshold paints the queried padding');
  assert.equal(cssActive.backgroundColor, 'rgb(124, 58, 237)', 'css() above the threshold paints the queried background');

  await page.setViewportSize({ width: 900, height: 580 });
  const recipeBase = await readState(page, '#recipe-target');
  assert.equal(recipeBase.paddingTop, '0px', 'recipe() below the height threshold keeps the base padding');
  assert.equal(recipeBase.backgroundColor, 'rgba(0, 0, 0, 0)', 'recipe() below the height threshold keeps the base background');

  await page.setViewportSize({ width: 900, height: 820 });
  const recipeActive = await readState(page, '#recipe-target');
  assert.equal(recipeActive.paddingTop, '16px', 'recipe() above the threshold paints the queried padding');
  assert.equal(recipeActive.backgroundColor, 'rgb(15, 118, 110)', 'recipe() above the threshold paints the queried background');

  await page.setViewportSize({ width: 720, height: 900 });
  await expectMixed(page, '#mixed-target-narrow', {
    paddingTop: '0px',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderTopWidth: '0px',
    borderTopColor: 'rgba(0, 0, 0, 0)',
  }, 'mixed narrow below the breakpoint keeps both branches inactive');
  await expectMixed(page, '#mixed-target-wide', {
    paddingTop: '18px',
    backgroundColor: 'rgb(254, 243, 199)',
    borderTopWidth: '0px',
    borderTopColor: 'rgba(0, 0, 0, 0)',
  }, 'mixed wide below the breakpoint applies only the container branch');

  await page.setViewportSize({ width: 920, height: 900 });
  await expectMixed(page, '#mixed-target-narrow', {
    paddingTop: '0px',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderTopWidth: '6px',
    borderTopColor: 'rgb(234, 88, 12)',
  }, 'mixed narrow above the breakpoint applies only the viewport branch');
  await expectMixed(page, '#mixed-target-wide', {
    paddingTop: '18px',
    backgroundColor: 'rgb(254, 243, 199)',
    borderTopWidth: '6px',
    borderTopColor: 'rgb(234, 88, 12)',
  }, 'mixed wide above the breakpoint applies both branches');
}

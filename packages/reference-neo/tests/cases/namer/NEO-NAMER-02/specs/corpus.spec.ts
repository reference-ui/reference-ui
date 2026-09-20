// corpus.spec.ts — spec for NEO-NAMER-02, the browser corpus. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// element whose class list left the golden, the unpainted probe, or the
// missing runtime namer on failure.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const require = createRequire(import.meta.url);
const NAMER_SPECIFIER = '@reference-ui/rust/namer';
const SYSTEM = 'neo-namer-02';

// The pre-cutover plan-derived golden: element id to exact class list, in
// css() merge order. The runtime namer reproduces these lists; the sheet
// below paints them.
const GOLDEN: Record<string, string> = {
  hole: '',
  resp: `${SYSTEM}__c_#111111 ${SYSTEM}__md:c_#333333`,
  obj: `${SYSTEM}__w_1r ${SYSTEM}__md:w_3r`,
  hover: `${SYSTEM}__c_#111111 ${SYSTEM}__hover:c_#222222`,
  bp: `${SYSTEM}__c_#444444 ${SYSTEM}__md:c_#555555`,
  bang: `${SYSTEM}__c_#666666!`,
  font: `${SYSTEM}__font-family_sans ${SYSTEM}__font-weight_400`,
  size: `${SYSTEM}__w_20px ${SYSTEM}__h_20px`,
  border: `${SYSTEM}__bd-w_3px ${SYSTEM}__border-style_solid ${SYSTEM}__bd-c_red`,
  radius: `${SYSTEM}__rounded-tl_4px ${SYSTEM}__rounded-tr_4px`,
  flex: `${SYSTEM}__flex_1_1_0%`,
};

async function classOf(page: SpecPage, id: string): Promise<string> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return (await node.evaluate((el) => el.getAttribute('class'))) ?? '';
}

interface ProbeStyle {
  width: string;
  height: string;
  flex: string;
  borderTopWidth: string;
  borderTopLeftRadius: string;
  color: string;
  fontFamily: string;
}

async function computedOf(page: SpecPage, id: string): Promise<ProbeStyle> {
  const node = page.locator(`#${id}`);
  await node.waitFor();
  return node.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      width: cs.width,
      height: cs.height,
      flex: cs.flex,
      borderTopWidth: cs.borderTopWidth,
      borderTopLeftRadius: cs.borderTopLeftRadius,
      color: cs.color,
      fontFamily: cs.fontFamily,
    };
  });
}

export default async function run({ page, case: c }: SpecInput): Promise<void> {
  void c;
  // Green half: every element carries its golden list and the probes paint.
  for (const [id, expected] of Object.entries(GOLDEN)) {
    const got = await classOf(page, id);
    assert.equal(got, expected, `#${id} carries its golden list, got ${JSON.stringify(got)}`);
  }
  const size = await computedOf(page, 'size');
  assert.equal(size.width, '20px', `size paints its width, got ${size.width}`);
  assert.equal(size.height, '20px', `size paints its height, got ${size.height}`);
  const flex = await computedOf(page, 'flex');
  assert.equal(flex.flex, '1 1 0%', `flex paints its rewrite, got ${flex.flex}`);
  const border = await computedOf(page, 'border');
  assert.equal(border.borderTopWidth, '3px', `border paints its width, got ${border.borderTopWidth}`);
  const radius = await computedOf(page, 'radius');
  assert.equal(
    radius.borderTopLeftRadius,
    '4px',
    `radius paints its corner, got ${radius.borderTopLeftRadius}`,
  );
  const bang = await computedOf(page, 'bang');
  assert.equal(bang.color, 'rgb(102, 102, 102)', `bang paints its ink, got ${bang.color}`);
  const font = await computedOf(page, 'font');
  assert.ok(
    font.fontFamily.includes('Inter'),
    `font paints its family, got ${font.fontFamily}`,
  );

  // Red half: the runtime namer reproduces the same lists. The export is
  // missing until the namer lands beside the engine it mirrors.
  try {
    require.resolve(NAMER_SPECIFIER);
  } catch {
    assert.fail(`the runtime namer is missing: ${NAMER_SPECIFIER} does not resolve`);
  }
}

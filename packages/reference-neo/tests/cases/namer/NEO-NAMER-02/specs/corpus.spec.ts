// corpus.spec.ts — spec for NEO-NAMER-02, the browser corpus. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// element whose class list left the golden, the unpainted probe, the missing
// runtime namer, or the static-sheet pin that drifted from the runtime.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const NAMER_SPECIFIER = '@reference-ui/rust/namer';
const SYSTEM = 'neo-namer-02';
const PREFIX = `${SYSTEM}__`;

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

// The static `ATM-COND-05` oracle pins bare weights beside a family to that
// family's scale (`sans.thin`→200, `serif.normal`→373, `mono.normal`→393).
// The world mirrors the lib font table; the runtime must spell the same
// `fontWeight_<scale>` class for every family × keyword, and a scale miss
// passes the scoped name through raw (`mono.black` → `mono.black`), matching
// the static `lower_weight` fallback.
const FAMILIES = ['sans', 'serif', 'mono'];
const KEYWORDS = ['thin', 'light', 'normal', 'semibold', 'bold', 'black'];
const SCALES: Record<string, Record<string, string>> = {
  sans: { thin: '200', light: '300', normal: '400', semibold: '600', bold: '700', black: '900' },
  serif: { thin: '100', light: '300', normal: '373', semibold: '600', bold: '700', black: '900' },
  mono: { thin: '100', light: '300', normal: '393', semibold: '600', bold: '700' },
};
const KEYWORD_FALLBACK: Record<string, string> = {
  thin: '100',
  light: '300',
  normal: '400',
  semibold: '600',
  bold: '700',
  black: '900',
};

// Runtime-only seam expectations: family×keyword, lone keywords, conflicts,
// conditionals, the dynamic boundary (O5), and the F3 responsive interim.
const WEIGHT_GOLDEN: Record<string, string> = {};
for (const family of FAMILIES) {
  for (const keyword of KEYWORDS) {
    const value = SCALES[family]?.[keyword] ?? `${family}.${keyword}`;
    WEIGHT_GOLDEN[`f-${family}-${keyword}`] =
      `${PREFIX}font-family_${family} ${PREFIX}font-weight_${value}`;
  }
}
for (const keyword of KEYWORDS) {
  WEIGHT_GOLDEN[`lw-${keyword}`] = `${PREFIX}font-weight_${KEYWORD_FALLBACK[keyword]}`;
}
// Two families decline; a first/last-family bug would spell 373/393.
WEIGHT_GOLDEN['w-conflict'] = `${PREFIX}font-family_mono ${PREFIX}font-weight_400`;
// Conditional weight falls back to the base family, the same-`when` font wins.
WEIGHT_GOLDEN['w-hover-fallback'] = `${PREFIX}font-family_serif ${PREFIX}hover:font-weight_373`;
WEIGHT_GOLDEN['w-hover-group'] =
  `${PREFIX}font-family_sans ${PREFIX}hover:font-family_serif ${PREFIX}hover:font-weight_373`;
// Dynamic boundary (O5): the runtime scopes the variable-held `thin` against
// the `display` family (250); the static pass authors no weight want at all.
WEIGHT_GOLDEN['w-dynamic'] = `${PREFIX}font-family_display ${PREFIX}font-weight_250`;
// F3 interim (KNOWN-DIVERGENT): static fans responsive values out before it
// scopes (so it would spell `sans.thin`→200 for the same authored pair), but
// the runtime scopes string queries only and falls these shapes to the
// keyword. `follow-up:` leaf descent needs a breakpoint-`when` decision.
WEIGHT_GOLDEN['w-f3-array'] = `${PREFIX}font-family_sans ${PREFIX}font-weight_100`;
WEIGHT_GOLDEN['w-f3-obj'] = `${PREFIX}font-family_sans ${PREFIX}font-weight_100`;
WEIGHT_GOLDEN['w-f3-font'] = `${PREFIX}font-family_sans ${PREFIX}font-weight_100`;

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
  fontWeight: string;
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
      fontWeight: cs.fontWeight,
    };
  });
}

export default async function run({ page, case: c }: SpecInput): Promise<void> {
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

  // Bare-weight seam: the runtime spells the family scale for every shape.
  for (const [id, expected] of Object.entries(WEIGHT_GOLDEN)) {
    const got = await classOf(page, id);
    assert.equal(got, expected, `#${id} carries its weight list, got ${JSON.stringify(got)}`);
  }

  // The runtime class is only parity if the static sheet backs the same
  // scale: computed style proves the scoped rule paints, not just exists.
  for (const [id, expected] of [
    ['f-sans-thin', '200'],
    ['f-serif-normal', '373'],
    ['f-mono-normal', '393'],
  ] as const) {
    const probe = await computedOf(page, id);
    assert.equal(
      probe.fontWeight,
      expected,
      `#${id} paints the static scale ${expected}, got ${probe.fontWeight}`,
    );
  }

  // Static-sheet pins: the compiler scoped the same three canonical pairs
  // (`ATM-COND-05`), and the dynamic boundary stayed bare — no 250 rule.
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  for (const value of ['200', '373', '393']) {
    assert.ok(
      styles.includes(`font-weight: ${value};`),
      `sheet carries the scoped font-weight: ${value}`,
    );
  }
  assert.ok(!styles.includes('font-weight: 250;'), 'sheet leaves the dynamic 250 weight bare');
  for (const family of FAMILIES) {
    assert.ok(styles.includes(`--fonts-${family}:`), `sheet carries the --fonts-${family} token`);
  }

  // Red half: the runtime namer reproduces the same lists. The export
  // resolves via ESM (require.resolve cannot see import-only subpaths).
  try {
    await import(NAMER_SPECIFIER);
  } catch {
    assert.fail(`the runtime namer is missing: ${NAMER_SPECIFIER} does not resolve`);
  }
}
